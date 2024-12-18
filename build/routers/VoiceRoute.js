"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceRoute = void 0;
const voiceController_1 = require("../controller/voiceController");
const Route_1 = require("../interfaces/Route");
const autherMiddleware_1 = require("../middleware/autherMiddleware");
const multer_1 = require("../utils/multer");
class VoiceRoute extends Route_1.Route {
    constructor() {
        super();
        this.url = '';
        this.Controller = new voiceController_1.VoiceController;
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
    setRoutes() {
        this.router.get(`${this.url}`, this.Controller.test);
        this.router.post(`${this.url}/uploadvoices`, autherMiddleware_1.authenticateToken, multer_1.upload.single("file"), this.Controller.UploadVoice);
        this.router.get(`${this.url}/getVoiceList`, autherMiddleware_1.authenticateToken, this.Controller.getVoiceList);
        this.router.post(`${this.url}/take_voice`, autherMiddleware_1.authenticateToken, this.Controller.takeVoice);
        this.router.post(`${this.url}/testwhisper`, this.Controller.testwhisper);
    }
}
exports.VoiceRoute = VoiceRoute;
