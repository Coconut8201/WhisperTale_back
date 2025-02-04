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
exports.callLocalWhisper = exports.fetchImage = exports.whisperCall = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// whisper 語音轉文字
const whisperCall = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    const data = fs_1.default.readFileSync(filePath);
    const response = yield fetch("https://api-inference.huggingface.co/models/openai/whisper-large-v3", {
        headers: {
            Authorization: `Bearer ${process.env.HUGGINFACE_API}`,
            "Content-Type": "application/json",
        },
        method: "POST",
        body: data,
    });
    const result = yield response.json();
    return result.text;
});
exports.whisperCall = whisperCall;
const fetchImage = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`payload: ${JSON.stringify(payload)}`);
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    };
    try {
        const response = yield fetch(`${process.env.stable_diffusion_api}/sdapi/v1/txt2img`, requestOptions);
        const data = yield response.json();
        return data.images; //只回傳image Base64 code
    }
    catch (error) {
        console.error(`fetchImage fail: ${error}`);
        throw error;
    }
});
exports.fetchImage = fetchImage;
const callLocalWhisper = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const formData = new FormData();
        formData.append('model', 'openai/whisper-large-v3');
        const fileBuffer = yield fs_1.default.promises.readFile(filePath);
        const fileName = path_1.default.basename(filePath);
        const blob = new Blob([fileBuffer], { type: 'audio/wav' });
        formData.append('file', blob, fileName);
        const response = yield fetch(process.env.localWhisperAPI, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = yield response.json();
        return result.text || '';
    }
    catch (error) {
        console.error(`callLocalWhisper 失敗：`, error);
        throw error;
    }
});
exports.callLocalWhisper = callLocalWhisper;
// // 拿語音內容
// export const getVoices = async (Saved_storyID: string, storyTale: string): Promise<{ audioFileName: string, audioBuffer: ArrayBuffer, error?: string }> => {
//     const url = `${process.env.GPT_SOVITS_VOICE_API}/tts`;
//     const referPathDir = `/home/b310-21/projects/GPT-SoVITS/output/slicer_opt/${voiceModelName}`
//     // 獲取排序後的第一個檔案
//     const sortedFiles = fs.readdirSync(referPathDir).sort();
//     const firstFile = sortedFiles.length > 0 ? sortedFiles[0] : null;
//     if (!firstFile) {
//         throw new Error(`no file found in ${referPathDir} `);
//     }
//     const promptText = await whisperCall(referPathDir, firstFile);
//     if (!promptText) {
//         return {
//             audioFileName: '',
//             audioBuffer: new ArrayBuffer(0),
//             error: '無法獲取提示文本'
//         };
//     }
//     const requestBody = {
//         ref_audio_path: path.join(referPathDir, firstFile),
//         prompt_text: promptText,
//         prompt_lang: "zh",
//         text: storyTale,
//         text_lang: "zh",
//         text_split_method: "cut0",
//     };
//     console.log(`requestBody: ${JSON.stringify(requestBody)}`);
//     try {
//         const response = await fetch(url, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify(requestBody),
//         });
//         if (!response.ok) {
//             throw new Error(`HTTP 錯誤！狀態碼：${response.status}`);
//         }
//         const audioBuffer = await response.arrayBuffer();
//         const audioFileName = `Saved_${Saved_storyID}.wav`;
//         return { audioFileName, audioBuffer };
//     } catch (error) {
//         console.error("Error in getVoices:", error);
//         return {
//             audioFileName: '',
//             audioBuffer: new ArrayBuffer(0),
//             error: `語音生成失敗：${(error as Error).message}`
//         };
//     }
// }
// // 設定語音模型
// export const setVoiceModel = async (modelName: string): Promise<{code:number, message:string}> => {
//     const gptWeightsDir = '/home/b310-21/projects/GPT-SoVITS/GPT_weights_v2';
//     const sovitsWeightsDir = '/home/b310-21/projects/GPT-SoVITS/SoVITS_weights_v2';
//     const latestGptFile = `${gptWeightsDir}/${modelName}-e15.ckpt`;
//     const latestSovitsFile = findLatestFile(sovitsWeightsDir, modelName);
//     if (!latestSovitsFile) {
//         throw new Error('找不到匹的模型檔案');
//     }
//     console.log(`已找到以下兩個模型：${latestGptFile}, ${path.join(sovitsWeightsDir, latestSovitsFile)}`);
//     const payload = {
//         "gpt_model_path": latestGptFile,
//         "sovits_model_path": path.join(sovitsWeightsDir, latestSovitsFile)
//     };
//     const requestOptions = {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload)
//     };
//     try {
//         const response = await fetch(`${process.env.GPT_SOVITS_VOICE_API}/set_model`, requestOptions);
//         const result = await response.text();
//         if (!response.ok) {
//             throw new Error(`setVoiceModel fail code：${response.status}, respomse：${result}`);
//         }
//         console.log(`setVoiceModel result：${result}`);
//         return {code:200, message:result};
//     } catch (error) {
//         console.error("setVoiceModel occurred error:", error);
//         throw error;
//     }
// }
// //http://163.13.202.120:8188/prompt
// const useComfy3D = `http://163.13.202.120:8188/prompt`
// export const fetchComfy = async(prompt:any) => {
//     const requestOptions = {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(prompt)
//     };
//     try {
//         const response = await fetch(`${useComfy3D}`, requestOptions);
//         const data = await response.json();
//         return data.images; 
//     } catch (error) {
//         console.log(`Error fetchImage response is ${error}`);
//         return `Error => no return `;
//     }
// }
