"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_formidable_1 = __importDefault(require("express-formidable"));
const authController_1 = require("controllers/authController");
const router = (0, express_1.Router)();
router.post('/signup', (0, express_formidable_1.default)(), authController_1.signup);
router.post('/login', authController_1.login);
exports.default = router;
