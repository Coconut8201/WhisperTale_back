"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const userSchema = new mongoose_1.default.Schema({
    userName: { type: String, required: true, unique: true },
    userPassword: { type: String, required: true },
    email: { type: String },
    nickname: { type: String },
    phone: { type: String },
    avatar: { type: String },
    booklist: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Story' }]
}, {
    timestamps: true
});
exports.userModel = mongoose_1.default.model('User', userSchema);
