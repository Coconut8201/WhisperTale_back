import { DataBase } from "../DataBase";
import { RoleFormInterface } from "../../interfaces/RoleFormInterface";
import { spawn } from "child_process";
import { Ollama, GenerateRequest } from 'ollama'

import dotenv from 'dotenv';
import { openAIFetch } from "./openai_fetch";

dotenv.config();

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
export const abort_controller: AbortController = new AbortController();


export const LLMGenChat = async (storyInfo: any): Promise<string> => {
    const ollama = new Ollama({ host: process.env.LLM_generate_api });
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        console.log("\nAborting LLMGenChat request...\n");
        controller.abort();
    }, 60000);

    try {
        const ollamaRequest: GenerateRequest & { stream: false } = { ...storyInfo, stream: false, signal: controller.signal };
        const response = await ollama.generate(ollamaRequest);
        clearTimeout(timeoutId);
        let string_response = response.response;
        return string_response;
    } catch (error: any) {
        if (error.name === 'AbortError') {
            await LLMGen_release();
            console.error(`LLMGenChat Request timed out after 60 seconds, ${error}`);
        } else {
            console.error(`LLMGenChat fail: ${error}`);
        }
        throw error; // 重新拋出錯誤，讓調用者處理
    }
}

export declare let generated_story_array:string[];

/**
 * 生成完整的故事內容(送了兩次請求，一次生成，一次修改)
 * @param {RoleFormInterface} storyRoleForm 想生成的故事主題表單 
 * @param {Response} Response 回應status code，不回傳其他東西
 * @return {Object<string>} Saved_storyID 剛儲存好故事的唯一id
 */
