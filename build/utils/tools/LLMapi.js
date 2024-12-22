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
const LLMGenStory_1st_2nd = (storyRoleForm, Response, userId) => __awaiter(void 0, void 0, void 0, function* () {
    let storyInfo = storyRoleForm.description;
    try {
        // 第一次生成(openai)
        const prompt = `
你很奇怪欸，我就跟你說繪本只要6頁你每次都生成超過6頁，你到底有沒有在聽我說話？
#Role: 兒童繪本故事創作器
## Profile
-**language**: 繁體中文
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
12. 僅需回覆包含故事標題的故事內容，不需回答其他任何資訊如頁數，或用任何符號文字表示分頁或頁數，不同的頁數之間用\n\n 做分頁代表就可以了，同一頁的對話使用\n連接。以下為一個回傳的故事格式範例：
《公園的朋友聚會》\n\n在一個陽光明媚的春天，有一隻名叫小花的貓咪。小花性格有點害羞，總是獨自一隻貓待在公園的小角落，看著其他小動物開心玩耍。\n\n某一天，一隻活潑可愛的小狗狗汪汪蹦蹦跳跳地來到公園。牠看見角落裡的小花，搖著尾巴走了過去：「嗨！我叫小汪，你為什麼一個人坐在這裡呀？」\n\n小花低下頭，小聲地說：「我...我不太會和別人玩...」\n\n「沒關係啊！」小汪笑著說，「要不要和我一起去吃冰淇淋？公園對面新開了一家好好吃的冰淇淋店喔！」\n\n就這樣，小花和小汪成為了好朋友。他們常常一起去看動畫電影，一起在公園裡追逐蝴蝶，一起分享好吃的點心。\n\n雖然小花有時候還是會害羞，會擔心自己配不上這麼好的朋友，但小汪總是很貼心地對小花說：「你是最好的朋友！」\n\n有一天，小汪興奮地跑來找小花：「小花小花！我好想去看看你住的地方！一定很漂亮吧？」\n\n小花想了想，雖然有點緊張，但還是決定帶小汪去參觀自己溫暖的小屋。小屋裡有小花最喜歡的毛線球收藏，還有媽媽親手織的小毯子。\n\n小汪參觀了小花的家，開心地說：「哇！你的家好溫馨啊！」看到小汪真誠的笑容，小花感到非常幸福。\n\n從此以後，小花知道了：不要因為害羞就把自己關起來，因為世界上總有一個人，會真心喜歡真實的你。即使你覺得自己不夠好，在真正的朋友眼中，你永遠都是最特別的。\n\n每當春天來臨，小花和小汪就會想起他們相遇的那一天。在公園的櫻花樹下，兩個小傢伙依然常常一起分享著快樂的時光。

## 回覆:
僅需包含故事標題的故事內容，不需回答其他任何資訊，以下為一個回傳的故事格式範例：
《公園的下午茶時光》\n\n在一個陽光明媚的下午，喬治和朵莉雅來到了公園，帶著滿滿的點心籃。\n\n「今天真的是個好天氣呢！」喬治興奮地說。\n「是啊，而且還有好多好吃的點心哦！」朵莉雅笑著回答。\n\n他們在公園的小長椅上鋪上了一條漂亮的桌布，擺上好吃的蛋糕和果汁。\n\n\n\n「看看這些好吃的！」喬治驚呼。\n「我們一起來分享吧！」朵莉雅提議著。\n\n附近的小松鼠聞到了香味，慢慢靠近。\n「嗨，小松鼠，你要不要也來吃些點心？」喬治友善地問。\n「我們有很多呢！」朵莉雅說。\n\n「叽叽，謝謝你們！」小松鼠開心的答道，加入了他們的下午茶。\n\n不久，小鳥也飛來，停在附近的樹枝上。\n「小鳥也想要參加啊！」喬治抬頭看著小鳥說。\n「我們有水果茶，很好喝哦！」朵莉雅緊接著說。\n\n「啾啾，太棒了！」小鳥快樂地鳴叫著，飛下來和大家一起享受。\n\n就在這時候，又來了幾隻小蝴蝶翩翩起舞。\n\n「這場下午茶真熱鬧！」喬治笑道。\n「和大家一起分享，真是開心的時光呢！」朵莉雅同意。\n\n所有的動物們一起快樂地圍坐在一起，一邊說笑一邊享用點心。\n「分享讓一切變得更美好。」喬治微笑著說。\n\n「還有愛！」朵莉雅補充道，「愛讓我們的心都連在一起。」\n\n「叽叽，啾啾，對呀，對呀！」小松鼠和小鳥也點頭表示同意。\n\n當夕陽慢慢落下，他們的心中充滿了溫暖和幸福。\n「今天真是個難忘的一天！」朵莉雅滿足地說。\n「我們下次還要再來！」喬治拍手說。        `;
        const story_1st = yield (0, openai_fetch_1.openAIFetch)(prompt);
        // 第二次生成(openai)
        const prompt2 = `
你很奇怪欸，我就跟你說繪本只要6頁你每次都生成超過12頁，你到底有沒有在聽我說話？
#Role: 兒童繪本故事創作器 
## Profile
-**language**: 繁體中文
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
此為重新檢查這篇故事是否符合繪本故事的標準，並進行修改，請嚴格遵守以下的規定並修改故事使其符合以下規定。
0. 繪本的頁數固定為6頁。
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
 -----\n\n-----\n\n----\n\n......
10. 故事標題需為繁體中文，並以「《 》」包覆。
11. 繪本的頁數固定為12頁。
12. 僅需回覆包含故事標題的故事內容，不需回答其他任何資訊如頁數，或用任何符號文字表示分頁或頁數，不同的頁數之間用\n\n 做分頁代表就可以了，同一頁的對話使用\n連接。以下為一個回傳的故事格式範例：
《公園的朋友聚會》\n\n在一個陽光明媚的春天，有一隻名叫小花的貓咪。小花性格有點害羞，總是獨自一隻貓待在公園的小角落，看著其他小動物開心玩耍。\n\n某一天，一隻活潑可愛的小狗狗汪汪蹦蹦跳跳地來到公園。牠看見角落裡的小花，搖著尾巴走了過去：「嗨！我叫小汪，你為什麼一個人坐在這裡呀？」\n\n小花低下頭，小聲地說：「我...我不太會和別人玩...」\n\n「沒關係啊！」小汪笑著說，「要不要和我一起去吃冰淇淋？公園對面新開了一家好好吃的冰淇淋店喔！」\n\n就這樣，小花和小汪成為了好朋友。他們常常一起去看動畫電影，一起在公園裡追逐蝴蝶，一起分享好吃的點心。\n\n雖然小花有時候還是會害羞，會擔心自己配不上這麼好的朋友，但小汪總是很貼心地對小花說：「你是最好的朋友！」\n\n有一天，小汪興奮地跑來找小花：「小花小花！我好想去看看你住的地方！一定很漂亮吧？」\n\n小花想了想，雖然有點緊張，但還是決定帶小汪去參觀自己溫暖的小屋。小屋裡有小花最喜歡的毛線球收藏，還有媽媽親手織的小毯子。\n\n小汪參觀了小花的家，開心地說：「哇！你的家好溫馨啊！」看到小汪真誠的笑容，小花感到非常幸福。\n\n從此以後，小花知道了：不要因為害羞就把自己關起來，因為世界上總有一個人，會真心喜歡真實的你。即使你覺得自己不夠好，在真正的朋友眼中，你永遠都是最特別的。\n\n每當春天來臨，小花和小汪就會想起他們相遇的那一天。在公園的櫻花樹下，兩個小傢伙依然常常一起分享著快樂的時光。
## 回覆:
僅需包含故事標題的故事內容，不需回答其他任何資訊，以下為一個回傳的故事格式範例：
《公園的下午茶時光》\n\n在一個陽光明媚的下午，喬治和朵莉雅來到了公園，帶著滿滿的點心籃。\n\n「今天真的是個好天氣呢！」喬治興奮地說。\n「是啊，而且還有好多好吃的點心哦！」朵莉雅笑著回答。\n\n他們在公園的小長椅上鋪上了一條漂亮的桌布，擺上好吃的蛋糕和果汁。\n\n\n\n「看看這些好吃的！」喬治驚呼。\n「我們一起來分享吧！」朵莉雅提議著。\n\n附近的小松鼠聞到了香味，慢慢靠近。\n「嗨，小松鼠，你要不要也來吃些點心？」喬治友善地問。\n「我們有很多呢！」朵莉雅說。\n\n「叽叽，謝謝你們！」小松鼠開心的答道，加入了他們的下午茶。\n\n不久，小鳥也飛來，停在附近的樹枝上。\n「小鳥也想要參加啊！」喬治抬頭看著小鳥說。\n「我們有水果茶，很好喝哦！」朵莉雅緊接著說。\n\n「啾啾，太棒了！」小鳥快樂地鳴叫著，飛下來和大家一起享受。\n\n就在這時候，又來了幾隻小蝴蝶翩翩起舞。\n\n「這場下午茶真熱鬧！」喬治笑道。\n「和大家一起分享，真是開心的時光呢！」朵莉雅同意。\n\n所有的動物們一起快樂地圍坐在一起，一邊說笑一邊享用點心。\n「分享讓一切變得更美好。」喬治微笑著說。\n\n「還有愛！」朵莉雅補充道，「愛讓我們的心都連在一起。」\n\n「叽叽，啾啾，對呀，對呀！」小松鼠和小鳥也點頭表示同意。\n\n當夕陽慢慢落下，他們的心中充滿了溫暖和幸福。\n「今天真是個難忘的一天！」朵莉雅滿足地說。\n「我們下次還要再來！」喬治拍手說。`;
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
