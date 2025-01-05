import { VoiceController } from "../controller/voiceController";
import { Route } from "../interfaces/Route";
import { authenticateToken } from "../middleware/autherMiddleware";
import upload from "../middleware/multerMiddleware";

export class VoiceRoute extends Route {
    protected url: string = '';
    protected Controller = new VoiceController;
    constructor() {
        super()
        this.url = '/voiceset';
        this.setRoutes();
    }

    // http://localhost:7943/voiceset
    // http://localhost:7943/voiceset/uploadvoices

    // https://163.13.202.128/api/voiceset/uploadvoices
    // https://163.13.202.128/api/voiceset/getVoiceList
    // https://163.13.202.128/api/voiceset/setVoiceModel
    // https://163.13.202.128/api/voiceset/testwhisper
    // https://163.13.202.128/api/voiceset/take_voice
    // https://163.13.202.128/api/voiceset/testf5tts
    protected setRoutes(): void {
        this.router.get(`${this.url}`,this.Controller.test);
        this.router.post(`${this.url}/uploadvoices`,authenticateToken,upload.array('files', 10),this.Controller.UploadVoice);
        this.router.get(`${this.url}/getVoiceList`,authenticateToken,this.Controller.getVoiceList);
        this.router.post(`${this.url}/take_voice`, authenticateToken,this.Controller.takeVoice);
        this.router.post(`${this.url}/testwhisper`,this.Controller.testwhisper);
        this.router.post(`${this.url}/testf5tts`, authenticateToken,this.Controller.testf5tts);
    }
}
