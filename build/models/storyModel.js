"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storyModel = void 0;
const mongoose_1 = require("mongoose");
const storySchema = new mongoose_1.Schema({
    storyTale: { type: String, required: true },
    storyInfo: { type: String, required: true },
    image_prompt: { type: (Array), required: false },
    image_base64: { type: (Array), required: false },
    is_favorite: { type: Boolean, required: true },
    addDate: { type: Date, required: true },
});
exports.storyModel = (0, mongoose_1.model)('stories', storySchema);
