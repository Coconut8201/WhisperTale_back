import { Controller } from "../interfaces/Controller";
import { Request, Response } from "express";
import path from 'path';
import fs from 'fs';
import OpenCC from 'opencc-js';
const converter = OpenCC.Converter({ from: 'tw', to: 'cn' });
import { callLocalWhisper } from "../utils/tools/fetch";
import dotenv from 'dotenv';
dotenv.config();
import ffmpeg from 'fluent-ffmpeg';
import { genF5ttsVoice } from "../utils/tools/f5tts_inference_Voice";

export class VoiceController extends Controller{
    public test(Request:Request, Response:Response){
        Response.send(`This is VoiceController`);
    }

    private async processAudioSegment(filePath: string, infoFullPath: string) {
        const infoText = await callLocalWhisper(filePath);
        if (!infoText) {
            console.warn(`Whisper 未能識別檔案 ${filePath} 的內容`);
            return;
        }

        try {
            const convertedText = converter(infoText) + '。\n\n';
            await fs.promises.appendFile(infoFullPath, convertedText);
        } catch (error) {
            console.error(`轉換文字失敗: ${infoText}`, error);
            await fs.promises.appendFile(infoFullPath, infoText + '。\n');
        }
    }

    private async segmentAudio(sourceAudioPath: string, tempFolder: string): Promise<void> {
        return new Promise((resolve, reject) => {
            ffmpeg()
                .input(sourceAudioPath)
                .outputOptions(['-f segment', '-segment_time 10', '-reset_timestamps 1'])
                .output(path.join(tempFolder, 'segment_%03d.wav'))
                .on('end', (stdout: string | null, stderr: string | null) => resolve())
                .on('error', reject)
                .run();
        });
    }

    public UploadVoice = async(req: Request, res: Response) => {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({ code: 401, message: "未授權的訪問" });
            }

            const { audioName } = req.body;
            const sourceAudioPath = path.join(process.env.dev_saveRecording!, 'temp', `${audioName}.wav`);

            if (!fs.existsSync(sourceAudioPath)) {
                return res.status(400).json({ code: 400, message: `音訊檔案不存在: ${sourceAudioPath}` });
            }

            const userFolder = path.join(process.env.dev_saveRecording!, `user_${userId}`);
            const tempFolder = path.join(process.env.dev_saveRecording!, 'temp');
            const audioFolder = path.join(userFolder, audioName);
            const infoFullPath = path.join(audioFolder, `info.txt`);

            await Promise.all([
                fs.promises.mkdir(audioFolder, { recursive: true }),
                fs.promises.mkdir(tempFolder, { recursive: true })
            ]);

            await this.segmentAudio(sourceAudioPath, tempFolder);

            const files = await fs.promises.readdir(tempFolder);
            const sortedFiles = files.sort((a, b) => {
                const numA = parseInt(a.match(/segment_(\d+)\.wav/)?.[1] || '0');
                const numB = parseInt(b.match(/segment_(\d+)\.wav/)?.[1] || '0');
                return numA - numB;
            });

            const results = [];
            for (const fileName of sortedFiles) {
                const sourcePath = path.join(tempFolder, fileName);
                const fileIndex = parseInt(fileName.match(/segment_(\d+)\.wav/)?.[1] || '0');
                const newFileName = `${audioName}_${fileIndex}.wav`;
                const targetPath = path.join(audioFolder, newFileName);

                try {
                    await fs.promises.rename(sourcePath, targetPath);
                    await this.processAudioSegment(targetPath, infoFullPath);
                    results.push({ originalName: fileName, newName: newFileName, path: targetPath });
                } catch (error) {
                    console.error(`處理檔案 ${fileName} 時發生錯誤:`, error);
                    results.push(null);
                }
            }

            const successfulResults = results.filter(Boolean);
            if (successfulResults.length === 0) {
                return res.status(500).json({ code: 500, message: "所有檔案處理失敗" });
            }

            res.json({ code: 200, message: "所有音檔處理完成", data: successfulResults });
        } catch(err: any) {
            console.error(`Error in UploadVoice:`, err);
            res.status(500).json({ code: 500, message: err.message });
        }
    }

    public async testwhisper(req: Request, res: Response) {
        try {
            const referPathDir = req.body.referPathDir;
            const audioName = req.body.audioName;
            const fathPath = path.join(referPathDir, audioName);
            const result = await callLocalWhisper(fathPath);
            res.send({code: 200, message: result});
        } catch (error: any) {
            console.error('Whisper 處理失敗:', error);
            res.status(500).send({code: 500, message: error.message});
        }
    }

    public getVoiceList = async(req: Request, res: Response) => {
        const userId = (req as any).user?.id;

        try {
            const directoryPath = path.join(process.env.userVoiceListPath!, `user_${userId}`);
            const entries = await fs.promises.readdir(directoryPath, { withFileTypes: true });
            const directories = entries
                .filter(entry => entry.isDirectory())
                .map(entry => entry.name);
            res.json({ code: 200, listData: directories });
        } catch (error) {
            console.error('讀目錄時發生錯誤:', error);
            res.status(500).json({ 
                code: 500, 
                listData: [], 
                error: '無法讀取語音模型列表' 
            });
        }
    }

    public takeVoice(req: Request, res: Response) {
        const userId = (req as any).user?.id;
        const { storyId, pageIndex } = req.body;
        const voicePath = `${process.env.dev_saveF5ttsAudio}/user_${userId}/story_${storyId}/page${pageIndex}.wav`;
        console.log(`voicePath: ${voicePath}`)
        if (!fs.existsSync(voicePath)) {
            return res.status(404).json({code: 404, message: '無法找到語音'});
        }
        res.sendFile(voicePath);
    }

    public async testf5tts(req: Request, res: Response) {
        const userId = (req as any).user?.id;
        const { storyId, pageIndex } = req.body;
        const voicePath = `${process.env.dev_saveF5ttsAudio}/user_${userId}/story_${storyId}/page${pageIndex}.wav`;
        console.log(`voicePath: ${voicePath}`)
        const storyText = "有一隻小狐狸小紅";
        const voiceName = "test";
        const userVoiceName = "Coco"
        const result = await genF5ttsVoice(userId, storyId, storyText, voiceName, userVoiceName);
        res.sendFile(voicePath);
    }
}
