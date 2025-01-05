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
exports.GenImage = exports.GenImagePrompt = exports.generateStory = exports.isObjectValid = exports.genStoryVoice = exports.CurrentTime = exports.delayedExecution = void 0;
const fetch_1 = require("../tools/fetch");
const opencc_js_1 = __importDefault(require("opencc-js"));
const sdModel_tool_1 = require("./sdModel_tool");
const LLM_fetch_images_1 = require("./LLM_fetch_images");
const DataBase_1 = require("../DataBase");
const LLMapi_1 = require("./LLMapi");
const f5tts_inference_Voice_1 = require("./f5tts_inference_Voice");
const delayedExecution = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Waiting for 3 seconds...');
    yield new Promise(resolve => setTimeout(resolve, 1000)); // 等待 3 秒鐘
});
exports.delayedExecution = delayedExecution;
const CurrentTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const formattedMonth = month.toString().padStart(2, '0');
    const formattedDay = day.toString().padStart(2, '0');
    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');
    const formattedTime = `${year}-${formattedMonth}-${formattedDay} ${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    return formattedTime;
};
exports.CurrentTime = CurrentTime;
// 生成語音（f5tts）
const genStoryVoice = (userId, storyId, joinedStoryTale, userVoiceName) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 使用 chunking 方法，每次處理特定數量的語音
        const chunkSize = 3; // 可以根據您的 GPU 記憶體調整這個數字
        const results = [];
        for (let i = 0; i < joinedStoryTale.length; i += chunkSize) {
            const chunk = joinedStoryTale.slice(i, i + chunkSize);
            // 處理當前批次的語音生成
            const chunkResults = yield Promise.all(chunk.map((storySegment, index) => {
                const voiceName = 'page' + (i + index + 1).toString();
                return (0, f5tts_inference_Voice_1.genF5ttsVoice)(userId, storyId, storySegment, voiceName, userVoiceName);
            }));
            results.push(...chunkResults);
            // 在批次之間添加短暫延遲，讓 GPU 有時間釋放記憶體
            if (i + chunkSize < joinedStoryTale.length) {
                yield new Promise(resolve => setTimeout(resolve, 300));
            }
        }
        return results.every(result => result === true);
    }
    catch (error) {
        console.error('語音生成過程中發生錯誤: ', error);
        return false;
    }
});
exports.genStoryVoice = genStoryVoice;
//  判斷物件內的屬性是否都存在
function isObjectValid(obj) {
    if (!obj)
        return false;
    // 該函式會返回 true 如果物件的每個屬性都不為 null、undefined
    return Object.values(obj).every(value => value !== null &&
        value !== undefined &&
        (Array.isArray(value) ? value.length > 0 : true));
}
exports.isObjectValid = isObjectValid;
const removeEnglish = (str) => {
    return str.replace(/[a-zA-Z]/g, '');
};
// 生成故事內容
const generateStory = (storyRoleForm, voiceModelName, userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let Saved_storyID = yield (0, LLMapi_1.LLMGenStory_1st_2nd)(storyRoleForm, Response, userId);
        if (!Saved_storyID) {
            throw new Error('Failed to generate story ID，生成故事失敗');
        }
        console.log(`Saved_storyID = ${Saved_storyID}`);
        const story = yield DataBase_1.DataBase.getStoryById(Saved_storyID);
        // 因為使用fish speech 的關係文字需要調整成簡體中文效果會比較好
        const converter = opencc_js_1.default.Converter({ from: 'tw', to: 'cn' });
        const transStory = converter(story.storyTale);
        let generated_story_array = transStory.split("\n\n") //  這邊開始是簡體中文
            .map(item => removeEnglish(item))
            .map(item => item.replace(/\n/g, ''))
            .map(item => item.trim())
            .filter(item => item !== "");
        yield (0, exports.delayedExecution)();
        console.log(`start GenImagePrompt\n`);
        yield (0, exports.GenImagePrompt)(generated_story_array || [], Saved_storyID, storyRoleForm);
        const updatedStory = yield DataBase_1.DataBase.getStoryById(Saved_storyID);
        const generated_story_image_prompt = updatedStory.image_prompt;
        if (!generated_story_image_prompt || generated_story_image_prompt.length === 0) {
            throw new Error('No image prompts generated，圖片提示生成失敗');
        }
        console.log(`start GenImage`);
        yield (0, exports.GenImage)(generated_story_image_prompt, Saved_storyID, storyRoleForm.style);
        console.log(`start getVoices`);
        // // 這邊是兩頁一個語音
        // const joinedStoryTale: string[] = generated_story_array.slice(1).reduce((acc: string[], curr: string, i: number) => {
        //     if (i % 2 === 0) {
        //         if (i + 1 < generated_story_array.length - 1) {
        //             acc.push(generated_story_array[i + 1] + generated_story_array[i + 2]);
        //         } else {
        //             acc.push(curr);
        //         }
        //     }
        //     return acc;
        // }, []);
        // 這邊是每頁一個語音
        const joinedStoryTale = generated_story_array.slice(1);
        yield (0, exports.genStoryVoice)(userId, Saved_storyID, joinedStoryTale, voiceModelName);
        console.log(`story generate finish !!`);
        return Saved_storyID;
    }
    catch (error) {
        console.error(`Error generating story: ${error.message}`);
        throw error;
    }
});
exports.generateStory = generateStory;
let generated_imageprompt_array = [];
// 用故事內容生成故事圖片prompt
const GenImagePrompt = (generated_story_array, _id, storyRoleForm) => __awaiter(void 0, void 0, void 0, function* () {
    if (generated_story_array) {
        generated_imageprompt_array = yield (0, LLM_fetch_images_1.GenImg_prompt_En_array)(generated_story_array, storyRoleForm);
        console.log(`generated_imageprompt_array.length = ${generated_imageprompt_array.length}`);
        yield DataBase_1.DataBase.Update_StoryImagePromptArray(_id, generated_imageprompt_array);
    }
});
exports.GenImagePrompt = GenImagePrompt;
// 生成圖片
const GenImage = (generated_story_image_prompt, _id, sd_name) => __awaiter(void 0, void 0, void 0, function* () {
    const settingPlayload = (0, sdModel_tool_1.caseSdModelUse)(sd_name);
    let promises = [];
    const basePayload = {
        seed: -1,
        cfg_scale: 7,
        steps: 25,
        enable_hr: false,
        denoising_strength: 0.75,
        restore_faces: false,
        negative_prompt: `${settingPlayload.negative_prompt}, low res, text, logo, banner, extra digits, jpeg artifacts, signature, error, sketch, duplicate, monochrome, horror, geometry, mutation, disgusting, nsfw, nude, censored, lowres, bad anatomy, bad hands, missing fingers, fewer digits, cropped, worst quality, low quality, normal quality, signature, watermark, username, blurry, artist name, bad quality, poor quality, zombie, ugly, out of frame, hands`,
        sampler_index: settingPlayload.sampler_index || "",
        scheduler: settingPlayload.scheduler || "",
        override_settings: {
            sd_vae: settingPlayload.sd_vae || ""
        }
    };
    // 生成所有圖片
    for (let i = 0; i < generated_story_image_prompt.length; i++) {
        const payload = Object.assign(Object.assign({}, basePayload), { prompt: `${generated_story_image_prompt[i]}, ${settingPlayload.exclusive_prompt}`, width: i === 0 ? 512 : 1024, height: i === 0 ? 512 : 512 });
        console.log(`GenImage 第${i}次生成`);
        promises.push((0, fetch_1.fetchImage)(payload));
        yield new Promise(resolve => setTimeout(resolve, 100));
    }
    try {
        let generated_imagebase64_array = (yield Promise.all(promises)).flat();
        yield DataBase_1.DataBase.Update_StoryImage_Base64(_id, generated_imagebase64_array);
    }
    catch (error) {
        console.error(`Error in GenImage: ${error.message}`);
    }
});
exports.GenImage = GenImage;
