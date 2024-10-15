"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoute = void 0;
const userController_1 = require("../controller/userController");
const Route_1 = require("../interfaces/Route");
const multer_1 = require("../utils/multer");
class UserRoute extends Route_1.Route {
    constructor() {
        super();
        this.url = '';
        this.Controller = new userController_1.UserController;
        this.url = '/user';
        this.setRoutes();
    }
    //http://localhost:7943/user
    setRoutes() {
        this.router.get(`${this.url}`, this.Controller.test);
        this.router.post(`${this.url}/login`, this.Controller.Login);
        this.router.post(`${this.url}/adduser`, this.Controller.AddUser);
        this.router.delete(`${this.url}/deluser`, multer_1.authMiddleware, this.Controller.DeleteUser);
        this.router.post(`${this.url}/addfav`, multer_1.authMiddleware, this.Controller.AddFavorite);
        this.router.post(`${this.url}/remfav`, multer_1.authMiddleware, this.Controller.RemoveFavorite);
    }
}
exports.UserRoute = UserRoute;
