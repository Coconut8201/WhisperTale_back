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
exports.StoryController = void 0;
const Controller_1 = require("../interfaces/Controller");
const DataBase_1 = require("../utils/DataBase");
const LLM_fetch_images_1 = require("../utils/tools/LLM_fetch_images");
const fetch_1 = require("../utils/tools/fetch");
const tool_1 = require("../utils/tools/tool");
const p_queue_1 = __importDefault(require("p-queue"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const openai_fetch_1 = require("../utils/tools/openai_fetch");
class StoryController extends Controller_1.Controller {
    constructor() {
        super(...arguments);
        this.queue = new p_queue_1.default({ concurrency: 1 }); // 限制為1個並發請求
        /**
         * 生成故事
         * @param Request storyInfo 你的故事是甚麼內容
         * @example http://localhost:7943/story/llm/genstory post
         * {
         *   "roleform":{"style":"帥貓咪","mainCharacter":"","description":"","otherCharacters":[]},
         *   "voiceModelName":"bbbbb3"
         * }
         */
        this.LLMGenStory = (Request, Response) => __awaiter(this, void 0, void 0, function* () {
            if (!(0, tool_1.isObjectValid)(Request.body)) {
                return Response.send({
                    code: 403,
                    message: "請求中的某個屬性是 null、undefined 或空陣列",
                    success: false
                });
            }
            const userId = Request.user.id;
            let storyRoleForm = Request.body.roleform;
            let voiceModelName = Request.body.voiceModelName;
            console.log(`Request.body = ${JSON.stringify(Request.body)}`); // 傳入的角色設定
            const MODEL_NAME = storyRoleForm.style;
            yield (0, LLM_fetch_images_1.sdModelOption)(MODEL_NAME);
            try {
                const result = yield this.queue.add(() => (0, tool_1.generateStory)(storyRoleForm, voiceModelName, userId));
                let return_playload = {
                    success: true,
                    storyId: result
                };
                console.log(`return_playload = ${JSON.stringify(return_playload)}`);
                return Response.status(200).send(return_playload);
            }
            catch (error) {
                console.error(`Error in generateStory: ${error.message}`);
                return Response.status(500).send({
                    success: false,
                    message: 'generateStory Error: ' + error.message
                });
            }
        });
        this.ReGenImage = (Request, Response) => __awaiter(this, void 0, void 0, function* () {
            console.log(`here`);
            let { prompt } = Request.body;
            let payload = {
                "prompt": prompt,
                "seed": -1,
                "cfg_scale": 7,
                "steps": 20,
                "enable_hr": false,
                "denoising_strength": 0.75,
                "restore_faces": false
            };
            try {
                let images = yield (0, fetch_1.fetchImage)(payload);
                Response.json({ images });
            }
            catch (error) {
                Response.status(500).send({ error: "Failed to generate image" });
            }
        });
    }
    test(Request, Response) {
        Response.send(`this is STORY get, use post in this url is FINE !`);
    }
    testOpenaiApi(Request, Response) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, openai_fetch_1.openAIFetch)("who are you?");
        });
    }
    // 拿單一本書的資訊並回傳
    StartStory(Request, Response) {
        return __awaiter(this, void 0, void 0, function* () {
            const { storyId } = Request.body;
            const story = yield DataBase_1.DataBase.getStoryById(storyId);
            Response.send(story);
        });
    }
    //拿資料庫故事
    GetStorylistFDB(Request, Response) {
        let { userId } = Request.query;
        console.log(`userId = ${userId}`);
        DataBase_1.DataBase.getstoryList(userId).then((result) => {
            if (result.success) {
                return Response.status(200).send(result.message);
            }
            else {
                return Response.status(403).send(result.message);
            }
        }).catch((e) => {
            console.error(`GetStorylistFDB fail: ${e.message}`);
            return Response.status(400).send('GetStorylistFDB fail');
        });
    }
    genimageprompt(Request, Response) {
        return __awaiter(this, void 0, void 0, function* () {
            const story_slice = Request.body.story_slice;
            const res = yield (0, LLM_fetch_images_1.GenImg_prompt_En)(story_slice);
            Response.send(`res = ${res}`);
        });
    }
    sdOption(Request, Response) {
        return __awaiter(this, void 0, void 0, function* () {
            let MODEL_NAME = Request.body.modelname || "fantasyWorld_v10.safetensors";
            Response.send(yield (0, LLM_fetch_images_1.sdModelOption)(MODEL_NAME));
        });
    }
    GetSDModelList(Request, Response) {
        return __awaiter(this, void 0, void 0, function* () {
            Response.send(yield (0, LLM_fetch_images_1.getSDModelList)());
        });
    }
    SaveVoice(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { storyId, storyTale, voiceModelName } = req.body;
                const { audioFileName, audioBuffer } = yield (0, fetch_1.getVoices)(storyId, storyTale, voiceModelName);
                const filePath = path_1.default.join(process.env.dev_saveAudio, audioFileName);
                yield fs_1.default.promises.writeFile(filePath, Buffer.from(audioBuffer));
                res.json({
                    success: true,
                    message: "Voice generated successfully",
                    audioFilePath: filePath,
                    audioFileName: audioFileName
                });
            }
            catch (error) {
                console.error("Error in voice generation test:", error);
                let errorMessage = "An unknown error occurred";
                if (error instanceof Error) {
                    errorMessage = error.message;
                }
                res.status(500).json({
                    success: false,
                    message: "Voice generation test failed",
                    error: errorMessage
                });
            }
        });
    }
    TakeVoice(Request, Response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { storyId } = Request.body;
                if (!storyId) {
                    return Response.status(400).send('storyId is required');
                }
                const filePath = path_1.default.resolve(process.env.dev_saveAudio, `Saved_${storyId}.wav`);
                // console.log(`filePath = ${filePath}`);
                if (!fs_1.default.existsSync(filePath)) {
                    console.error('File not found:', filePath);
                    return Response.status(404).send('File not found');
                }
                const stat = fs_1.default.statSync(filePath);
                Response.writeHead(200, {
                    'Content-Type': 'audio/wav',
                    'Content-Length': stat.size,
                    'Content-Disposition': `attachment; filename=Saved_${storyId}.wav`
                });
                const fileStream = fs_1.default.createReadStream(filePath);
                fileStream.on('error', (error) => {
                    console.error('Error reading file:', error);
                    Response.status(500).end('Error reading file');
                });
                fileStream.pipe(Response);
                fileStream.on('end', () => {
                    console.log('File sent successfully');
                    Response.end();
                });
            }
            catch (error) {
                console.error('Error processing request:', error);
                // Response.status(500).send('Internal Server Error');
            }
        });
    }
}
exports.StoryController = StoryController;
