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

    // 上傳聲音並生成語音
    public UploadVoice = async(req: Request, res: Response) => {
        if (!req.file) {
            return res.status(400).send("No file uploaded.");
        }
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).send("未授權的訪問");
        }
        
        const file = req.file;
        const audioName = req.body.audioName;
        const filePath = process.env.dev_saveRecording! + `/${userId}/${audioName}`; // 存放使用者聲音的目錄
        
        try {
            await fs.promises.mkdir(filePath, { recursive: true });
            const fullPath = path.join(filePath, `${audioName}.wav`);
            
            // 使用 promises 版本的 rename
            await fs.promises.rename(file.path, fullPath);
            console.log(`File ${audioName} saved successfully in ${filePath}`);
    
            await trainVoice(audioName);
            res.send({code: 200, message: "train voice model success"});
        } catch(err: any) {
            console.error(`Error in UploadVoice:`, err);
            res.status(500).send({code: 500, message: err.message});
        }
    }

    public async testwhisper(req: Request, res: Response) {
        try {
            const referPathDir = req.body.referPathDir;
            const audioName = req.body.audioName;
            // 注意這裡參數順序的調整，符合新的 whisperCall 函數
            const result = await whisperCall(referPathDir, audioName);
            res.send({code: 200, message: result});
        } catch (error: any) {
            console.error('Whisper 處理失敗:', error);
            res.status(500).send({code: 500, message: error.message});
        }
    }

    public async getVoiceList(req: Request, res: Response) {
        try {
            const directoryPath = process.env.VoiceListPath!;
            const entries = await fs.promises.readdir(directoryPath, { withFileTypes: true });
            const directories = entries
                .filter(entry => entry.isDirectory())
                .map(entry => entry.name);
            res.json({ code: 200, listData: directories });
        } catch (error) {
            console.error('讀取目錄時發生錯誤:', error);
            res.status(500).json({ 
                code: 500, 
                listData: [], 
                error: '無法讀取語音模型列表' 
            });
        }
    }
}