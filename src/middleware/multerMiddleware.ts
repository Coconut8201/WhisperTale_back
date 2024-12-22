import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const userId = (req as any).user?.id;
        const targetDir = path.join(process.env.dev_saveRecording!, 'temp');
        try {
            await fs.promises.mkdir(targetDir, { recursive: true });
            cb(null, targetDir);
        } catch (error) {
            cb(error as Error, targetDir);
        }
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

// 設定檔案過濾器
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.wav' || ext === '.mp3') {
        cb(null, true);
    } else {
        cb(new Error('只接受 WAV 或 MP3 檔案'));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
});

export default upload;
