import { Controller } from "../interfaces/Controller";
import { Request, Response } from "express";
import path from 'path';
import fs from 'fs';
import { whisperCall } from "../utils/tools/fetch";
import dotenv from 'dotenv';
dotenv.config();

export class VoiceController extends Controller{
    public test(Request:Request, Response:Response){
        Response.send(`This is VoiceController`);
    }

    // 上傳多個聲音檔案並生成info.txt 資訊檔案
    // public UploadVoice = async(req: Request, res: Response) => {
    //     if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    //         return res.status(400).send("未上傳任何檔案");
    //     }

    //     const userId = (req as any).user?.id;
    //     if (!userId) {
    //         return res.status(401).send("未授權的訪問");
    //     }

    //     const audioName = req.body.audioName;
    //     const userFolder = path.join(process.env.dev_saveRecording!, `user_${userId}`);
    //     const audioFolder = path.join(userFolder, audioName);
    //     const infoFullPath = path.join(audioFolder, `info.txt`);
        
    //     try {
    //         await fs.promises.mkdir(audioFolder, { recursive: true });
            
    //         const results = [];
        
    //         // 逐個處理檔案，使用 for...of 而不是 map
    //         for (let i = 0; i < req.files.length; i++) {
    //             const file = req.files[i];
    //             try {
    //                 // 產生新檔名
    //                 const partNumber = String(i + 1).padStart(1, '0');
    //                 const newFileName = `${audioName}_${partNumber}.wav`;
    //                 const fullPath = path.join(audioFolder, newFileName);
    
    //                 // 移動並重命名檔案
    //                 await fs.promises.copyFile(file.path, fullPath);
                    
    //                 // 檢查暫存檔是否還存在再刪除
    //                 if (fs.existsSync(file.path)) {
    //                     try {
    //                         await fs.promises.unlink(file.path);
    //                     } catch (unlinkError) {
    //                         console.warn(`刪除暫存檔失敗: ${file.path}`, unlinkError);
    //                     }
    //                 }
    
    //                 results.push({
    //                     originalName: file.originalname,
    //                     newName: newFileName,
    //                     path: fullPath
    //                 });
    //             } catch (error) {
    //                 console.error(`處理檔案 ${file.originalname} 時發生錯誤:`, error);
    //                 // 繼續處理下一個檔案，而不是中斷整個流程
    //                 continue;
    //             }
    //         }
    
    //         // 如果沒有成功處理任何檔案
    //         if (results.length === 0) {
    //             return res.status(500).json({
    //                 code: 500,
    //                 message: "所有檔案處理失敗"
    //             });
    //         }
            
    //         // TODO 檔案內容識別
    //         // for (const fullPath of savedPaths) {
    //         //     const infoTxtDontknowZh = await whisperCall(fullPath);
    //         //     if (!infoTxtDontknowZh) {
    //         //         console.warn(`Whisper 未能識別檔案 ${fullPath} 的內容`);
    //         //         continue;
    //         //     }

    //         //     try {
    //         //         const infoTxtZh: string = converter(infoTxtDontknowZh) + '。';
    //         //         if (infoTxtZh) {
    //         //             await fs.promises.appendFile(infoFullPath, infoTxtZh);
    //         //         }
    //         //     } catch (convErr) {
    //         //         console.error(`轉換文字失敗: ${infoTxtDontknowZh}`, convErr);
    //         //         await fs.promises.appendFile(infoFullPath, infoTxtDontknowZh + '。');
    //         //     }
    //         // }
    
    //         res.send({code: 200, message: "所有音檔處理完成"});
    //     } catch(err: any) {
    //         console.error(`Error in UploadVoice:`, err);
    //         res.status(500).send({code: 500, message: err.message});
    //     }
    // }

    public UploadVoice = async(req: Request, res: Response) => {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).send("未授權的訪問");
            }

            const audioName = req.body.audioName;
            const userFolder = path.join(process.env.dev_saveRecording!, `user_${userId}`);
            const tempFolder = path.join(userFolder, 'temp');
            const audioFolder = path.join(userFolder, audioName);

            await fs.promises.mkdir(audioFolder, { recursive: true });

            const files = await fs.promises.readdir(tempFolder);
            const results = [];

            for (let i = 0; i < files.length; i++) {
                const fileName = files[i];
                const sourcePath = path.join(tempFolder, fileName);
                const partNumber = String(i + 1).padStart(1, '0');
                const newFileName = `${audioName}_${partNumber}.wav`;
                const targetPath = path.join(audioFolder, newFileName);

                try {
                    await fs.promises.rename(sourcePath, targetPath);
                    results.push({
                        originalName: fileName,
                        newName: newFileName,
                        path: targetPath
                    });
                } catch (error) {
                    console.error(`移動檔案 ${fileName} 時發生錯誤:`, error);
                    continue;
                }
            }

            if (results.length === 0) {
                return res.status(500).json({
                    code: 500,
                    message: "所有檔案處理失敗"
                });
            }

            res.send({code: 200, message: "所有音檔處理完成", data: results});
        } catch(err: any) {
            console.error(`Error in UploadVoice:`, err);
            res.status(500).send({code: 500, message: err.message});
        }
    }

    public async testwhisper(req: Request, res: Response) {
        try {
            const referPathDir = req.body.referPathDir;
            const audioName = req.body.audioName;
            const fathPath = path.join(referPathDir, audioName);
            const result = await whisperCall(fathPath);
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
        const voicePath = `${process.env.dev_saveAudio}/user_${userId}/story_${storyId}/page${pageIndex}.wav`;
        console.log(`voicePath: ${voicePath}`)
        if (!fs.existsSync(voicePath)) {
            return res.status(404).json({code: 404, message: '無法找到語音'});
        }
        res.sendFile(voicePath);
    }
}