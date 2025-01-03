"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const StoryRoute_1 = require("./routers/StoryRoute");
const userRoute_1 = require("./routers/userRoute");
const VoiceRoute_1 = require("./routers/VoiceRoute");
exports.router = [
    new StoryRoute_1.StoryRoute(), new userRoute_1.UserRoute, new VoiceRoute_1.VoiceRoute(),
];
