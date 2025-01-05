"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceRoute = void 0;
const voiceController_1 = require("../controller/voiceController");
const Route_1 = require("../interfaces/Route");
const autherMiddleware_1 = require("../middleware/autherMiddleware");
const multerMiddleware_1 = __importDefault(require("../middleware/multerMiddleware"));
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
    // https://163.13.202.128/api/voiceset/testf5tts
    setRoutes() {
        this.router.get(`${this.url}`, this.Controller.test);
        this.router.post(`${this.url}/uploadvoices`, autherMiddleware_1.authenticateToken, multerMiddleware_1.default.array('files', 10), this.Controller.UploadVoice);
        this.router.get(`${this.url}/getVoiceList`, autherMiddleware_1.authenticateToken, this.Controller.getVoiceList);
        this.router.post(`${this.url}/take_voice`, autherMiddleware_1.authenticateToken, this.Controller.takeVoice);
        this.router.post(`${this.url}/testwhisper`, this.Controller.testwhisper);
        this.router.post(`${this.url}/testf5tts`, autherMiddleware_1.authenticateToken, this.Controller.testf5tts);
    }
}
exports.VoiceRoute = VoiceRoute;