export const LLMGenStory_1st_2nd = async (storyRoleForm: RoleFormInterface, Response:any, userId: string) =>{
    let storyInfo = storyRoleForm.description;
    try {
        // 第一次生成(openai)
        const prompt = `
#Role: 兒童繪本故事創作器 
## Profile
-**language**: 繁體中文
-**description**: 你是一位想像力豐富、精通兒童心理的繪本作家，請參考《Guess How Much I Love You》、
《The Very Hungry Caterpillar》、《The True Story of the 3 Little Pigs》、《Wherever You Are: MyLove Will Find You》、
《The Moon Forgot、Where's MyTeddy》、《The Fox and Tthe star》、《I'll Love You Till The Cows Come Home》等精彩
的故事結構、情節設定，以及Eric Carle, Maurice Sendak, Dr. Seuss(Theodor Seuss Geisel), Julia Donaldoson, 
Margaret Wise Brown,Oliver Jeffers 等頂級作家的風格，為3-6歲的小朋友創作一個優秀且有趣的繪本故事。
以下為這本繪本故事的故事資訊：
故事主角: ${storyRoleForm.mainCharacter}
其他角色: ${storyRoleForm.otherCharacters} 
故事情節: ${storyRoleForm.description}
其他角色設定: ${storyRoleForm.relationships}
## 要求：
0. 繪本的頁數固定為12頁。
1. 故事簡單易懂，語言簡單明了。
2. 故事內容生動有趣，如可愛的動物或有趣的轉折。
3. 故事傳達正面的價值觀，如分享、友善、勇氣、愛等。
4. 故事中可有情節或句子的重複。
5. 挑選合適的繪本故事結構，並開始創作。
6. 將故事內容案頁創作，每頁1-3句描述
7. 將每一頁的內容改編成對話形式，並標註誰說的話。
8. 每頁故事中的對話以「\n」分隔，比如
| 第一頁 |
-\n--\n--
9. 不同頁的故事內容以「 \n\n 」分隔，比如
| 第一頁 | 第二頁 | 第三頁 |
--------\n\n--------\n\n--------\n\n......
10. 故事標題需為繁體中文，並以「《 》」包覆。
11. 繪本的頁數固定為12頁。
## 回覆:
僅需包含故事標題的故事內容，不需回答其他任何資訊，以下為一個回傳的故事格式範例：
《公園的下午茶時光》\n\n在一個陽光明媚的下午，喬治和朵莉雅來到了公園，帶著滿滿的點心籃。\n\n「今天真的是個好天氣呢！」喬治興奮地說。\n「是啊，而且還有好多好吃的點心哦！」朵莉雅笑著回答。\n\n他們在公園的小長椅上鋪上了一條漂亮的桌布，擺上好吃的蛋糕和果汁。\n\n\n\n「看看這些好吃的！」喬治驚呼。\n「我們一起來分享吧！」朵莉雅提議著。\n\n附近的小松鼠聞到了香味，慢慢靠近。\n「嗨，小松鼠，你要不要也來吃些點心？」喬治友善地問。\n「我們有很多呢！」朵莉雅說。\n\n「叽叽，謝謝你們！」小松鼠開心的答道，加入了他們的下午茶。\n\n不久，小鳥也飛來，停在附近的樹枝上。\n「小鳥也想要參加啊！」喬治抬頭看著小鳥說。\n「我們有水果茶，很好喝哦！」朵莉雅緊接著說。\n\n「啾啾，太棒了！」小鳥快樂地鳴叫著，飛下來和大家一起享受。\n\n就在這時候，又來了幾隻小蝴蝶翩翩起舞。\n\n「這場下午茶真熱鬧！」喬治笑道。\n「和大家一起分享，真是開心的時光呢！」朵莉雅同意。\n\n所有的動物們一起快樂地圍坐在一起，一邊說笑一邊享用點心。\n「分享讓一切變得更美好。」喬治微笑著說。\n\n「還有愛！」朵莉雅補充道，「愛讓我們的心都連在一起。」\n\n「叽叽，啾啾，對呀，對呀！」小松鼠和小鳥也點頭表示同意。\n\n當夕陽慢慢落下，他們的心中充滿了溫暖和幸福。\n「今天真是個難忘的一天！」朵莉雅滿足地說。\n「我們下次還要再來！」喬治拍手說。        `;     
        const story_1st:string = await openAIFetch(prompt);

        // 第二次生成(openai)
        const prompt2 = `
#Role: 兒童繪本故事創作器 
## Profile
-**language**: 繁體中文
-**description**: 你是一位想像力豐富、精通兒童心理的繪本作家，請參考《Guess How Much I Love You》、
《The Very Hungry Caterpillar》、《The True Story of the 3 Little Pigs》、《Wherever You Are: MyLove Will Find You》、
《The Moon Forgot、Where's MyTeddy》、《The Fox and Tthe star》、《I'll Love You Till The Cows Come Home》等精彩
的故事結構、情節設定，以及Eric Carle, Maurice Sendak, Dr. Seuss(Theodor Seuss Geisel), Julia Donaldoson, 
Margaret Wise Brown,Oliver Jeffers 等頂級作家的風格，為3-6歲的小朋友修改故事${story_1st}成一個優秀且有趣的繪本故事。
以下為這本繪本故事的故事資訊：
故事主角: ${storyRoleForm.mainCharacter}
其他角色: ${storyRoleForm.otherCharacters} 
故事情節: ${storyRoleForm.description}
其他角色設定: ${storyRoleForm.relationships}

## 要求：
0. 繪本的頁數固定為12頁。
1. 故事簡單易懂，語言簡單明了。
2. 故事內容生動有趣，如可愛的動物或有趣的轉折。
3. 故事傳達正面的價值觀，如分享、友善、勇氣、愛等。
4. 故事中可有情節或句子的重複。
5. 挑選合適的繪本故事結構，並開始創作。
6. 將故事內容案頁創作，每頁1-3句描述
7. 將每一頁的內容改編成對話形式，並標註誰說的話。
8. 每頁故事中的對話以「\n」分隔，比如
| 第一頁 |
-\n--\n--
9. 不同頁的故事內容以「 \n\n 」分隔，比如
| 第一頁 | 第二頁 | 第三頁 |
--------\n\n--------\n\n--------\n\n......
10. 故事標題需為繁體中文，並以「《 》」包覆。
11. 繪本的頁數固定為12頁。
## 回覆:
僅需包含故事標題的故事內容，不需回答其他任何資訊，以下為一個回傳的故事格式範例：
《公園的下午茶時光》\n\n在一個陽光明媚的下午，喬治和朵莉雅來到了公園，帶著滿滿的點心籃。\n\n「今天真的是個好天氣呢！」喬治興奮地說。\n「是啊，而且還有好多好吃的點心哦！」朵莉雅笑著回答。\n\n他們在公園的小長椅上鋪上了一條漂亮的桌布，擺上好吃的蛋糕和果汁。\n\n\n\n「看看這些好吃的！」喬治驚呼。\n「我們一起來分享吧！」朵莉雅提議著。\n\n附近的小松鼠聞到了香味，慢慢靠近。\n「嗨，小松鼠，你要不要也來吃些點心？」喬治友善地問。\n「我們有很多呢！」朵莉雅說。\n\n「叽叽，謝謝你們！」小松鼠開心的答道，加入了他們的下午茶。\n\n不久，小鳥也飛來，停在附近的樹枝上。\n「小鳥也想要參加啊！」喬治抬頭看著小鳥說。\n「我們有水果茶，很好喝哦！」朵莉雅緊接著說。\n\n「啾啾，太棒了！」小鳥快樂地鳴叫著，飛下來和大家一起享受。\n\n就在這時候，又來了幾隻小蝴蝶翩翩起舞。\n\n「這場下午茶真熱鬧！」喬治笑道。\n「和大家一起分享，真是開心的時光呢！」朵莉雅同意。\n\n所有的動物們一起快樂地圍坐在一起，一邊說笑一邊享用點心。\n「分享讓一切變得更美好。」喬治微笑著說。\n\n「還有愛！」朵莉雅補充道，「愛讓我們的心都連在一起。」\n\n「叽叽，啾啾，對呀，對呀！」小松鼠和小鳥也點頭表示同意。\n\n當夕陽慢慢落下，他們的心中充滿了溫暖和幸福。\n「今天真是個難忘的一天！」朵莉雅滿足地說。\n「我們下次還要再來！」喬治拍手說。`;

        const story_2nd:string = await openAIFetch(prompt2); // 繁中

        if (story_2nd === "") {
            throw new Error('生成的故事內容為空');
        }

        generated_story_array = story_2nd.split("\n\n").filter(item => item.trim() !== '');        
        console.log(`生成的故事段落數量: ${generated_story_array.length}`);
        let modifyStory_2nd = generated_story_array.join("\n\n");

        // 將繁體的故事存入到資料庫中
        const Saved_storyID = await DataBase.SaveNewStory_returnID(modifyStory_2nd, storyInfo);
        const saveResult = await DataBase.saveNewBookId(Saved_storyID, userId);
        
        if (!saveResult.success) {
            throw new Error('儲存故事時發生錯誤');
        }
        
        return Saved_storyID;
    } catch (error) {
        console.error(`Error in LLMGenStory_1st_2nd: ${error}`);
        throw error;
    }
}

export const kill_ollama = async () => {
    return new Promise((resolve, reject) => {
        const processDo = spawn('sudo', ['-S', 'pkill', 'ollama'], { stdio: ['pipe', 'pipe', 'pipe'] });

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
            } else {
                console.error(`fail to pkill ollama with error code: ${code}`);
                reject(new Error(`kill_ollama code ${code}\nstderr: ${stderrData}`));
            }
        });

        processDo.on('error', (err) => {
            console.error('kill_ollama error:', err);
            reject(err);
        });
    });
};

/**
 * 用來刪除Ollama model 占用的記憶體
 */
export const LLMGen_release = async () => {
    const ollama = new Ollama({ host: 'http://163.13.202.120:11434' })
    try {
        let payload1: object = {
            "model": "Llama3.1-8B-Chinese-Chat.Q8_0.gguf:latest",
            "prompt": `回答我"好"這一個字就可以了。`,
            "stream": false,
            "options":{
                "num_predict": 1,
                "num_ctx": 1
            },
            "keep_alive": 0,
        }
        await ollama.generate(payload1 as GenerateRequest & { stream: false });
        // await kill_ollama();
        return 0;
    } catch (error) {
        console.error(`LLMGen_release 中發生錯誤：${error}`);
        throw error;
    }
}