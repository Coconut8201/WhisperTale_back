import dotenv from "dotenv";
dotenv.config();

import fs from 'fs';
import path from 'path';

// whisper 語音轉文字
export const whisperCall = async (filePath: string) => {
    const data = fs.readFileSync(filePath);
    const response = await fetch(
        "https://api-inference.huggingface.co/models/openai/whisper-large-v3",
        {
            headers: {
                Authorization: `Bearer ${process.env.HUGGINFACE_API}`,
                "Content-Type": "application/json",
            },
            method: "POST",
            body: data,
        }
    );
    const result = await response.json();
    return result.text;
}

export const fetchImage = async (payload:Object) => {
    console.log(`payload: ${JSON.stringify(payload)}`);
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    };
    try {
        const response = await fetch(`${process.env.stable_diffusion_api}/sdapi/v1/txt2img`, requestOptions);
        const data = await response.json();
        return data.images; //只回傳image Base64 code
    } catch (error) {
        console.error(`fetchImage fail: ${error}`);
        throw error;
    }
};

export const callLocalWhisper = async (filePath: string): Promise<string> => {
    try {
        const formData = new FormData();
        
        formData.append('model', 'openai/whisper-large-v3');
        
        const fileBuffer = await fs.promises.readFile(filePath);
        const fileName = path.basename(filePath);
        const blob = new Blob([fileBuffer], { type: 'audio/wav' });
        formData.append('file', blob, fileName);

        const response = await fetch(process.env.localWhisperAPI!, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result.text || '';
    } catch (error) {
        console.error(`callLocalWhisper 失敗：`, error);
        throw error;
    }
};

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


