import { StoryController } from "../controller/storyController";
import { Route } from "../interfaces/Route";
import { authenticateToken } from '../middleware/autherMiddleware';


export class StoryRoute extends Route{
   protected url: string = '';
   protected Controller = new StoryController;
   constructor(){
      super()
      this.url = '/story';
      this.setRoutes();
   }

   // http://localhost:7943/story
   protected setRoutes(): void {
      this.router.get(`${this.url}`, this.Controller.test);
      this.router.get(`${this.url}/ta`, this.Controller.testOpenaiApi);
      this.router.post(`${this.url}/startstory`, this.Controller.StartStory);
      this.router.get(`${this.url}/getstorylist_fdb`, authenticateToken,this.Controller.GetStorylistFDB);
      this.router.post(`${this.url}/llm/genstory`, authenticateToken, (req, res, next) => {
         req.setTimeout(600000);
         res.setTimeout(600000);
         next();
     },this.Controller.LLMGenStory);

      this.router.post(`${this.url}/makezhuyin`, this.Controller.makezhuyin);
      this.router.post(`${this.url}/image/sdoption`, this.Controller.sdOption);
      this.router.get(`${this.url}/images/sdmodellist`, this.Controller.GetSDModelList);
      this.router.post(`${this.url}/image/re_gen_image`, this.Controller.ReGenImage);

      this.router.post(`${this.url}/voice/take_voice`, this.Controller.TakeVoice);
      // http://localhost:7943/story/startstory
      // http://localhost:7943/story/getstorylist_fdb
      // http://localhost:7943/story/llm/genstory
      // http://localhost:7943/story/llm/genimageprompt
      // http://localhost:7943/story/image/sdoption
      // http://localhost:7943/story/images/sdmodellist
      // http://localhost:7943/story/image/re_gen_image

      // http://localhost:7943/story/voice/savevoice
      // http://localhost:7943/story/voice/take_voice

      // https://163.13.202.128/api/story/getstorylist_fdb
   }
}