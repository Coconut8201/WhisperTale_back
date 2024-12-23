import { fetchImage } from "../tools/fetch"; 
import OpenCC from 'opencc-js';
import { caseSdModelUse } from "./sdModel_tool";
import { GenImg_prompt_En_array } from "./LLM_fetch_images";
import { DataBase } from "../DataBase";
import { LLMGenStory_1st_2nd } from "./LLMapi";
import { RoleFormInterface } from "../../interfaces/RoleFormInterface";
import { storyInterface } from "../../interfaces/storyInterface";
import { genFishVoice } from "./trainVoiceModel";

export const delayedExecution = async(): Promise<void> => {
    console.log('Waiting for 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // 等待 3 秒鐘
}

export const CurrentTime = () =>{
    const now=new Date();
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
}

// 生成語音（fish speech）
export const genStoryVoice = async (userId: string, storyId: string, joinedStoryTale: string[], userVoiceName: string): Promise<boolean> => {
    try {
        const results = await Promise.all(
            joinedStoryTale.map((storySegment, index) => {
                const voiceName = 'page'+(index + 1).toString();
                return genFishVoice(userId, storyId, storySegment, voiceName, userVoiceName);
            })
        );
        
        return results.every(result => result === true);
    } catch (error) {
        console.error('語音生成過程中發生錯誤: ', error);
        return false;
    }
};

//  判斷物件內的屬性是否都存在
export function isObjectValid(obj: any | null | undefined): boolean {
    if (!obj) return false;
    
    // 該函式會返回 true 如果物件的每個屬性都不為 null、undefined
    return Object.values(obj).every(value => 
        value !== null && 
        value !== undefined && 
        (Array.isArray(value) ? value.length > 0 : true)
    );
}

const removeEnglish = (str: string): string => {
    return str.replace(/[a-zA-Z]/g, '');
};

// 生成故事內容
export const generateStory = async (storyRoleForm: RoleFormInterface, voiceModelName:string, userId: string): Promise<string> => {
    try {
        let Saved_storyID = await LLMGenStory_1st_2nd(storyRoleForm, Response, userId);
        if (!Saved_storyID) {
            throw new Error('Failed to generate story ID，生成故事失敗');
        }
        console.log(`Saved_storyID = ${Saved_storyID}`);

        const story: storyInterface = await DataBase.getStoryById(Saved_storyID);
        // 因為使用fish speech 的關係文字需要調整成簡體中文效果會比較好
        const converter = OpenCC.Converter({ from: 'tw', to: 'cn' });
        const transStory: string = converter(story.storyTale);

        let generated_story_array: string[] = transStory.split("\n\n") //  這邊開始是簡體中文
        .map(item => removeEnglish(item))
        .map(item => item.replace(/\n/g, ''))
        .map(item => item.trim())
        .filter(item => item !== "");

        await delayedExecution();

        console.log(`start GenImagePrompt\n`);
        await GenImagePrompt(generated_story_array || [], Saved_storyID, storyRoleForm);

        // Fetch the updated story data to get the generated image prompts
        const updatedStory: storyInterface = await DataBase.getStoryById(Saved_storyID);
        const generated_story_image_prompt = updatedStory.image_prompt;

        if (!generated_story_image_prompt || generated_story_image_prompt.length === 0) {
            throw new Error('No image prompts generated，圖片提示生成失敗');
        }
        console.log(`start GenImage`);
        await GenImage(generated_story_image_prompt, Saved_storyID, storyRoleForm.style);

        console.log(`start getVoices`);
        const joinedStoryTale: string[] = generated_story_array.slice(1).reduce((acc: string[], curr: string, i: number) => {
            if (i % 2 === 0) {
                if (i + 1 < generated_story_array.length - 1) {
                    acc.push(generated_story_array[i + 1] + generated_story_array[i + 2]);
                } else {
                    acc.push(curr);
                }
            }
            return acc;
        }, []);
        await genStoryVoice(userId, Saved_storyID, joinedStoryTale, voiceModelName);
        console.log(`story generate finish !!`);
        return Saved_storyID;
    } catch (error: any) {
        console.error(`Error generating story: ${error.message}`);
        throw error;
    }
};

let generated_imageprompt_array: string[] = [];

// 用故事內容生成故事圖片prompt
export const GenImagePrompt = async (generated_story_array: string[], _id: string, storyRoleForm: RoleFormInterface): Promise<void> => {
    if (generated_story_array) {
        generated_imageprompt_array = await GenImg_prompt_En_array(generated_story_array, storyRoleForm);
        console.log(`generated_imageprompt_array.length = ${generated_imageprompt_array.length}`);
        await DataBase.Update_StoryImagePromptArray(_id, generated_imageprompt_array);
    }
};

// 生成圖片
export const GenImage = async (generated_story_image_prompt: Array<string>, _id: string, sd_name: string): Promise<void> => {
    const settingPlayload = caseSdModelUse(sd_name);
    console.log(`settingPlayload = ${JSON.stringify(settingPlayload)}`);
    let promises: Promise<string[]>[] = [];
    for (let i = 0; i < generated_story_image_prompt.length; i++) {
        let payload: Object = {
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
        promises.push(fetchImage(payload));

        await new Promise(resolve => setTimeout(resolve, 500));
    }

    try {
        let generated_imagebase64_array: string[] = (await Promise.all(promises)).flat();
        await DataBase.Update_StoryImage_Base64(_id, generated_imagebase64_array);
    } catch (error: any) {
        console.error(`Error in GenImage: ${error.message}`);
    }
};