"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = exports.upload = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const multer_1 = __importDefault(require("multer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, process.env.dev_saveRecording);
    },
    filename: (req, file, cb) => {
        cb(null, "aaa.wav");
    },
});
exports.upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.originalname.match(/\.(wav|mp3)$/)) {
            cb(null, true);
        }
        else {
            cb(new Error('Please upload an image'));
        }
    },
});
const authMiddleware = (req, res, next) => {
    var _a;
    const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: '未提供認證令牌' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({ message: '無效的認證令牌' });
    }
};
exports.authMiddleware = authMiddleware;
