"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const appError_1 = __importDefault(require("utils/appError"));
const user_model_1 = __importDefault(require("models/user.model"));
const notLoggedInError = new appError_1.default(401, 'You are not logged in or your session has expired.');
const isAuth = (req, _, next) => __awaiter(void 0, void 0, void 0, function* () {
    const cookies = req.cookies;
    if (!cookies) {
        next(notLoggedInError);
        return;
    }
    const token = cookies['_pplFrmCKK'];
    if (!token) {
        next(notLoggedInError);
        return;
    }
    const decodedToken = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
    if (!decodedToken || (decodedToken && !decodedToken.userId)) {
        next(notLoggedInError);
        return;
    }
    const user = yield user_model_1.default.findById(decodedToken.userId);
    if (!user) {
        next(notLoggedInError);
        return;
    }
    req.userId = user._id;
    next();
});
exports.default = isAuth;
