"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.caseSdModelUse = exports.sdmodel_list = void 0;
// sd模型列表
exports.sdmodel_list = [
    { sd_name: "zbaseHighQualityAesthetic_sdxlV30.safetensors", show_name: "奇幻卡通風格" },
    { sd_name: "realisticVisionV60B1_v51HyperVAE.safetensors [f47e942ad4", show_name: "寫實風格" },
    { sd_name: "AnythingV5V3_v5PrtRE.safetensors", show_name: "可愛卡通風格" },
    { sd_name: "sdXL_v10VAEFix.safetensors [e6bb9ea85b]", show_name: "卡通繪本風格" },
    { sd_name: "sdxlUnstableDiffusers_v11Rundiffusion.safetensors [dda8c0514c]", show_name: "手繪風格" },
    { sd_name: "sdXL_v10VAEFix.safetensors [e6bb9ea85b]", show_name: "立體卡通風格" },
];
function caseSdModelUse(storyStyle) {
    let payload = {
        sd_name: "",
        exclusive_prompt: "",
        negative_prompt: "",
        sampler_index: "",
        sd_vae: "",
        scheduler: "" // 調度器
    };
    switch (storyStyle) {
        // 奇幻卡通風格
        case "illustriousStorybook": {
            payload.sd_name = "zbaseHighQualityAesthetic_sdxlV30.safetensors";
            payload.exclusive_prompt = '<lora:Illustrious:0.8>, <lora:Style_soph-IllustriousStorybook-SDXL:0.8>, digital storybook illustration, textured brushwork, c0l0r, sharp focus, low detail, blurry foreground, 8k resolution, disney style, art by rossdraws, cartoon cel shaded artwork';
            payload.negative_prompt = 'people, photo, deformed, black and white, realism, disfigured, low contrast';
            payload.sampler_index = "Euler a";
            break;
        }
        // 寫實風格
        case "realisticVision": {
            payload.sd_name = "realisticVisionV60B1_v51HyperVAE.safetensors [f47e942ad4]";
            payload.exclusive_prompt = "masterpiece, best quality, highres, intricate details, 4k, stunning, high quality, denoise, clean";
            payload.negative_prompt = '(nsfw, naked, nude, deformed iris, deformed pupils, semi-realistic, cgi, 3d, render, sketch, cartoon, drawing, anime, mutated hands and fingers:1.4), (deformed, distorted, disfigured:1.3), poorly drawn, bad anatomy, wrong anatomy, extra limb, missing limb, floating limbs, disconnected limbs, mutation, mutated, ugly, disgusting, amputation';
            break;
        }
        // 可愛卡通風格
        case "jIll": {
            payload.sd_name = "AnythingV5V3_v5PrtRE.safetensors";
            payload.exclusive_prompt = 'J_illustration, <lora:J_illustration:0.8>,';
            payload.negative_prompt = 'easy_negative, NSFW, (two tails:1.4),FastNegativeV2,(bad-artist:1),(loli:1.2),(worst quality, low quality:1.4),(bad_prompt_version2:0.8),bad-hands-5,lowres,bad anatomy,bad hands,((text)),(watermark),error,missing fingers,extra digit,fewer digits,cropped,worst quality,low quality,normal quality,((username)),blurry,(extra limbs),bad-artist-anime,badhandv4,EasyNegative,ng_deepnegative_v1_75t,verybadimagenegative_v1.3,BadDream,(three hands:1.1),(three legs:1.1),(more than two hands:1.2),(more than two legs:1.2), ';
            payload.sampler_index = "DPM++ 2M SDE";
            payload.scheduler = "Karras";
            payload.sd_vae = "vae-ft-mse-840000-ema-pruned.ckpt";
            break;
        }
        // 卡通繪本風格
        case "storybookRedmond": {
            payload.sd_name = "sdXL_v10VAEFix.safetensors [e6bb9ea85b]";
            payload.exclusive_prompt = "KidsRedmAF, <lora:StorybookRedmondV2-KidsBook-KidsRedmAF:1>, ";
            payload.negative_prompt = "bad art, ugly, deformed, watermark, duplicated";
            payload.sampler_index = "DPM++ 2M";
            payload.scheduler = "Karras";
            break;
        }
        // 手繪風格
        case "storybookIllustration": {
            payload.sd_name = "sdxlUnstableDiffusers_v11Rundiffusion.safetensors [dda8c0514c]";
            payload.exclusive_prompt = "style of children's book illustration <lora:novuschroma01 style_2:1> novuschroma01, ";
            payload.negative_prompt = "bad art, ugly, deformed, watermark, duplicated";
            payload.sampler_index = "Euler a";
            break;
        }
        // 立體卡通風格
        case "cartoon3d": {
            payload.sd_name = "splatterPunkNeon_v17Illustration.safetensors";
            payload.exclusive_prompt = "<lora:childrens_story_book:1>";
            payload.negative_prompt = "civit_nsfw, bad art, ugly, deformed, watermark, duplicated, ";
            payload.sampler_index = "DPM++ 2M";
            payload.scheduler = "Karras";
            break;
        }
        // 卡通繪本風格
        default: {
            payload.sd_name = "sdXL_v10VAEFix.safetensors [e6bb9ea85b]";
            payload.exclusive_prompt = "KidsRedmAF, <lora:StorybookRedmondV2-KidsBook-KidsRedmAF:1>, ";
            payload.negative_prompt = "bad art, ugly, deformed, watermark, duplicated";
            payload.sampler_index = "DPM++ 2M";
            payload.scheduler = "Karras";
            break;
        }
    }
    return payload;
}
exports.caseSdModelUse = caseSdModelUse;
