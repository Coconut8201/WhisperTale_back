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
exports.GenImage = exports.GenImagePrompt = exports.generateStory = exports.isObjectValid = exports.GenVoice = exports.CurrentTime = exports.delayedExecution = void 0;
const fetch_1 = require("../tools/fetch");
const sdModel_tool_1 = require("./sdModel_tool");
const LLM_fetch_images_1 = require("./LLM_fetch_images");
const DataBase_1 = require("../DataBase");
const LLMapi_1 = require("./LLMapi");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
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
const GenVoice = (storyId, storyTale) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { audioFileName, audioBuffer } = yield (0, fetch_1.getVoices)(storyId, storyTale);
        const filePath = path_1.default.join(process.env.dev_saveAudio, audioFileName);
        yield promises_1.default.writeFile(filePath, Buffer.from(audioBuffer));
        console.log(`Voice generated successfully, and saved success`);
    }
    catch (error) {
        console.error("Error in GenVoice: ", error);
    }
});
exports.GenVoice = GenVoice;
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
        let generated_story_array = story.storyTale.split("\n\n")
            .map(item => removeEnglish(item))
            .map(item => item.replace(/\n/g, ''))
            .map(item => item.trim())
            .filter(item => item !== "");
        yield (0, exports.delayedExecution)();
        //! 這邊取消註解
        // console.log(`start GenImagePrompt\n`);
        // await GenImagePrompt(generated_story_array || [], Saved_storyID);
        // await LLMGen_release(); // 清除Ollama model 占用記憶體
        // // Fetch the updated story data to get the generated image prompts
        // const updatedStory: storyInterface = await DataBase.getStoryById(Saved_storyID);
        // const generated_story_image_prompt = updatedStory.image_prompt;
        // if (!generated_story_image_prompt || generated_story_image_prompt.length === 0) {
        //     throw new Error('No image prompts generated，圖片提示生成失敗');
        // }
        // console.log(`start GenImage`);
        // await GenImage(generated_story_image_prompt, Saved_storyID, storyRoleForm.style);
        // console.log(`start getVoices`);
        const joinedStory = generated_story_array.reduce((acc, curr, i) => {
            if (i % 2 === 0) {
                if (i + 1 < generated_story_array.length) {
                    acc.push(generated_story_array[i] + generated_story_array[i + 1]);
                }
                else {
                    acc.push(curr);
                }
            }
            return acc;
        }, []);
        yield (0, exports.GenVoice)(Saved_storyID, joinedStory, voiceModelName);
        // console.log(`story generate finish !!`);
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
const GenImagePrompt = (generated_story_array, _id) => __awaiter(void 0, void 0, void 0, function* () {
    if (generated_story_array) {
        generated_imageprompt_array = yield (0, LLM_fetch_images_1.GenImg_prompt_En_array)(generated_story_array);
        console.log(`generated_imageprompt_array.length = ${generated_imageprompt_array.length}`);
        yield DataBase_1.DataBase.Update_StoryImagePromptArray(_id, generated_imageprompt_array);
    }
});
exports.GenImagePrompt = GenImagePrompt;
// 生成圖片
const GenImage = (generated_story_image_prompt, _id, sd_name) => __awaiter(void 0, void 0, void 0, function* () {
    const settingPlayload = (0, sdModel_tool_1.caseSdModelUse)(sd_name);
    console.log(`settingPlayload = ${JSON.stringify(settingPlayload)}`);
    let promises = [];
    for (let i = 0; i < generated_story_image_prompt.length; i++) {
        let payload = {
            "prompt": generated_story_image_prompt[i] + ", " + settingPlayload.exclusive_prompt,
            "seed": -1,
            "cfg_scale": 7,
            "steps": 20,
            "enable_hr": false,
            "denoising_strength": 0.75,
            "restore_faces": false,
            "negative_prompt": settingPlayload.negative_prompt + ", " + "low res, text, logo, banner, extra digits, jpeg artifacts, signature,  error, sketch ,duplicate, monochrome, horror, geometry, mutation, disgusting, nsfw, nude, censored, lowres, bad anatomy, bad hands,  missing fingers, fewer digits, cropped, worst quality, low quality, normal quality, signature, watermark, username, blurry, artist name, bad quality, poor quality, zombie, ugly, out of frame",
        };
        console.log(`GenImage 第${i}次生成`);
        promises.push((0, fetch_1.fetchImage)(payload));
        yield new Promise(resolve => setTimeout(resolve, 500));
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
