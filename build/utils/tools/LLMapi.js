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
exports.LLMGen_release = exports.kill_ollama = exports.LLMGenStory_1st_2nd = exports.LLMGenChat = exports.abort_controller = void 0;
const DataBase_1 = require("../DataBase");
const child_process_1 = require("child_process");
const opencc_js_1 = __importDefault(require("opencc-js"));
const ollama_1 = require("ollama");
const dotenv_1 = __importDefault(require("dotenv"));
const openai_fetch_1 = require("./openai_fetch");
dotenv_1.default.config();
//向 LLM 送一次對話請求
/**
 * @param {string Object} storyInfo 根據不同需求送入不同的對話json 就可以了
 * @returns 回傳LLM 生成的對話回應
 * @example
 * {
        "message": `對話內容`,
        "mode": "chat"
 * }
 */
exports.abort_controller = new AbortController();
const LLMGenChat = (storyInfo) => __awaiter(void 0, void 0, void 0, function* () {
    const ollama = new ollama_1.Ollama({ host: process.env.LLM_generate_api });
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        console.log("\nAborting LLMGenChat request...\n");
        controller.abort();
    }, 60000);
    try {
        const ollamaRequest = Object.assign(Object.assign({}, storyInfo), { stream: false, signal: controller.signal });
        const response = yield ollama.generate(ollamaRequest);
        clearTimeout(timeoutId);
        let string_response = response.response;
        return string_response;
    }
    catch (error) {
        if (error.name === 'AbortError') {
            yield (0, exports.LLMGen_release)();
            console.error(`LLMGenChat Request timed out after 60 seconds, ${error}`);
        }
        else {
            console.error(`LLMGenChat fail: ${error}`);
        }
        throw error; // 重新拋出錯誤，讓調用者處理
    }
});
exports.LLMGenChat = LLMGenChat;
/**
 * 生成完整的故事內容(送了兩次請求，一次生成，一次修改)
 * @param {RoleFormInterface} storyRoleForm 想生成的故事主題表單
 * @param {Response} Response 回應status code，不回傳其他東西
 * @return {Object<string>} Saved_storyID 剛儲存好故事的唯一id
 */
const LLMGenStory_1st_2nd = (storyRoleForm, Response) => __awaiter(void 0, void 0, void 0, function* () {
    let storyInfo = storyRoleForm.description;
    try {
        let payload1 = {
            "model": "Llama3.1-8B-Chinese-Chat.Q8_0.gguf:latest",
            "prompt": `
                <|begin_of_text|><|start_header_id|>system<|end_header_id|>
                你是一位專業的兒童故事作家,擅長創作適合小朋友閱讀的有趣故事。請根據以下要求創作一個故事:

                故事主角: ${storyRoleForm.mainCharacter}
                其他角色: ${storyRoleForm.otherCharacters} 
                故事情節: ${storyRoleForm.description}
                其他角色設定: ${storyRoleForm.relationships}

                要求:
                1. 故事總字數控制在700字左右
                2. 每40個字換一次行
                3. 全文分為10-12個段落
                4. 故事內容要充實有趣,符合小朋友的理解能力
                5. 角色對話要生動自然,符合故事情境
                6. 只輸出故事內容,不要包含任何額外說明
                7. 故事段落用 \n\n 換行

                請發揮你的創意,為小朋友們創作一個精彩的故事!

                <|eot_id|><|start_header_id|>user<|end_header_id|>

                請根據上述要求創作一個適合兒童的故事。

                <|eot_id|><|start_header_id|>assistant<|end_header_id|>`,
            "stream": false,
            "options": {
                "num_ctx": 700,
                "num_predict": 100,
            },
        };
        const story_1st = yield (0, exports.LLMGenChat)(payload1);
        // 第二次生成(openai)
        const prompt = `你是一位專門為小朋友創作有趣故事的AI助手。請根據以下提示生成一個適合小朋友閱讀的故事。每40字換行，總段落數不超過12段，字數控制在600字左右。請參考根據故事設定：
                故事主角: ${storyRoleForm.mainCharacter}
                其他角色: ${storyRoleForm.otherCharacters} 
                故事情節: ${storyRoleForm.description}
                其他角色設定: ${storyRoleForm.relationships}
                寫出的故事${story_1st}
                進行修改並優化，使其更口語化，生動有趣。請確保故事字數接近600字，每40字換行，總段落數不超過12段，每個故事段落麻煩用 {\n\n} 換行。只需返回修改後的故事內容，不要附加其他說明。你回傳的格式應該為:a段落故事\n\nb段落故事\n\n.....`;
        const story_2nd = yield (0, openai_fetch_1.openAIFetch)(prompt);
        const converter = opencc_js_1.default.Converter({ from: 'cn', to: 'tw' });
        const transStory = converter(story_2nd);
        if (transStory !== "") {
            exports.generated_story_array = transStory.split("\n\n");
            console.log(`generated_story_arrayAA.length = ${exports.generated_story_array.length}`);
            let Saved_storyID = yield DataBase_1.DataBase.SaveNewStory_returnID(transStory, storyInfo);
            return Saved_storyID;
        }
        else {
            throw new Error('Generated story is empty');
        }
    }
    catch (error) {
        console.error(`Error in LLMGenStory_1st_2nd: ${error}`);
        throw error;
    }
});
exports.LLMGenStory_1st_2nd = LLMGenStory_1st_2nd;
const kill_ollama = () => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        const processDo = (0, child_process_1.spawn)('sudo', ['-S', 'pkill', 'ollama'], { stdio: ['pipe', 'pipe', 'pipe'] });
        processDo.stdin.write(process.env.systemPassword + '\n');
        processDo.stdin.end();
        let stdoutData = '';
        let stderrData = '';
        processDo.stdout.on('data', (data) => {
            stdoutData += data.toString();
        });
        processDo.stderr.on('data', (data) => {
            stderrData += data.toString();
        });
        processDo.on('close', (code) => {
            if (code === 0) {
                console.log('pkill ollama');
                resolve({ stdout: stdoutData, stderr: stderrData });
            }
            else {
                console.error(`fail to pkill ollama with error code: ${code}`);
                reject(new Error(`kill_ollama code ${code}\nstderr: ${stderrData}`));
            }
        });
        processDo.on('error', (err) => {
            console.error('kill_ollama error:', err);
            reject(err);
        });
    });
});
exports.kill_ollama = kill_ollama;
/**
 * 用來刪除Ollama model 占用的記憶體
 */
const LLMGen_release = () => __awaiter(void 0, void 0, void 0, function* () {
    const ollama = new ollama_1.Ollama({ host: 'http://163.13.202.120:11434' });
    try {
        let payload1 = {
            "model": "Llama3.1-8B-Chinese-Chat.Q8_0.gguf:latest",
            "prompt": `回答我"好"這一個字就可以了。`,
            "stream": false,
            "options": {
                "num_predict": 1,
                "num_ctx": 1
            },
            "keep_alive": 0,
        };
        yield ollama.generate(payload1);
        // await kill_ollama();
        return 0;
    }
    catch (error) {
        console.error(`LLMGen_release 中發生錯誤：${error}`);
        throw error;
    }
});
exports.LLMGen_release = LLMGen_release;
