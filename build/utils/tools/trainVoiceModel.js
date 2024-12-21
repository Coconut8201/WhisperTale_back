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
exports.genFishVoice = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
// 確認目標dir 存在
function ensureDir(dir) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield promises_1.default.access(dir);
        }
        catch (_a) {
            yield promises_1.default.mkdir(dir, { recursive: true });
        }
    });
}
const executeCommand = (command, args, options) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        const { spawn } = require('child_process');
        const process = spawn(command, args, options);
        let output = '';
        let errorOutput = '';
        process.stdout.on('data', (data) => {
            const chunk = data.toString();
            output += chunk;
            console.log(chunk);
        });
        process.stderr.on('data', (data) => {
            const chunk = data.toString();
            errorOutput += chunk;
            console.error(chunk);
        });
        process.on('close', (code) => {
            if (code !== 0) {
                const errorMessage = `Command exited with code ${code}. Error: ${errorOutput}`;
                console.error(errorMessage);
                resolve(`Error: ${errorMessage}\nOutput: ${output}`);
            }
            else {
                resolve(output);
            }
        });
        process.on('error', (error) => {
            const errorMessage = `Failed to start command: ${error.message}`;
            console.error(errorMessage);
            resolve(`Error: ${errorMessage}`);
        });
    });
});
// 用fish speech 生成聲音
const genFishVoice = (userId, storyId, storyText, voiceName, userVoiceName) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const saveVoicePath = `${process.env.dev_saveAudio}/user_${userId}/story_${storyId}`;
        const userVoicePath = `${process.env.dev_saveRecording}/user_${userId}/${userVoiceName}`;
        const voiceText = yield promises_1.default.readFile(`${userVoicePath}/info.txt`, 'utf-8');
        yield ensureDir(saveVoicePath);
        const command = 'python';
        const args = [
            '-m', 'tools.api_client',
            '--url', process.env.fishSpeechApi,
            '--text', `\"${storyText}。\"`,
            '--reference_audio', `${userVoicePath}/${userVoiceName}.wav`,
            '--reference_text', voiceText,
            '--format', 'wav',
            '--output', path_1.default.join(saveVoicePath, `${voiceName}`),
            '--no-play'
        ];
        const result = yield executeCommand(command, args, {
            shell: true,
            cwd: process.env.fishSpeechDir
        });
        // 檢查結果是否包含錯誤訊息
        return !result.includes('Error:');
    }
    catch (error) {
        console.error('生成語音時發生錯誤:', error);
        return false;
    }
});
exports.genFishVoice = genFishVoice;
