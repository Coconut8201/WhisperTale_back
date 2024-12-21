import express from 'express';
import { DataBase } from './utils/DataBase';
import cors from 'cors';
import { router } from './Routers';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
dotenv.config();

const app = express()
const port = 7943
// const port = 8841
const ip = "163.13.202.128";
const DB = new DataBase(process.env.mongoDB_api!);

//***************************************************************************************************//

//系統伺服器
const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        const allowedOrigins = [
            'https://163.13.202.128',
            'http://163.13.202.128:3151',
            'https://163.13.202.128:3151'
        ];
        
        // 允許來自允許列表的請求
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'Cookie',
        'X-Requested-With'
    ],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400,
    optionsSuccessStatus: 200
};

// app.use((req, res, next) => {
//     console.log('請求詳情:', {
//         url: req.url,
//         method: req.method,
//         origin: req.headers.origin,
//         cookie: req.headers.cookie
//     });
//     next();
// });

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
for (const route of router) {
    app.use(route.getRouter())
}
app.use((req, res, next) => {
    req.setTimeout(600000);
    res.setTimeout(600000);
    next();
});

//=============================================
// // //dev 開發
// app.listen(port, () => {
//     console.log(`Server: http://127.0.0.1:${port}/user`)
// });

//use 使用
app.listen(port, ip,() => {
    console.log(`Server: http://${ip}:${port}/user`)
});


