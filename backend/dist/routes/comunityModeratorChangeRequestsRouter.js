"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const isAuthMiddleware_1 = __importDefault(require("middleware/isAuthMiddleware"));
const communityMiddlewares_1 = require("middleware/communityMiddlewares");
const comunityModeratorChangeRequestsMiddlewares_1 = require("middleware/comunityModeratorChangeRequestsMiddlewares");
const communityModeratorChangeRequestsController_1 = require("controllers/community/communityModeratorChangeRequestsController");
const router = (0, express_1.Router)();
router.use(isAuthMiddleware_1.default);
// router.use(isUserCommunityCreator, isModeratorRequestValid, shouldNotifyModerator);
router.post('/:communityId/decline/:requestId', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.isUserCommunityCreator, comunityModeratorChangeRequestsMiddlewares_1.isModeratorRequestValid, comunityModeratorChangeRequestsMiddlewares_1.shouldNotifyModerator, communityModeratorChangeRequestsController_1.declineModeratorRequest);
router.post('/:communityId/accept/:requestId', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.isUserCommunityCreator, comunityModeratorChangeRequestsMiddlewares_1.isModeratorRequestValid, comunityModeratorChangeRequestsMiddlewares_1.shouldNotifyModerator, communityModeratorChangeRequestsController_1.acceptModeratorRequest);
exports.default = router;
