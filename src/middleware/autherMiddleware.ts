import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
    user?: {
        id: string;
        username: string;
        loginTime: number;
        iat?: number;
        exp?: number;
    };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.authToken || req.headers.authorization?.split(' ')[1];
        
        // console.log('===== Auth Debug =====');
        // console.log('Authorization:', req.headers.authorization);
        // console.log('Cookies:', req.cookies);
        // console.log('Token:', token);
        // console.log('====================');

        if (!token || token === 'undefined') {
            return res.status(401).json({ 
                success: false, 
                message: '請重新登入',
                needRelogin: true
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!);
            req.user = decoded as any;
            // console.log(`req.user: ${JSON.stringify(req.user)}`);
            next();
        } catch (error) {
            res.clearCookie('authToken');
            return res.status(401).json({ 
                success: false, 
                message: '登入已過期，請重新登入',
                needRelogin: true
            });
        }
    } catch (error) {
        console.error('Token 驗證錯誤:', error);
        return res.status(403).json({ 
            success: false, 
            message: '無效的認證令牌' 
        });
    }
};