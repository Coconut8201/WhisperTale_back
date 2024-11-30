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
    origin: [
        'https://localhost:3151', //dev front https
        'http://localhost:3151', //dev front 
        'http://163.13.202.128:3151', //use front     
        'https://163.13.202.128:3151', //use front     
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200,
    exposedHeaders: ['Set-Cookie'],
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
for (const route of router) {
    app.use(route.getRouter())
}

//=============================================
// // //dev 開發
// app.listen(port, () => {
//     console.log(`Server: http://127.0.0.1:${port}/user`)
// });

//use 使用
app.listen(port, ip,() => {
    console.log(`Server: http://${ip}:${port}/user`)
});


