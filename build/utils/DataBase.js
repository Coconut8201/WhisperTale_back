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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataBase = void 0;
const mongoose_1 = require("mongoose");
const userModel_1 = require("../models/userModel");
const storyModel_1 = require("../models/storyModel");
const tool_1 = require("./tools/tool");
class DataBase {
    constructor(url) {
        this.init(url).then(() => {
            console.log(`success: connect to  ${url}`);
        }).catch(() => {
            console.log(`error: can't connect to ${url}`);
        });
    }
    init(url) {
        return __awaiter(this, void 0, void 0, function* () {
            this.DB = yield (0, mongoose_1.connect)(url);
        });
    }
    static SaveNewStory_returnID(storyTale, storyInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const newstory = new storyModel_1.storyModel({
                    storyTale: storyTale,
                    storyInfo: storyInfo,
                    is_favorite: false,
                    addDate: (0, tool_1.CurrentTime)(),
                });
                console.log(`save newstory success`);
                yield newstory.save();
                const newStoryId = newstory._id;
                return newStoryId;
            }
            catch (e) {
                console.log(`SaveNewStory fail, error:${e}`);
            }
        });
    }
    //用ID 拿書(單一一本)
    static getStoryById(_id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const storyTale = yield storyModel_1.storyModel.findOne({ _id });
                // console.log(typeof storyTale)
                return storyTale;
            }
            catch (e) {
                console.log(`getStoryById fail, ${e}`);
            }
        });
    }
    // 用使用者id 拿sdtory list
    static getstoryList(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let returnValue = yield userModel_1.userModel.findById(userId); // 使用 findById 根据 _id 查询
                if (!returnValue) {
                    return { success: false, message: 'getstoryList fail, user not found' };
                }
                let returnValue_booklist = returnValue.booklist;
                console.log(`getstoryList returnValue_booklist = ${JSON.stringify(returnValue_booklist)}`);
                return { success: true, message: "getstoryList success", value: returnValue_booklist };
            }
            catch (e) {
                return { success: false, message: `getstoryList fail ${e.message}` };
            }
        });
    }
    static Update_StoryImagePromptSingle(_id, imagePrompt) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield storyModel_1.storyModel.findOneAndUpdate({ _id }, { $push: { image_prompt: imagePrompt } }, { new: true });
                console.log(`成功在 ID ${_id} 的故事中新增一筆 image_prompt`);
            }
            catch (e) {
                console.log(`新增 image_prompt 失敗，錯誤：${e}`);
            }
        });
    }
    static Update_StoryImagePromptArray(_id, imagePrompt) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield storyModel_1.storyModel.findOneAndUpdate({ _id }, { $set: { image_prompt: imagePrompt } });
                console.log(`Success update id ${_id} story's image_prompt array`);
            }
            catch (e) {
                console.log(`Update_StoryImagePrompt fail, ${e}`);
            }
        });
    }
    static Update_StoryImage_Base64(_id, imageBase64) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield storyModel_1.storyModel.findOneAndUpdate({ _id }, { $set: { image_base64: imageBase64 } });
                console.log(`Success update id ${_id} story's image_base64 array`);
            }
            catch (e) {
                console.log(`Update_StoryImage_Base64 fail, ${e}`);
            }
        });
    }
    // TODO 拿全部的書籍(array)
    //TODO 設定書本是否為喜歡的書籍(修改books is_favorite)
    //TODO 確認名字是否為唯一，是的話存入資料庫中
    static isNameTaken(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield userModel_1.userModel.findOne({ userName: name });
            return user !== null;
        });
    }
    static VerifyUser(userName, userPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield userModel_1.userModel.findOne({ userName: userName });
                if (!user) {
                    return { success: false, message: "用戶不存在" };
                }
                if (user.userPassword !== userPassword) {
                    return { success: false, message: "密碼錯誤" };
                }
                return { success: true, userId: user._id.toString(), message: "認證成功" };
            }
            catch (error) {
                console.error(`認證用戶時發生錯誤：${error.message}`);
                return { success: false, message: "認證過程中發生錯誤" };
            }
        });
    }
    static SaveNewUser(name, password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (yield DataBase.isNameTaken(name)) {
                    console.log(`名稱 "${name}" 已經存在，無法添加使用者。`);
                    return { success: false, message: `名稱 "${name}" 已經存在，請更換使用者名稱`, code: 401 };
                }
                const user = new userModel_1.userModel({
                    userName: name,
                    userPassword: password,
                    booklist: [],
                });
                yield user.save();
                return { success: true, message: "SaveNewUser success" };
            }
            catch (e) {
                const errorMessage = `SaveNewUser fail: ${e.message}`;
                console.error(errorMessage);
                return { success: false, message: errorMessage };
            }
        });
    }
    static DelUser(name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield userModel_1.userModel.deleteOne({ userName: name });
                if (result.deletedCount === 1) {
                    return { success: true, message: "DelUser succeed" };
                }
                else {
                    return { success: false, message: `找不到使用者: ${name}` };
                }
            }
            catch (e) {
                const errorMessage = `DelUser  fail: ${e.message}`;
                console.error(errorMessage);
                return { success: false, message: errorMessage };
            }
        });
    }
    static AddFav(story_id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const Book = yield storyModel_1.storyModel.findById(story_id);
                // test用 
                console.log(`Received story_id: ${story_id}`);
                if (Book) {
                    Book.is_favorite = true;
                    yield Book.save();
                    console.log(`DB Successfully added book to favorite`);
                }
                else {
                    console.error(`Can not find this book`);
                }
            }
            catch (e) {
                console.error(`DB Failed added book to favorite`);
            }
        });
    }
    static RemoveFav(story_id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const Book = yield storyModel_1.storyModel.findById(story_id);
                // test用 console.log(`Received story_id: ${story_id}`);
                if (Book) {
                    Book.is_favorite = false;
                    yield Book.save();
                    console.log(`Successfully removed book to favorite`);
                }
                else {
                    console.error(`Can not find this book`);
                }
            }
            catch (e) {
                console.error(`Failed removed book to favorite`);
            }
        });
    }
}
exports.DataBase = DataBase;
