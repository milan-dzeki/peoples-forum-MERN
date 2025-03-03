"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_formidable_1 = __importDefault(require("express-formidable"));
const isAuthMiddleware_1 = __importDefault(require("middleware/isAuthMiddleware"));
const communityMiddlewares_1 = require("middleware/communityMiddlewares");
const community_1 = require("controllers/community");
const { createCommunity, deleteCommunity, updateCommunityDescription, updateCommunityProfileImage, removeCommunityProfileImage, updateCommunityBannerImage, removeCommunityBannerImage } = community_1.communityCRUD;
const { banUserFromCommunity, undoBanUserFromCommunity, inviteUserToJoinCommunity, moderatorWithdrawJoinCommunityInviteForUser, userAcceptJoinCommunityInvite, userDeclineJoinCommunityInvite, userLeaveCommunity } = community_1.communityMembersManagement;
const router = (0, express_1.Router)();
router.use(isAuthMiddleware_1.default);
router.post('/', (0, express_formidable_1.default)(), createCommunity);
router.delete('/:communityId', communityMiddlewares_1.doesCommunityExist, deleteCommunity);
router.patch('/:communityId/updateDescription', communityMiddlewares_1.doesCommunityExist, 
// isLoggedUserCommunityCreatorOrModerator, 
communityMiddlewares_1.havePermissionToPerformAction, updateCommunityDescription);
router.patch('/:communityId/updateProfileImage', communityMiddlewares_1.doesCommunityExist, 
// isLoggedUserCommunityCreatorOrModerator, 
(0, express_formidable_1.default)(), communityMiddlewares_1.havePermissionToPerformAction, updateCommunityProfileImage);
router.patch('/:communityId/removeProfileImage', communityMiddlewares_1.doesCommunityExist, 
// isLoggedUserCommunityCreatorOrModerator, 
communityMiddlewares_1.havePermissionToPerformAction, removeCommunityProfileImage);
router.patch('/:communityId/updateBannerImage', communityMiddlewares_1.doesCommunityExist, 
// isLoggedUserCommunityCreatorOrModerator, 
(0, express_formidable_1.default)(), communityMiddlewares_1.havePermissionToPerformAction, updateCommunityBannerImage);
router.patch('/:communityId/removeBannerImage', communityMiddlewares_1.doesCommunityExist, 
// isLoggedUserCommunityCreatorOrModerator,
communityMiddlewares_1.havePermissionToPerformAction, removeCommunityBannerImage);
router.patch('/:communityId/banUserFromCommunity', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.isLoggedUserCommunityCreatorOrModerator, communityMiddlewares_1.checkIfTargetUserExist, banUserFromCommunity);
router.patch('/:communityId/undoUserCommunityBan', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.isLoggedUserCommunityCreatorOrModerator, communityMiddlewares_1.checkIfTargetUserExist, undoBanUserFromCommunity);
router.patch('/:communityId/invite', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.isLoggedUserCommunityCreatorOrModerator, communityMiddlewares_1.checkIfTargetUserExist, inviteUserToJoinCommunity);
router.patch('/:communityId/moderatorWidthrawJoinInviteForUser', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.isLoggedUserCommunityCreatorOrModerator, communityMiddlewares_1.checkIfTargetUserExist, moderatorWithdrawJoinCommunityInviteForUser);
router.patch('/:communityId/userAcceptInviteJoinCommunity/:inviteType', communityMiddlewares_1.doesCommunityExist, userAcceptJoinCommunityInvite);
router.patch('/:communityId/userDeclineInviteJoinCommunity/:inviteType', communityMiddlewares_1.doesCommunityExist, userDeclineJoinCommunityInvite);
router.patch('/:communityId/userLeaveCommunity/:communityRole', communityMiddlewares_1.doesCommunityExist, userLeaveCommunity);
exports.default = router;
