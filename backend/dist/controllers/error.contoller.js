"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const appError_1 = __importDefault(require("utils/appError"));
const globalErrorHandler = (error, _, res, _1) => {
    if (error instanceof appError_1.default) {
        const { status, statusCode, message, errors } = error;
        const responseData = { status };
        if (message.trim().length > 1) {
            responseData.message = message;
        }
        if (errors && errors.length > 0) {
            responseData.errors = errors;
        }
        res.status(statusCode).json(responseData);
        return;
    }
    res.status(500).json({
        status: 'error',
        message: 'Something went wrong'
    });
};
exports.default = globalErrorHandler;
