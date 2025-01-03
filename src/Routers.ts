import { Route } from "./interfaces/Route";
import { StoryRoute } from "./routers/StoryRoute";
import { UserRoute } from "./routers/userRoute";
import {VoiceRoute} from "./routers/VoiceRoute";

export const router:Array<Route> = [
    new StoryRoute(), new UserRoute, new VoiceRoute(),
];