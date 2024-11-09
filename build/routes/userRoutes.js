"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controller/userController");
const autherMiddleware_1 = require("../middleware/autherMiddleware");
const router = express_1.default.Router();
const userController = new userController_1.UserController();
// 公開路由
router.post('/login', userController.Login);
router.post('/register', userController.AddUser);
// 需要認證的路由
router.get('/profile', autherMiddleware_1.authenticateToken, userController.GetProfile);
router.put('/profile', autherMiddleware_1.authenticateToken, userController.UpdateProfile);
exports.default = router;
