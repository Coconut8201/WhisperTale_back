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
const opencc_js_1 = __importDefault(require("opencc-js"));
const converter = opencc_js_1.default.Converter({ from: 'tw', to: 'cn' });
const fetch_1 = require("../utils/tools/fetch");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
class VoiceController extends Controller_1.Controller {
    constructor() {
        super(...arguments);
        this.UploadVoice = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return res.status(401).json({ code: 401, message: "未授權的訪問" });
                }
                const { audioName } = req.body;
                const sourceAudioPath = path_1.default.join(process.env.dev_saveRecording, 'temp', `${audioName}.wav`);
                if (!fs_1.default.existsSync(sourceAudioPath)) {
                    return res.status(400).json({ code: 400, message: `音訊檔案不存在: ${sourceAudioPath}` });
                }
                const userFolder = path_1.default.join(process.env.dev_saveRecording, `user_${userId}`);
                const tempFolder = path_1.default.join(process.env.dev_saveRecording, 'temp');
                const audioFolder = path_1.default.join(userFolder, audioName);
                const infoFullPath = path_1.default.join(audioFolder, `info.txt`);
                yield Promise.all([
                    fs_1.default.promises.mkdir(audioFolder, { recursive: true }),
                    fs_1.default.promises.mkdir(tempFolder, { recursive: true })
                ]);
                yield this.segmentAudio(sourceAudioPath, tempFolder);
                const files = yield fs_1.default.promises.readdir(tempFolder);
                const sortedFiles = files.sort((a, b) => {
                    var _a, _b;
                    const numA = parseInt(((_a = a.match(/segment_(\d+)\.wav/)) === null || _a === void 0 ? void 0 : _a[1]) || '0');
                    const numB = parseInt(((_b = b.match(/segment_(\d+)\.wav/)) === null || _b === void 0 ? void 0 : _b[1]) || '0');
                    return numA - numB;
                });
                const results = [];
                for (const fileName of sortedFiles) {
                    const sourcePath = path_1.default.join(tempFolder, fileName);
                    const fileIndex = parseInt(((_b = fileName.match(/segment_(\d+)\.wav/)) === null || _b === void 0 ? void 0 : _b[1]) || '0');
                    const newFileName = `${audioName}_${fileIndex}.wav`;
                    const targetPath = path_1.default.join(audioFolder, newFileName);
                    try {
                        yield fs_1.default.promises.rename(sourcePath, targetPath);
                        yield this.processAudioSegment(targetPath, infoFullPath);
                        results.push({ originalName: fileName, newName: newFileName, path: targetPath });
                    }
                    catch (error) {
                        console.error(`處理檔案 ${fileName} 時發生錯誤:`, error);
                        results.push(null);
                    }
                }
                const successfulResults = results.filter(Boolean);
                if (successfulResults.length === 0) {
                    return res.status(500).json({ code: 500, message: "所有檔案處理失敗" });
                }
                res.json({ code: 200, message: "所有音檔處理完成", data: successfulResults });
            }
            catch (err) {
                console.error(`Error in UploadVoice:`, err);
                res.status(500).json({ code: 500, message: err.message });
            }
        });
        this.getVoiceList = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _c;
            const userId = (_c = req.user) === null || _c === void 0 ? void 0 : _c.id;
            try {
                const directoryPath = path_1.default.join(process.env.userVoiceListPath, `user_${userId}`);
                const entries = yield fs_1.default.promises.readdir(directoryPath, { withFileTypes: true });
                const directories = entries
                    .filter(entry => entry.isDirectory())
                    .map(entry => entry.name);
                res.json({ code: 200, listData: directories });
            }
            catch (error) {
                console.error('讀目錄時發生錯誤:', error);
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
    processAudioSegment(filePath, infoFullPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const infoText = yield (0, fetch_1.callLocalWhisper)(filePath);
            if (!infoText) {
                console.warn(`Whisper 未能識別檔案 ${filePath} 的內容`);
                return;
            }
            try {
                const convertedText = converter(infoText) + '。\n\n';
                yield fs_1.default.promises.appendFile(infoFullPath, convertedText);
            }
            catch (error) {
                console.error(`轉換文字失敗: ${infoText}`, error);
                yield fs_1.default.promises.appendFile(infoFullPath, infoText + '。\n');
            }
        });
    }
    segmentAudio(sourceAudioPath, tempFolder) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                (0, fluent_ffmpeg_1.default)()
                    .input(sourceAudioPath)
                    .outputOptions(['-f segment', '-segment_time 8', '-reset_timestamps 1'])
                    .output(path_1.default.join(tempFolder, 'segment_%03d.wav'))
                    .on('end', (stdout, stderr) => resolve())
                    .on('error', reject)
                    .run();
            });
        });
    }
    testwhisper(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const referPathDir = req.body.referPathDir;
                const audioName = req.body.audioName;
                const fathPath = path_1.default.join(referPathDir, audioName);
                const result = yield (0, fetch_1.callLocalWhisper)(fathPath);
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
