"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const catchAsync = (controller) => {
    return (req, res, next) => {
        controller(req, res, next).catch((err) => next(err));
    };
};
exports.default = catchAsync;
