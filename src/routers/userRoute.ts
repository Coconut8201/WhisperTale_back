import { UserController } from "../controller/userController";
import { Route } from "../interfaces/Route";
import { authMiddleware } from "../utils/multer";
import { authenticateToken } from '../middleware/autherMiddleware';

const userController = new UserController();
export class UserRoute extends Route {
    protected url: string = '';
    protected Controller = new UserController;
    constructor() {
        super()
        this.url = '/user';
        this.setRoutes();
    }

    // http://localhost:7943/user
    // http://localhost:7943/user/logout
    // http://localhost:7943/user/verify-auth
    // http://localhost:7943/user/verify-ownership
    protected setRoutes(): void {
        this.router.get(`${this.url}`,this.Controller.test);
        this.router.post(`${this.url}/login`, this.Controller.Login);
        this.router.get(`${this.url}/logout`, this.Controller.Logout);
        this.router.post(`${this.url}/adduser`, this.Controller.AddUser);
        this.router.delete(`${this.url}/deluser`, authMiddleware, this.Controller.DeleteUser);
        this.router.post(`${this.url}/addfav`, authMiddleware, this.Controller.AddFavorite);
        this.router.post(`${this.url}/remfav`, authMiddleware, this.Controller.RemoveFavorite);

        this.router.get('/profile', authenticateToken, userController.GetProfile);
        this.router.put('/profile', authenticateToken, userController.UpdateProfile);

        this.router.get(`${this.url}/verify-auth`, userController.verifyAuth)
        this.router.get(`${this.url}/verify-ownership`, authenticateToken, userController.verifyOwnership)
    }
}