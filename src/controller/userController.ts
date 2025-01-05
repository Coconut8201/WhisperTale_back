import { Controller } from "../interfaces/Controller";
import { Request, Response } from "express";
import { DataBase } from "../utils/DataBase";
import jwt from 'jsonwebtoken';

export class UserController extends Controller{
    public test(Request:Request, Response:Response){
        Response.send(`This is userController`);
    }

    public async Login(req: Request, res: Response) {
        const { userName, userPassword } = req.body;
        if (!userName || !userPassword) {
            console.error('用戶名或密碼缺失');
            return res.status(400).json({ success: false, message: '請提供用戶名和密碼' });
        }

        try {
            const result = await DataBase.VerifyUser(userName, userPassword);
            if (result.success) {
                console.log(`用戶 ${userName} 登入成功`);
                const user = { 
                    id: result.userId, 
                    username: userName, 
                    loginTime: Date.now() 
                };
                
                const token = jwt.sign(user, process.env.JWT_SECRET!, { 
                    expiresIn: '24h' 
                });

                // 設置 cookie
                res.cookie('authToken', token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'none',
                    path: '/',
                    maxAge: 24 * 60 * 60 * 1000
                });

                // 調試日誌
                // console.log('===== Cookie 設置信息 =====');
                // console.log('Token 已生成:', token);
                // console.log('Cookie 已設置:', res.getHeader('Set-Cookie'));
                // console.log('==========================');

                // 響應中不返回 token
                return res.status(200).json({ 
                    success: true, 
                    message: '登入成功',
                    user: {
                        id: user.id,
                        username: user.username
                    }
                });
            } else {
                console.error(`用戶 ${userName} 登入失敗: ${result.message}`);
                return res.status(401).json({
                    success: false,
                    message: '用戶名或密碼錯誤'
                });
            }
        } catch (e: any) {
            console.error(`登入失敗:`, e);
            return res.status(500).json({ 
                success: false, 
                message: '登入過程中發生錯誤' 
            });
        }
    }

    public async Logout(req: Request, res: Response) {
        try {
            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax' as const,
                path: '/',
                maxAge: 0,
                expires: new Date(0)
            };
            res.clearCookie('authToken', cookieOptions);
    
            res.cookie('authToken', '', cookieOptions);
    
            res.setHeader(
                'Set-Cookie',
                'authToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax'
            );
    
            return res.status(200).json({ 
                success: true, 
                message: '登出成功' 
            });
        } catch (error) {
            console.error('登出過程發生錯誤:', error);
            return res.status(500).json({ 
                success: false, 
                message: '登出過程中發生錯誤' 
            });
        }
    }

    
    public async AddUser(Request:Request, Response:Response){
        const { userName, userPassword } = Request.body;
        if (!userName || !userPassword) {
            console.error('用戶名或密碼缺失');
            return Response.status(400).json({ success: false, message: '用戶名或密碼錯誤' });
        }
        try {
            const result = await DataBase.SaveNewUser(userName, userPassword);
            console.log(`result = ${JSON.stringify(result)}`)
            if (result.success) {
                // console.log(result.message);
                return Response.status(200).json({ success: true, message: result.message });
            } else if (result.code === 401) {
                console.error(result.message);
                return Response.status(401).json({ success: false, message: result.message });
            } else {
                console.error(result.message);
                return Response.status(400).json({ success: false, message: result.message });
            }
        } catch (e:any) {
            console.error(`新增用戶失敗: ${e.message}`);
            return Response.status(500).json({ success: false, message: '新增用戶過程中發生錯誤' });
        }
    }

    public DeleteUser(Request: Request, Response: Response) {
        const { username } = Request.body;
        if (!username) {
            console.error('userName is required to delete a user');
            return Response.status(400).send('userName is required');
        }
        DataBase.DelUser(username).then((result:any) => {
            if (result.success) {
                console.log(result.message);
                return Response.status(200).send(result.message);
            } else {
                console.error(result.message);
                return Response.status(404).send(result.message);
            }
        }).catch((e:any) => {
            console.error(`DeleteUser fail: ${e.message}`);
            return Response.status(403).send('AddUser fail');
        })
    }

    public AddFavorite(Request: Request, Response: Response) {
        //let Book: storyInterface = Request.body;
        const BookID = Request.query.bookid;
        if(!BookID){
            Response.status(403).send(`wrong bookID`);
        }
        DataBase.AddFav(BookID as string).then(() => {
            // console.log(`Successfully added book to favorite`);
            Response.send(`Successfully added book to favorite`);
        }).catch((e) => {
            console.error(`Failed added book to favorite`);
        })
    }

    public RemoveFavorite(Request: Request, Response: Response) {
        //let Book: storyInterface = Request.body;
        const BookID = Request.query.bookid;
        if(!BookID){
            Response.status(403).send(`wrong bookID`);
        }
        DataBase.RemoveFav( BookID as string ).then(() => {
            // console.log(`Successfully removed book to favorite`);
            Response.send(`Successfully removed book to favorite`);
        }).catch((e) => {
            console.error(`Failed removed book to favorite`);
        })

    }

    public async GetProfile(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const result = await DataBase.GetUserProfile(userId);
            
            if (result.success) {
                return res.json({
                    success: true,
                    profile: result.data
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: '找不到用戶資料'
                });
            }
        } catch (e: any) {
            console.error(`獲取用戶資料失敗: ${e.message}`);
            return res.status(500).json({
                success: false,
                message: '獲取用戶資料時發生錯誤'
            });
        }
    }

    public async UpdateProfile(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const updateData = req.body;
            
            // 驗證更新數據
            if (!this.validateProfileData(updateData)) {
                return res.status(400).json({
                    success: false,
                    message: '無效的更新數據'
                });
            }

            const result = await DataBase.UpdateUserProfile(userId, updateData);
            
            if (result.success) {
                return res.json({
                    success: true,
                    message: '用戶資料更新成功',
                    profile: result.data
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: result.message
                });
            }
        } catch (e: any) {
            console.error(`更新用戶資料失敗: ${e.message}`);
            return res.status(500).json({
                success: false,
                message: '更新用戶資料時發生錯誤'
            });
        }
    }

    private validateProfileData(data: any): boolean {
        // 實作資料驗證邏輯
        const allowedFields = ['nickname', 'email', 'phone', 'avatar'];
        const hasValidFields = Object.keys(data).every(key => 
            allowedFields.includes(key)
        );
        
        return hasValidFields;
    }

    public verifyAuth(req: Request, res: Response) {
        // console.log(`req.cookies.authToken: ${req.cookies.authToken}`)
        if (req.cookies.authToken) {
            return res.status(200).json({ isAuthenticated: true });
        } else {
            return res.status(401).json({ isAuthenticated: false });
        }
    }

    public async verifyOwnership(req: Request, res: Response) {
        const userId = (req as any).user.id;
        const storyId = req.query.storyId;
        const result = await DataBase.CheckOwnership(userId, storyId as string);
        return res.json({ success: result });
    }
}