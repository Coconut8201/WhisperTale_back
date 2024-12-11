"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceController = void 0;
const Controller_1 = require("../interfaces/Controller");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const trainVoiceModel_1 = require("../utils/tools/trainVoiceModel");
const fetch_1 = require("../utils/tools/fetch");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class VoiceController extends Controller_1.Controller {
    constructor() {
        super(...arguments);
        this.UploadVoice = (req, res) => __awaiter(this, void 0, void 0, function* () {
            if (!req.file) {
                return res.status(400).send("No file uploaded.");
            }
            const file = req.file;
            const filePath = process.env.dev_saveRecording; // 存放使用者聲音的目錄
            const audioName = req.body.audioName;
            const fullPath = path_1.default.join(filePath, `${audioName}.wav`);
            try {
                fs_1.default.rename(file.path, fullPath, (err) => {
                    if (err) {
                        console.error(`Error saving file: ${err.message}`);
                        return res.status(500).send("Error saving file.");
                    }
                    console.log(`File ${audioName} saved successfully in ${filePath}`);
                });
                yield (0, trainVoiceModel_1.trainVoice)(audioName);
                res.send({ code: 200, message: "train voice model success" });
            }
            catch (err) {
                res.send({ code: 500, message: err.message });
            }
        });
    }
    test(Request, Response) {
        Response.send(`This is VoiceController`);
    }
    testsetVoiceModel(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const modelName = req.body.modelName;
            console.log("modelName: ", modelName);
            const result = yield (0, fetch_1.setVoiceModel)(modelName);
            res.send(`testsetVoiceModel: ${result.message}`);
        });
    }
    testwhisper(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const audioName = req.body.audioName;
            const referPathDir = req.body.referPathDir;
            const result = yield (0, fetch_1.whisperCall)(audioName, referPathDir);
            res.send(`testwhisper: ${result.message}`);
        });
    }
    getVoiceList(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const directoryPath = process.env.VoiceListPath;
                const entries = yield fs_1.default.promises.readdir(directoryPath, { withFileTypes: true });
                const directories = entries
                    .filter(entry => entry.isDirectory())
                    .map(entry => entry.name);
                res.json({ listData: directories });
            }
            catch (error) {
                console.error('讀取目錄時發生錯誤:', error);
                res.status(500).json({ listData: [], error: '無法讀取語音模型列表' });
            }
        });
    }
}
exports.VoiceController = VoiceController;
