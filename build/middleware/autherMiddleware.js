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
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = req.cookies.authToken || ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1]);
        console.log('===== Auth Debug =====');
        console.log('Authorization:', req.headers.authorization);
        console.log('Cookies:', req.cookies);
        console.log('Token:', token);
        console.log('====================');
        if (!token || token === 'undefined') {
            return res.status(401).json({
                success: false,
                message: '請重新登入',
                needRelogin: true
            });
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            // console.log(`req.user: ${JSON.stringify(req.user)}`);
            next();
        }
        catch (error) {
            res.clearCookie('authToken');
            return res.status(401).json({
                success: false,
                message: '登入已過期，請重新登入',
                needRelogin: true
            });
        }
    }
    catch (error) {
        console.error('Token 驗證錯誤:', error);
        return res.status(403).json({
            success: false,
            message: '無效的認證令牌'
        });
    }
});
exports.authenticateToken = authenticateToken;
