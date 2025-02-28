"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_formidable_1 = __importDefault(require("express-formidable"));
const auth_controller_1 = require("controllers/auth.controller");
const router = (0, express_1.Router)();
router.post('/signup', (0, express_formidable_1.default)(), auth_controller_1.signup);
exports.default = router;
