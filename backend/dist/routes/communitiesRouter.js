"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_formidable_1 = __importDefault(require("express-formidable"));
const isAuthMiddleware_1 = __importDefault(require("middleware/isAuthMiddleware"));
const communityController_1 = require("controllers/communityController");
const communityMiddlewares_1 = require("middleware/communityMiddlewares");
const router = (0, express_1.Router)();
router.use(isAuthMiddleware_1.default);
router.post('/', (0, express_formidable_1.default)(), communityController_1.createCommunity);
router.delete('/:communityId', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.isLoggedUserCommunityCreatorOrModerator, communityController_1.deleteCommunity);
router.patch('/:communityId/updateDescription', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.isLoggedUserCommunityCreatorOrModerator, communityController_1.updateCommunityDescription);
router.patch('/:communityId/updateProfileImage', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.isLoggedUserCommunityCreatorOrModerator, (0, express_formidable_1.default)(), communityController_1.updateCommunityProfileImage);
router.patch('/:communityId/removeProfileImage', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.isLoggedUserCommunityCreatorOrModerator, (0, express_formidable_1.default)(), communityController_1.removeCommunityProfileImage);
router.patch('/:communityId/updateBannerImage', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.isLoggedUserCommunityCreatorOrModerator, (0, express_formidable_1.default)(), communityController_1.updateCommunityBannerImage);
router.patch('/:communityId/removeBannerImage', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.isLoggedUserCommunityCreatorOrModerator, (0, express_formidable_1.default)(), communityController_1.removeCommunityBannerImage);
exports.default = router;
