import { VoiceController } from "../controller/voiceController";
import { Route } from "../interfaces/Route";
import { authenticateToken } from "../middleware/autherMiddleware";
import { upload } from "../utils/multer";

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
    protected setRoutes(): void {
        this.router.get(`${this.url}`,this.Controller.test);
        this.router.post(`${this.url}/uploadvoices`,authenticateToken,upload.single("file"),this.Controller.UploadVoice);
        this.router.get(`${this.url}/getVoiceList`,authenticateToken,this.Controller.getVoiceList);

        this.router.post(`${this.url}/testwhisper`,this.Controller.testwhisper);
    }
}