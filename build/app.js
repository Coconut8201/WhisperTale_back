"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const DataBase_1 = require("./utils/DataBase");
const cors_1 = __importDefault(require("cors"));
const Routers_1 = require("./Routers");
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = 7943;
// const port = 8841
const ip = "163.13.202.128";
const DB = new DataBase_1.DataBase(process.env.mongoDB_api);
//***************************************************************************************************//
//系統伺服器
const corsOptions = {
    origin: [
        'https://localhost:3151',
        'http://localhost:3151',
        'http://163.13.202.128:3151',
        'https://163.13.202.128:3151', //use front     
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200,
    exposedHeaders: ['Set-Cookie'],
};
app.use((0, cors_1.default)(corsOptions));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
for (const route of Routers_1.router) {
    app.use(route.getRouter());
}
//=============================================
// // //dev 開發
// app.listen(port, () => {
//     console.log(`Server: http://127.0.0.1:${port}/user`)
// });
//use 使用
app.listen(port, ip, () => {
    console.log(`Server: http://${ip}:${port}/user`);
});
