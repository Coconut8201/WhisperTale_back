import dotenv from "dotenv";
import { openAIFetch } from './openai_fetch';
import { LLMGen_release } from "./LLMapi";
import { RoleFormInterface } from "../../interfaces/RoleFormInterface";
dotenv.config(); 

/**
 * 更改sd option，使用想要的模型生成圖片
 * @param MODEL_NAME 要使用的sd 模型名稱
 */
export const sdModelOption = async (MODEL_NAME:string) =>{
   try {
      let payload = {
         "sd_model_checkpoint":""
      };
      payload["sd_model_checkpoint"] = MODEL_NAME;

      const updateOptions = {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(payload),
      };
      const updateResponse = await fetch(`${process.env.stable_diffusion_api}/sdapi/v1/options`, updateOptions);
      if (!updateResponse.ok) {
         throw new Error(`HTTP error! status: ${updateResponse.status}`);
      }
      return { code: 200, message:`Model option updated successfully`}
   } catch (error: any) {
      return { code: 405, message: `Error in sdModelOption: ${error.message}` };
   }
}

export const getSDModelList = async () => {
   try {
      const response = await fetch(`${process.env.stable_diffusion_api}/sdapi/v1/sd-models`);
      if (!response.ok) {
         throw new Error(`sd get models error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
   } catch (error: any) {
      console.error(`Error in getSDModelList: ${error.message}`);
      throw new Error(`getSDModelList error! status: ${error.message}`);
   }
}

export const GenImg_prompt_En = async (story_slice: string, storyRoleForm: RoleFormInterface): Promise<string> => {
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 25000);
   const prompt: string = `
   # Stable Diffusion prompt 助理

你來充當一位有藝術氣息的Stable Diffusion prompt 助理。

##任務

我用自然語言告訴你要產生的prompt的情境主題，你的任務是根據這個主題想像一幅完整的畫面，然後轉化成一份詳細的、高品質的prompt，讓Stable Diffusion可以產生高品質的影像。

## 背景介紹

Stable Diffusion是一款利用深度學習的文生圖模型，支援透過使用 prompt 來產生新的影像，描述要包含或省略的元素。

## prompt 概念

- 完整的prompt包含「**Prompt:**」和"**Negative Prompt:**"兩部分。
- prompt 用來描述圖像，由普通常見的單字構成，使用英文半角","做為分隔符號。
- negative prompt用來描述你不想在生成的圖像中出現的內容。
- 以","分隔的每個單字或片語稱為 tag。所以prompt和negative prompt是由系列由","分隔的tag組成的。

## () 和 [] 語法

調整關鍵字強度的等效方法是使用 () 和 []。 (keyword) 將tag的強度增加 1.1 倍，與 (keyword:1.1) 相同，最多可加三層。 [keyword] 將強度降低 0.9 倍，與 (keyword:0.9) 相同。

## Prompt 格式要求

下面我將說明 prompt 的生成步驟，這裡的 prompt 可用來描述人物、風景、物件或抽象數位藝術圖畫。你可以根據需要添加合理的、但不少於5處的畫面細節。

### 1. prompt 要求

- 你輸出的 Stable Diffusion prompt 以「**Prompt:**」開頭。
- prompt 內容包含畫面主體、材質、附加細節、影像品質、藝術風格、色彩色調、燈光等部分，但你輸出的prompt 不能分段，例如類似"medium:"這樣的分段描述是不需要的，也不能包含":"和"."。
- 畫面主體：不簡短的英文描述畫面主體, 如 A girl in a garden，主體細節概括（主體可以是人、事、物、景）畫面核心內容。這部分根據我每次給你的主題來產生。你可以加入更多主題相關的合理的細節。
- 對於人物主題，你必須描述人物的眼睛、鼻子、嘴唇，例如'beautiful detailed eyes,beautiful detailed lips,extremely detailed eyes and face,longeyelashes'，以免Stable Diffusion隨機生成變形的面部五官，這點非常重要。你也可以描述人物的外表、情緒、衣服、姿勢、視角、動作、背景等。人物屬性中，1girl表示一個女孩，2girls表示兩個女孩。
- 材質：用來製作藝術品的材料。例如：插圖、油畫、3D 渲染和攝影。 Medium 有強烈的效果，因為一個關鍵字可以大幅改變風格。
- 附加細節：畫面場景細節，或人物細節，描述畫面細節內容，讓影像看起來更充實合理。這部分是可選的，要注意畫面的整體和諧，不能與主題衝突。
- 圖片品質：這部分內容開頭永遠要加上“(best quality,4k,8k,highres,masterpiece:1.2),ultra-detailed,(realistic,photorealistic,photo-realistic:1.37)”， 這是高品質的標誌。其它常用的提高品質的tag還有，你可以根據主題的需求添加：HDR,UHD,studio lighting,ultra-fine painting,sharp focus,physically-based rendering,extreme detail description,professional,vivid colors,bokeh。
- 藝術風格：這部分描述圖像的風格。加入恰當的藝術風格，能提升生成的影像效果。常用的藝術風格例如：portraits,landscape,horror,anime,sci-fi,photography,concept artists等。
- 色彩色調：顏色，透過添加顏色來控制畫面的整體顏色。
- 燈光：整體畫面的光線效果。

### 2. negative prompt 要求
- negative prompt部分以"**Negative Prompt:**"開頭，你想要避免出現在圖像中的內容都可以添加到"**Negative Prompt:**"後面。
- 任何情況下，negative prompt都要包含這段內容："nsfw,(low quality,normal quality,worst quality,jpeg artifacts),cropped,monochrome,lowres,low saturation,((watermark)),(white letters) "
- 如果是人物相關的主題，你的產出需要另加一段人物相關的negative prompt，內容為：「skin spots,acnes,skin blemishes,age spot,mutated hands,mutated fingers,deformed,bad anatomy,disfigured,poorly drawn face,extra limb,ugly,poorly drawn hands,missing limb,floating limbs,disconnected limbs,out of focus,long neck,long body,extra fingers,fewer fingers,,(multi nipples),bad hands,signature,username,bad feet,blurry,bad body」。

### 3. 限制：
- tag 內容用英文單字或片語來描述，不限於我給你的單字。注意只能包含關鍵字或詞組。
- 注意不要輸出句子，不要有任何解釋。
- tag數量限制40個以內，單字數量限制在60個以內。
- tag不要帶引號("")。
- 使用英文半角","做分隔符號。
- tag 依重要性從高到低的順序排列。
- 我給你的主題可能是用中文描述，你給的prompt和negative prompt只用英文。

我想生成的圖片內容為：${story_slice}
繪本故事中全部的設定如下：
故事主角: ${storyRoleForm.mainCharacter}
其他角色: ${storyRoleForm.otherCharacters} 
故事情節: ${storyRoleForm.description}
其他角色設定: ${storyRoleForm.relationships}
請根據角色的設定生成符合特定的角色，並且符合故事情節的圖片prompt。
`
   try {
      const response = await openAIFetch(prompt);
      clearTimeout(timeoutId);
      return response || "";
   } catch (error: any) {
      if (error.name === 'AbortError') {
         console.error(`GenImg_prompt_En Request timed out after 25 seconds error: ${error}`);
         await LLMGen_release();
      } else {
         console.error(`GenImg_prompt_En fail: ${error}`);
         throw error;
      }
      return "";
   }
}


let generated_imageprompt_array: string[];

/**
 * 生成圖片prompt(輸出應為英文，這樣才不會出錯)
 */
export const GenImg_prompt_En_array = async (story_array:string[], storyRoleForm: RoleFormInterface):Promise<string[]> => {
   generated_imageprompt_array = [];
   try{
      var i=0;
      console.log(`story_array.length = ${story_array.length}`);
      for (let i = 0; i < story_array.length; i++) {
         const story_slice = story_array[i];
         console.log(`第 ${i} 次生成`);
         generated_imageprompt_array.push(await GenImg_prompt_En(story_slice,storyRoleForm));
      }
      
      console.log(`generated_imageprompt success`);
      return generated_imageprompt_array;
   }catch(error){
      console.error(`Error in GenImg_prompt_En_array: ${error}`);
      throw error;
   }
};