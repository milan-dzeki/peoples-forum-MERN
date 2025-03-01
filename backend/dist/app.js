"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const errorContoller_1 = __importDefault(require("controllers/errorContoller"));
const authRouter_1 = __importDefault(require("routes/authRouter"));
const communitiesRouter_1 = __importDefault(require("routes/communitiesRouter"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use('/api/v0/auth', authRouter_1.default);
app.use('/api/v0/communities', communitiesRouter_1.default);
app.use(errorContoller_1.default);
exports.default = app;
