import express from 'express';
import { UserController } from '../controller/userController';
import { authenticateToken } from '../middleware/autherMiddleware';

const router = express.Router();
const userController = new UserController();

// 公開路由
router.post('/login', userController.Login);
router.post('/register', userController.AddUser);

// 需要認證的路由
router.get('/profile', authenticateToken, userController.GetProfile);
router.put('/profile', authenticateToken, userController.UpdateProfile);

export default router; 