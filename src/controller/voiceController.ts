import { Controller } from "../interfaces/Controller";
import { Request, Response } from "express";
import path from 'path';
import fs from 'fs';
import { trainVoice } from "../utils/tools/trainVoiceModel";
import { setVoiceModel, whisperCall } from "../utils/tools/fetch";
import dotenv from 'dotenv';
dotenv.config();

export class VoiceController extends Controller{
    public test(Request:Request, Response:Response){
        Response.send(`This is VoiceController`);
    }

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
        await fs.promises.mkdir(filePath, { recursive: true });
        const fullPath = path.join(filePath, `${audioName}.wav`);

        //! 這邊註解要解
        //TODO 解決生成聲音的問題
        // try{
        //     fs.rename(file.path, fullPath, (err) => {
        //         if (err) {
        //             console.error(`Error saving file: ${err.message}`);
        //             return res.status(500).send("Error saving file.");
        //         }

        //         console.log(`File ${audioName} saved successfully in ${filePath}`);
        //     });
    
        //     await trainVoice(audioName);
        //     res.send({code:200, message: "train voice model success"})
        // } catch(err:any){
        //     res.send({code: 500, message: err.message});
        // }
    }

    public async testsetVoiceModel(req:Request, res:Response){
        const modelName = req.body.modelName;
        console.log("modelName: ", modelName);
        const result = await setVoiceModel(modelName);
        res.send(`testsetVoiceModel: ${result.message}`);
    }

    public async testwhisper(req:Request, res:Response){
        const audioName = req.body.audioName;
        const referPathDir = req.body.referPathDir;
        const result = await whisperCall(audioName, referPathDir);
        res.send(`testwhisper: ${result.message}`);
    }

    public async getVoiceList(req: Request, res: Response) {
        try {
            const directoryPath = process.env.VoiceListPath!;
            const entries = await fs.promises.readdir(directoryPath, { withFileTypes: true });
            const directories = entries
                .filter(entry => entry.isDirectory())
                .map(entry => entry.name);
            res.json({ listData: directories });
        } catch (error) {
            console.error('讀取目錄時發生錯誤:', error);
            res.status(500).json({ listData: [], error: '無法讀取語音模型列表' });
        }
    }
}