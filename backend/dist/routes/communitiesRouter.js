"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_formidable_1 = __importDefault(require("express-formidable"));
const isAuthMiddleware_1 = __importDefault(require("middleware/isAuthMiddleware"));
const communitiesController_1 = require("controllers/communitiesController");
const router = (0, express_1.Router)();
router.use(isAuthMiddleware_1.default);
router.post('/', (0, express_formidable_1.default)(), communitiesController_1.createCommunity);
exports.default = router;
