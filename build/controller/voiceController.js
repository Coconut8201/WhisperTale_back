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
const fetch_1 = require("../utils/tools/fetch");
const opencc_js_1 = __importDefault(require("opencc-js"));
const converter = opencc_js_1.default.Converter({ from: 'tw', to: 'cn' });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class VoiceController extends Controller_1.Controller {
    constructor() {
        super(...arguments);
        // 上傳聲音並生成語音
        this.UploadVoice = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!req.file) {
                return res.status(400).send("No file uploaded.");
            }
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return res.status(401).send("未授權的訪問");
            }
            const file = req.file;
            const audioName = req.body.audioName;
            const filePath = process.env.dev_saveRecording + `/user_${userId}/${audioName}`; // 存放使用者聲音的目錄
            try {
                yield fs_1.default.promises.mkdir(filePath, { recursive: true });
                const fullPath = path_1.default.join(filePath, `${audioName}.wav`);
                yield fs_1.default.promises.rename(file.path, fullPath);
                const infoTxtDontknowZh = yield (0, fetch_1.whisperCall)(fullPath);
                const infoTxtZh = converter(infoTxtDontknowZh);
                const infoFullPath = path_1.default.join(filePath, 'info.txt');
                yield fs_1.default.promises.writeFile(infoFullPath, infoTxtZh);
                console.log(`File ${audioName} saved successfully in ${filePath} and info.txt is done.`);
                res.send({ code: 200, message: "train voice model success" });
            }
            catch (err) {
                console.error(`Error in UploadVoice:`, err);
                res.status(500).send({ code: 500, message: err.message });
            }
        });
        this.getVoiceList = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _b;
            const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
            try {
                const directoryPath = path_1.default.join(process.env.userVoiceListPath, `user_${userId}`);
                const entries = yield fs_1.default.promises.readdir(directoryPath, { withFileTypes: true });
                const directories = entries
                    .filter(entry => entry.isDirectory())
                    .map(entry => entry.name);
                res.json({ code: 200, listData: directories });
            }
            catch (error) {
                console.error('讀取目錄時發生錯誤:', error);
                res.status(500).json({
                    code: 500,
                    listData: [],
                    error: '無法讀取語音模型列表'
                });
            }
        });
    }
    test(Request, Response) {
        Response.send(`This is VoiceController`);
    }
    testwhisper(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const referPathDir = req.body.referPathDir;
                const audioName = req.body.audioName;
                const fathPath = path_1.default.join(referPathDir, audioName);
                const result = yield (0, fetch_1.whisperCall)(fathPath);
                res.send({ code: 200, message: result });
            }
            catch (error) {
                console.error('Whisper 處理失敗:', error);
                res.status(500).send({ code: 500, message: error.message });
            }
        });
    }
    takeVoice(req, res) {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { storyId, pageIndex } = req.body;
        const voicePath = `${process.env.dev_saveAudio}/user_${userId}/story_${storyId}/page${pageIndex}.wav`;
        console.log(`voicePath: ${voicePath}`);
        if (!fs_1.default.existsSync(voicePath)) {
            return res.status(404).json({ code: 404, message: '無法找到語音' });
        }
        res.sendFile(voicePath);
    }
}
exports.VoiceController = VoiceController;
