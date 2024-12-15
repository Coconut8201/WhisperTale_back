import { Controller } from "../interfaces/Controller";
import { Request, Response} from "express";
import { DataBase } from "../utils/DataBase";
import { GenImg_prompt_En, sdModelOption, getSDModelList } from "../utils/tools/LLM_fetch_images";
import { storyInterface } from "../interfaces/storyInterface";
import { fetchImage } from "../utils/tools/fetch";
import { RoleFormInterface } from "../interfaces/RoleFormInterface";
import { isObjectValid, generateStory } from "../utils/tools/tool";
import PQueue from 'p-queue';
import fs from "fs";
import path from 'path';  
import { openAIFetch } from "../utils/tools/openai_fetch";



export class StoryController extends Controller {
  queue = new PQueue({concurrency: 1}); // 限制為1個並發請求

  public test(Request: Request, Response: Response) {
    Response.send(`this is STORY get, use post in this url is FINE !`);
  }
  public async testOpenaiApi(Request: Request, Response: Response){
    await openAIFetch("who are you?");
  } 
  // 拿單一本書的資訊並回傳
  public async StartStory(Request:Request, Response:Response){
    const { storyId } = Request.body;
    const story:storyInterface = await DataBase.getStoryById(storyId);
    Response.send(story);
  }

  //拿資料庫故事
  public async GetStorylistFDB(Request: Request, Response: Response) {
    try {
        const userId = (Request as any).user.id;
        if (!userId) {
            return Response.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }
        const result = await DataBase.getstoryList(userId);
        if (result.success) {
            return Response.send({
                  success: true,
                  data: result.value
              })
        } else {
            return Response.status(403).json({
                success: false,
                message: result.message
            });
        }
    } catch (error) {
        console.error('GetStorylistFDB fail:', error);
        return Response.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

  /**
   * 生成故事
   * @param Request storyInfo 你的故事是甚麼內容
   * @example http://localhost:7943/story/llm/genstory post
   * {
   *   "roleform":{"style":"帥貓咪","mainCharacter":"","description":"","otherCharacters":[]},
   *   "voiceModelName":"bbbbb3"
   * }
   */
  public LLMGenStory = async(Request: Request, Response: Response) => {
    if (!isObjectValid(Request.body)) {
      return Response.send({
          code: 403,
          message: "請求中的某個屬性是 null、undefined 或空陣列",
          success: false
      });
    }

    const userId = (Request as any).user.id;
    console.log(`userid: ${userId}`)
    let storyRoleForm: RoleFormInterface = Request.body.roleform;
    let voiceModelName: string = Request.body.voiceModelName;

    console.log(`Request.body = ${JSON.stringify(Request.body)}`); // 傳入的角色設定
    const MODEL_NAME = storyRoleForm.style;
    await sdModelOption(MODEL_NAME);

    try {
        const result:string = await this.queue.add(() => generateStory(storyRoleForm, voiceModelName, userId));
        let return_playload = {
          success: true,
          storyId: result
        };
        console.log(`return_playload = ${JSON.stringify(return_playload)}`);
        return Response.status(200).send(return_playload);
    } catch (error:any) {
      console.error(`Error in generateStory: ${error.message}`);
      return Response.status(500).send({
        success: false,
        message: 'generateStory Error: ' + error.message
      });
    }
  }

  public async genimageprompt(Request:Request, Response:Response){
    const story_slice = Request.body.story_slice!;
    const res= await GenImg_prompt_En(story_slice);
    Response.send(`res = ${res}`);
  }

  public async sdOption(Request:Request, Response:Response){
    let MODEL_NAME:string = Request.body.modelname || "fantasyWorld_v10.safetensors";
    Response.send(await sdModelOption(MODEL_NAME));
  }

  public async GetSDModelList(Request:Request, Response:Response){
    Response.send(await getSDModelList());
  }

  public ReGenImage = async (Request: Request, Response: Response) => {
    console.log(`here`);
    let { prompt } = Request.body;
    let payload: Object = {
      "prompt": prompt,
      "seed": -1,
      "cfg_scale": 7,
      "steps": 20,
      "enable_hr": false,
      "denoising_strength": 0.75,
      "restore_faces": false
    };

    try {
      let images = await fetchImage(payload);
      Response.json({ images });
    } catch (error) {
      Response.status(500).send({ error: "Failed to generate image" });
    }
  };

  public async TakeVoice(Request: Request, Response: Response) {
    try {
      const { storyId } = Request.body;

      if (!storyId) {
        return Response.status(400).send('storyId is required');
      }

      const filePath = path.resolve(process.env.dev_saveAudio!, `Saved_${storyId}.wav`);
      // console.log(`filePath = ${filePath}`);

      if (!fs.existsSync(filePath)) {
        console.error('File not found:', filePath);
        return Response.status(404).send('File not found');
      }

      const stat = fs.statSync(filePath);
      Response.writeHead(200, {
        'Content-Type': 'audio/wav',
        'Content-Length': stat.size,
        'Content-Disposition': `attachment; filename=Saved_${storyId}.wav`
      });

      const fileStream = fs.createReadStream(filePath);

      fileStream.on('error', (error) => {
        console.error('Error reading file:', error);
        Response.status(500).end('Error reading file');
      });

      fileStream.pipe(Response);

      fileStream.on('end', () => {
        console.log('File sent successfully');
        Response.end();
      });

    } catch (error) {
      console.error('Error processing request:', error);
      // Response.status(500).send('Internal Server Error');
    }
  }
}
