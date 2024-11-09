"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoute = void 0;
const userController_1 = require("../controller/userController");
const Route_1 = require("../interfaces/Route");
const multer_1 = require("../utils/multer");
const autherMiddleware_1 = require("../middleware/autherMiddleware");
const userController = new userController_1.UserController();
class UserRoute extends Route_1.Route {
    constructor() {
        super();
        this.url = '';
        this.Controller = new userController_1.UserController;
        this.url = '/user';
        this.setRoutes();
    }
    //http://localhost:7943/user
    // http://localhost:7943/user/logout
    setRoutes() {
        this.router.get(`${this.url}`, this.Controller.test);
        this.router.post(`${this.url}/login`, this.Controller.Login);
        this.router.get(`${this.url}/logout`, this.Controller.Logout);
        this.router.post(`${this.url}/adduser`, this.Controller.AddUser);
        this.router.delete(`${this.url}/deluser`, multer_1.authMiddleware, this.Controller.DeleteUser);
        this.router.post(`${this.url}/addfav`, multer_1.authMiddleware, this.Controller.AddFavorite);
        this.router.post(`${this.url}/remfav`, multer_1.authMiddleware, this.Controller.RemoveFavorite);
        this.router.get('/profile', autherMiddleware_1.authenticateToken, userController.GetProfile);
        this.router.put('/profile', autherMiddleware_1.authenticateToken, userController.UpdateProfile);
        this.router.get(`${this.url}/verify-auth`, userController.verifyAuth);
    }
}
exports.UserRoute = UserRoute;
