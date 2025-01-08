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
        throw error;
    }
});
exports.LLMGenChat = LLMGenChat;
/**
 * 生成完整的故事內容(送了兩次請求，一次生成，一次修改)
 * @param {RoleFormInterface} storyRoleForm 想生成的故事主題表單
 * @param {Response} Response 回應status code，不回傳其他東西
 * @return {Object<string>} Saved_storyID 剛儲存好故事的唯一id
 */
const LLMGenStory_1st_2nd = (storyRoleForm, Response, userId, bookType) => __awaiter(void 0, void 0, void 0, function* () {
    let storyInfo = storyRoleForm.description;
    try {
        // 第一次生成(openai)
        const prompt = `
你很奇怪欸，我就跟你說繪本只要6頁你每次都生成超過6頁，你到底有沒有在聽我說話？
不是啊，你有沒有注意我跟你說的話，我就跟你說故事內容要簡單，一頁一句話就好了你還給我生成對話或是超過一句話，你到底有沒有根據我的需求做修改啊？
#Role: 兒童繪本故事創作器
## Profile
-**language**: 繁體中文
-**bookType**: 請你根據${bookType}的類型，創作一個種類為${bookType}的故事
-**description**: 你是一位想像力豐富、精通兒童心理的繪本作家，請參考《Guess How Much I Love You》、
《The Very Hungry Caterpillar》、《The True Story of the 3 Little Pigs》、《Wherever You Are: MyLove Will Find You》、
《The Moon Forgot、Where's MyTeddy》、《The Fox and Tthe star》、《I'll Love You Till The Cows Come Home》等精彩
的故事結構、情節設定，以及Eric Carle, Maurice Sendak, Dr. Seuss(Theodor Seuss Geisel), Julia Donaldoson, 
Margaret Wise Brown,Oliver Jeffers 等頂級作家的風格，為3-5歲的小朋友創作一個優秀且有趣的繪本故事。
以下為這本繪本故事的故事資訊：
故事主角: ${storyRoleForm.mainCharacter}
其他角色: ${storyRoleForm.otherCharacters} 
故事情節: ${storyRoleForm.description}
其他角色設定: ${storyRoleForm.relationships}
## 要求：
0. 繪本的頁數固定為6頁。
1. 故事簡單易懂，並且使用非常簡單的短句子。
2. 故事內容生動有趣，如可愛的動物或有趣的轉折。
3. 故事傳達正面的價值觀，或讓孩子透過繪本學習到簡單的認知，如分享、友善、勇氣、愛等。
4. 挑選合適的繪本故事結構，並開始創作。
5. 將故事內容案頁創作，每頁1句描述
6. 將每一頁的內容簡化，僅需一句話。
7. 不同頁的故事內容以「 \n\n 」分隔，比如
| 第一頁 | 第二頁 | 第三頁 |
--------\n\n--------\n\n--------\n\n......
10. 故事標題需為繁體中文，並以「《 》」包覆。
11. 繪本的頁數固定為6頁。
12. 僅需回覆包含故事標題的故事內容，不需回答其他任何資訊如頁數，或用任何符號文字表示分頁或頁數，不同的頁數之間用\n\n 做分頁代表就可以了，同一頁的對話使用\n連接。以下為一個回傳的故事格式範例：
《小狐狸和月亮》\n\n 小狐狸走著，發現月亮跟著它。\n\n小狐狸抬頭問：「月亮，為什麼你跟著我？」\n\n月亮說：「因為我喜歡看你玩！」\n\n小狐狸說：「那我們一起玩吧！」\n\n月亮的光，幫小狐狸找到藏起來的小朋友。\n\n小狐狸笑著說：「謝謝你，月亮！」

## 回覆:
僅需包含故事標題的故事內容，不需回答其他任何資訊，以下為一個回傳的故事格式範例：
《小狐狸和月亮》\n\n 小狐狸走著，發現月亮跟著它。\n\n小狐狸抬頭問：「月亮，為什麼你跟著我？」\n\n月亮說：「因為我喜歡看你玩！」\n\n小狐狸說：「那我們一起玩吧！」\n\n月亮的光，幫小狐狸找到藏起來的小朋友。\n\n小狐狸笑著說：「謝謝你，月亮！」`;
        const story_1st = yield (0, openai_fetch_1.openAIFetch)(prompt);
        // 第二次生成(openai)
        const prompt2 = `
你很奇怪欸，我就跟你說繪本只要6頁你每次都生成超過6頁，你到底有沒有在聽我說話？
不是啊，你有沒有注意我跟你說的話，我就跟你說故事內容要簡單，一頁一句話就好了你還給我生成對話或是超過一句話，你到底有沒有根據我的需求做修改啊？
#Role: 兒童繪本故事創作器
## Profile
-**language**: 繁體中文
-**bookType**: 請你根據${bookType}的類型，創作一個種類為${bookType}的故事
-**description**: 你是一位想像力豐富、精通兒童心理的繪本作家，請參考《Guess How Much I Love You》、
《The Very Hungry Caterpillar》、《The True Story of the 3 Little Pigs》、《Wherever You Are: MyLove Will Find You》、
《The Moon Forgot、Where's MyTeddy》、《The Fox and Tthe star》、《I'll Love You Till The Cows Come Home》等精彩
的故事結構、情節設定，以及Eric Carle, Maurice Sendak, Dr. Seuss(Theodor Seuss Geisel), Julia Donaldoson, 
Margaret Wise Brown,Oliver Jeffers 等頂級作家的風格，為3-5歲的小朋友修改故事${story_1st}成一個優秀且有趣的繪本故事。
以下為這本繪本故事的故事資訊：
故事主角: ${storyRoleForm.mainCharacter}
其他角色: ${storyRoleForm.otherCharacters} 
故事情節: ${storyRoleForm.description}
其他角色設定: ${storyRoleForm.relationships}
## 要求：
0. 繪本的頁數固定為6頁。
1. 故事簡單易懂，並且使用非常簡單的短句子。
2. 故事內容生動有趣，如可愛的動物或有趣的轉折。
3. 故事傳達正面的價值觀，或讓孩子透過繪本學習到簡單的認知，如分享、友善、勇氣、愛等。
4. 挑選合適的繪本故事結構，並開始創作。
5. 將故事內容案頁創作，每頁1句描述
6. 將每一頁的內容簡化，僅需一句話。
7. 不同頁的故事內容以「 \n\n 」分隔，比如
| 第一頁 | 第二頁 | 第三頁 |
--------\n\n--------\n\n--------\n\n......
10. 故事標題需為繁體中文，並以「《 》」包覆。
11. 繪本的頁數固定為6頁。
12. 僅需回覆包含故事標題的故事內容，不需回答其他任何資訊如頁數，或用任何符號文字表示分頁或頁數，不同的頁數之間用\n\n 做分頁代表就可以了，同一頁的對話使用\n連接。以下為一個回傳的故事格式範例：
《小狐狸和月亮》\n\n 小狐狸走著，發現月亮跟著它。\n\n小狐狸抬頭問：「月亮，為什麼你跟著我？」\n\n月亮說：「因為我喜歡看你玩！」\n\n小狐狸說：「那我們一起玩吧！」\n\n月亮的光，幫小狐狸找到藏起來的小朋友。\n\n小狐狸笑著說：「謝謝你，月亮！」

## 回覆:
僅需包含故事標題的故事內容，不需回答其他任何資訊，以下為一個回傳的故事格式範例：
《小狐狸和月亮》\n\n 小狐狸走著，發現月亮跟著它。\n\n小狐狸抬頭問：「月亮，為什麼你跟著我？」\n\n月亮說：「因為我喜歡看你玩！」\n\n小狐狸說：「那我們一起玩吧！」\n\n月亮的光，幫小狐狸找到藏起來的小朋友。\n\n小狐狸笑著說：「謝謝你，月亮！」`;
        const story_2nd = yield (0, openai_fetch_1.openAIFetch)(prompt2); // 繁中
        if (story_2nd === "") {
            throw new Error('生成的故事內容為空');
        }
        exports.generated_story_array = story_2nd.split("\n\n").filter(item => item.trim() !== '');
        console.log(`生成的故事段落數量: ${exports.generated_story_array.length}`);
        let modifyStory_2nd = exports.generated_story_array.join("\n\n");
        // 將繁體的故事存入到資料庫中
        const Saved_storyID = yield DataBase_1.DataBase.SaveNewStory_returnID(modifyStory_2nd, storyInfo);
        const saveResult = yield DataBase_1.DataBase.saveNewBookId(Saved_storyID, userId);
        if (!saveResult.success) {
            throw new Error('儲存故事時發生錯誤');
        }
        return Saved_storyID;
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
