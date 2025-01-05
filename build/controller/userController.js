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
exports.UserController = void 0;
const Controller_1 = require("../interfaces/Controller");
const DataBase_1 = require("../utils/DataBase");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class UserController extends Controller_1.Controller {
    test(Request, Response) {
        Response.send(`This is userController`);
    }
    Login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { userName, userPassword } = req.body;
            if (!userName || !userPassword) {
                console.error('用戶名或密碼缺失');
                return res.status(400).json({ success: false, message: '請提供用戶名和密碼' });
            }
            try {
                const result = yield DataBase_1.DataBase.VerifyUser(userName, userPassword);
                if (result.success) {
                    console.log(`用戶 ${userName} 登入成功`);
                    const user = {
                        id: result.userId,
                        username: userName,
                        loginTime: Date.now()
                    };
                    const token = jsonwebtoken_1.default.sign(user, process.env.JWT_SECRET, {
                        expiresIn: '24h'
                    });
                    // 設置 cookie
                    res.cookie('authToken', token, {
                        httpOnly: true,
                        secure: true,
                        sameSite: 'none',
                        path: '/',
                        maxAge: 24 * 60 * 60 * 1000
                    });
                    // 調試日誌
                    // console.log('===== Cookie 設置信息 =====');
                    // console.log('Token 已生成:', token);
                    // console.log('Cookie 已設置:', res.getHeader('Set-Cookie'));
                    // console.log('==========================');
                    // 響應中不返回 token
                    return res.status(200).json({
                        success: true,
                        message: '登入成功',
                        user: {
                            id: user.id,
                            username: user.username
                        }
                    });
                }
                else {
                    console.error(`用戶 ${userName} 登入失敗: ${result.message}`);
                    return res.status(401).json({
                        success: false,
                        message: '用戶名或密碼錯誤'
                    });
                }
            }
            catch (e) {
                console.error(`登入失敗:`, e);
                return res.status(500).json({
                    success: false,
                    message: '登入過程中發生錯誤'
                });
            }
        });
    }
    Logout(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cookieOptions = {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    path: '/',
                    maxAge: 0,
                    expires: new Date(0)
                };
                res.clearCookie('authToken', cookieOptions);
                res.cookie('authToken', '', cookieOptions);
                res.setHeader('Set-Cookie', 'authToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax');
                return res.status(200).json({
                    success: true,
                    message: '登出成功'
                });
            }
            catch (error) {
                console.error('登出過程發生錯誤:', error);
                return res.status(500).json({
                    success: false,
                    message: '登出過程中發生錯誤'
                });
            }
        });
    }
    AddUser(Request, Response) {
        return __awaiter(this, void 0, void 0, function* () {
            const { userName, userPassword } = Request.body;
            if (!userName || !userPassword) {
                console.error('用戶名或密碼缺失');
                return Response.status(400).json({ success: false, message: '用戶名或密碼錯誤' });
            }
            try {
                const result = yield DataBase_1.DataBase.SaveNewUser(userName, userPassword);
                console.log(`result = ${JSON.stringify(result)}`);
                if (result.success) {
                    // console.log(result.message);
                    return Response.status(200).json({ success: true, message: result.message });
                }
                else if (result.code === 401) {
                    console.error(result.message);
                    return Response.status(401).json({ success: false, message: result.message });
                }
                else {
                    console.error(result.message);
                    return Response.status(400).json({ success: false, message: result.message });
                }
            }
            catch (e) {
                console.error(`新增用戶失敗: ${e.message}`);
                return Response.status(500).json({ success: false, message: '新增用戶過程中發生錯誤' });
            }
        });
    }
    DeleteUser(Request, Response) {
        const { username } = Request.body;
        if (!username) {
            console.error('userName is required to delete a user');
            return Response.status(400).send('userName is required');
        }
        DataBase_1.DataBase.DelUser(username).then((result) => {
            if (result.success) {
                console.log(result.message);
                return Response.status(200).send(result.message);
            }
            else {
                console.error(result.message);
                return Response.status(404).send(result.message);
            }
        }).catch((e) => {
            console.error(`DeleteUser fail: ${e.message}`);
            return Response.status(403).send('AddUser fail');
        });
    }
    AddFavorite(Request, Response) {
        //let Book: storyInterface = Request.body;
        const BookID = Request.query.bookid;
        if (!BookID) {
            Response.status(403).send(`wrong bookID`);
        }
        DataBase_1.DataBase.AddFav(BookID).then(() => {
            // console.log(`Successfully added book to favorite`);
            Response.send(`Successfully added book to favorite`);
        }).catch((e) => {
            console.error(`Failed added book to favorite`);
        });
    }
    RemoveFavorite(Request, Response) {
        //let Book: storyInterface = Request.body;
        const BookID = Request.query.bookid;
        if (!BookID) {
            Response.status(403).send(`wrong bookID`);
        }
        DataBase_1.DataBase.RemoveFav(BookID).then(() => {
            // console.log(`Successfully removed book to favorite`);
            Response.send(`Successfully removed book to favorite`);
        }).catch((e) => {
            console.error(`Failed removed book to favorite`);
        });
    }
    GetProfile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.id;
                const result = yield DataBase_1.DataBase.GetUserProfile(userId);
                if (result.success) {
                    return res.json({
                        success: true,
                        profile: result.data
                    });
                }
                else {
                    return res.status(404).json({
                        success: false,
                        message: '找不到用戶資料'
                    });
                }
            }
            catch (e) {
                console.error(`獲取用戶資料失敗: ${e.message}`);
                return res.status(500).json({
                    success: false,
                    message: '獲取用戶資料時發生錯誤'
                });
            }
        });
    }
    UpdateProfile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.id;
                const updateData = req.body;
                // 驗證更新數據
                if (!this.validateProfileData(updateData)) {
                    return res.status(400).json({
                        success: false,
                        message: '無效的更新數據'
                    });
                }
                const result = yield DataBase_1.DataBase.UpdateUserProfile(userId, updateData);
                if (result.success) {
                    return res.json({
                        success: true,
                        message: '用戶資料更新成功',
                        profile: result.data
                    });
                }
                else {
                    return res.status(400).json({
                        success: false,
                        message: result.message
                    });
                }
            }
            catch (e) {
                console.error(`更新用戶資料失敗: ${e.message}`);
                return res.status(500).json({
                    success: false,
                    message: '更新用戶資料時發生錯誤'
                });
            }
        });
    }
    validateProfileData(data) {
        // 實作資料驗證邏輯
        const allowedFields = ['nickname', 'email', 'phone', 'avatar'];
        const hasValidFields = Object.keys(data).every(key => allowedFields.includes(key));
        return hasValidFields;
    }
    verifyAuth(req, res) {
        // console.log(`req.cookies.authToken: ${req.cookies.authToken}`)
        if (req.cookies.authToken) {
            return res.status(200).json({ isAuthenticated: true });
        }
        else {
            return res.status(401).json({ isAuthenticated: false });
        }
    }
    verifyOwnership(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.id;
            const storyId = req.query.storyId;
            const result = yield DataBase_1.DataBase.CheckOwnership(userId, storyId);
            return res.json({ success: result });
        });
    }
}
exports.UserController = UserController;
