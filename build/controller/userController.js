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
                return res.status(400).json({ success: false, message: '用戶名或密碼錯誤' });
            }
            try {
                const result = yield DataBase_1.DataBase.VerifyUser(userName, userPassword);
                if (result.success) {
                    console.log(`用戶 ${userName} 登入成功`);
                    const user = { id: result.userId, username: userName };
                    const token = jsonwebtoken_1.default.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });
                    return res.json({ success: true, token });
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
                console.error(`登入失敗: ${e.message}`);
                return res.status(500).json({ success: false, message: '登入過程中發生錯誤' });
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
                    console.log(result.message);
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
            console.log(`Successfully added book to favorite`);
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
            console.log(`Successfully removed book to favorite`);
            Response.send(`Successfully removed book to favorite`);
        }).catch((e) => {
            console.error(`Failed removed book to favorite`);
        });
    }
}
exports.UserController = UserController;
