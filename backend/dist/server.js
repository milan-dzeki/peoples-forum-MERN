"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app"));
dotenv_1.default.config();
const server = http_1.default.createServer(app_1.default);
mongoose_1.default.connect(process.env.MONGO_DATABASE_CONNECT_STRING)
    .then(() => {
    console.log('Database connected');
    server.listen(process.env.PORT || 8080, () => {
        console.log('Server connected');
    });
})
    .catch((error) => {
    console.log(error);
});
