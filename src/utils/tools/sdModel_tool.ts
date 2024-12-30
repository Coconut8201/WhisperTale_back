

export interface sdmodel_back {
    sd_name: string,
    show_name: string,
}

// sd模型列表
export const sdmodel_list: sdmodel_back[] = [
    { sd_name: 'realisticVisionV60B1_v51HyperVAE.safetensors [f47e942ad4]', show_name: '寫實風格' },
    { sd_name: 'slatePencilMix_v10.safetensors', show_name: '素描風格' },
    { sd_name: 'ChineseInkComicStrip_v10.ckpt', show_name: '中國傳統水墨畫' },
    { sd_name: `cemremixRealistic_v10Pruned.safetensors`, show_name: `真實感` },
    { sd_name: `pixelArtDiffusionXL_spriteShaper.safetensors`, show_name: `像素風` },
    { sd_name: `handDrawnPortrait_v10.safetensors`, show_name: `手繪` },
    { sd_name: `splatterPunkNeon_v17Illustration.safetensors`, show_name: `賽博龐克風格` },
    { sd_name: `solsticeAKoreanWebtoon_v10AreumNoemaFp16.safetensors`, show_name: `韓漫` },
    { sd_name: `paintersCheckpointOilPaint_v11.safetensors`, show_name: `油畫` }
]

export function caseSdModelUse(storyStyle: string) {
    let payload = {
        sd_name: "", // 要請求的模型名稱
        exclusive_prompt: "", // 專屬生成圖片的prompt
        negative_prompt: "", // 禁用詞
        sampler_index: "", // 采样器
        sd_vae: "" // 模型VAE
    }
    switch (storyStyle) {
                // 奇幻卡通風格
                case "zbaseHighQualityAesthetic_sdxlV30.safetensors": {
                    payload.sd_name = "zbaseHighQualityAesthetic_sdxlV30.safetensors";
                    payload.exclusive_prompt = '<lora:Illustrious:0.8>, <lora:Style_soph-IllustriousStorybook-SDXL:0.8>, digital storybook illustration, textured brushwork, c0l0r, sharp focus, low detail, blurry foreground, 8k resolution, disney style, art by rossdraws, cartoon cel shaded artwork';
                    payload.negative_prompt = 'people, photo, deformed, black and white, realism, disfigured, low contrast';
                    payload.sampler_index = "Euler a";
                    break;
                }

                
        // 寫實風格
        case "realisticVisionV60B1_v51HyperVAE.safetensors [f47e942ad4]": {
            payload.sd_name = "realisticVisionV60B1_v51HyperVAE.safetensors [f47e942ad4]";
            payload.exclusive_prompt = "masterpiece, best quality, highres, intricate details, 4k, stunning, high quality, denoise, clean";
            payload.negative_prompt = '(nsfw, naked, nude, deformed iris, deformed pupils, semi-realistic, cgi, 3d, render, sketch, cartoon, drawing, anime, mutated hands and fingers:1.4), (deformed, distorted, disfigured:1.3), poorly drawn, bad anatomy, wrong anatomy, extra limb, missing limb, floating limbs, disconnected limbs, mutation, mutated, ugly, disgusting, amputation';
            break;
        }

        // 可愛卡通風格
        case "AnythingV5V3_v5PrtRE.safetensors": {
            payload.sd_name = "AnythingV5V3_v5PrtRE.safetensors";
            payload.exclusive_prompt = 'J_illustration, <lora:J_illustration:0.8>,';
            payload.negative_prompt = 'easy_negative, NSFW, (two tails:1.4),FastNegativeV2,(bad-artist:1),(loli:1.2),(worst quality, low quality:1.4),(bad_prompt_version2:0.8),bad-hands-5,lowres,bad anatomy,bad hands,((text)),(watermark),error,missing fingers,extra digit,fewer digits,cropped,worst quality,low quality,normal quality,((username)),blurry,(extra limbs),bad-artist-anime,badhandv4,EasyNegative,ng_deepnegative_v1_75t,verybadimagenegative_v1.3,BadDream,(three hands:1.1),(three legs:1.1),(more than two hands:1.2),(more than two legs:1.2), ';
            payload.sampler_index = "DPM++ 2M SDE Karras";
            payload.sd_vae = "vae-ft-mse-840000-ema-pruned.ckpt";
            break;
        }


        // 卡通繪本風格
        case "sdXL_v10VAEFix.safetensors [e6bb9ea85b]": {
            payload.sd_name = "sdXL_v10VAEFix.safetensors [e6bb9ea85b]";
            payload.exclusive_prompt = "KidsRedmAF, <lora:StorybookRedmondV2-KidsBook-KidsRedmAF:1>, ";
            payload.negative_prompt = "bad art, ugly, deformed, watermark, duplicated";
            payload.sampler_index = "DPM++ 2M Karras";
            break;
        }

        // 手繪風格
        case "sdxlUnstableDiffusers_v11Rundiffusion.safetensors [dda8c0514c]": {
            payload.sd_name = "sdxlUnstableDiffusers_v11Rundiffusion.safetensors [dda8c0514c]";
            payload.exclusive_prompt = "style of children's book illustration <lora:novuschroma01 style_2:1> novuschroma01, ";
            payload.negative_prompt = "bad art, ugly, deformed, watermark, duplicated";
            payload.sampler_index = "Euler a";
            break;
        }
        
        // 立體卡通風格
        case "splatterPunkNeon_v17Illustration.safetensors": {
            payload.sd_name = "splatterPunkNeon_v17Illustration.safetensors";
            payload.exclusive_prompt = "<lora:childrens_story_book:1>";
            payload.negative_prompt = "civit_nsfw, bad art, ugly, deformed, watermark, duplicated, ";
            payload.sampler_index = "DPM++ 2M Karras";
            break;
        }

        // 卡通繪本風格
        default: {
            payload.sd_name = "sdXL_v10VAEFix.safetensors [e6bb9ea85b]";
            payload.exclusive_prompt = "KidsRedmAF, <lora:StorybookRedmondV2-KidsBook-KidsRedmAF:1>, ";
            payload.negative_prompt = "bad art, ugly, deformed, watermark, duplicated";
            payload.sampler_index = "DPM++ 2M Karras";
            break;
        }
    }

    return payload;
}