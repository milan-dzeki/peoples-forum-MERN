"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const createTokenCookieAndResponseUser = (user) => {
    const userId = user._id.toString();
    const responseUser = {
        _id: userId,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        profilePhotoUrl: user.profilePhotoUrl || null,
        createdAt: user.createdAt
    };
    const token = jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
    if (!token) {
        return null;
    }
    return { user: responseUser, token };
};
exports.default = createTokenCookieAndResponseUser;
