"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_formidable_1 = __importDefault(require("express-formidable"));
const isAuthMiddleware_1 = __importDefault(require("middleware/isAuthMiddleware"));
const communityMiddlewares_1 = require("middleware/communityMiddlewares");
// import { 
//   createCommunity, 
//   updateCommunityDescription,
//   deleteCommunity, 
//   updateCommunityProfileImage,
//   removeCommunityProfileImage,
//   updateCommunityBannerImage,
//   removeCommunityBannerImage, 
//   banUserFromCommunity,
//   undoBanUserFromCommunity,
//   inviteUserToJoinCommunity,
//   moderatorWithdrawJoinCommunityInviteForUser
// } from 'controllers/communityController';
const community_1 = require("controllers/community");
const communityMembersManagement_1 = require("controllers/community/communityMembersManagement");
const { createCommunity, deleteCommunity, updateCommunityDescription, updateCommunityProfileImage, removeCommunityProfileImage, updateCommunityBannerImage, removeCommunityBannerImage } = community_1.communityCRUD;
const { banUserFromCommunity, undoBanUserFromCommunity, inviteUserToJoinCommunity, moderatorWithdrawJoinCommunityInviteForUser } = community_1.communityMembersManagement;
const router = (0, express_1.Router)();
router.use(isAuthMiddleware_1.default);
router.post('/', (0, express_formidable_1.default)(), createCommunity);
router.delete('/:communityId', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.isLoggedUserCommunityCreatorOrModerator, deleteCommunity);
router.patch('/:communityId/updateDescription', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.isLoggedUserCommunityCreatorOrModerator, updateCommunityDescription);
router.patch('/:communityId/updateProfileImage', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.isLoggedUserCommunityCreatorOrModerator, (0, express_formidable_1.default)(), updateCommunityProfileImage);
router.patch('/:communityId/removeProfileImage', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.isLoggedUserCommunityCreatorOrModerator, (0, express_formidable_1.default)(), removeCommunityProfileImage);
router.patch('/:communityId/updateBannerImage', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.isLoggedUserCommunityCreatorOrModerator, (0, express_formidable_1.default)(), updateCommunityBannerImage);
router.patch('/:communityId/removeBannerImage', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.isLoggedUserCommunityCreatorOrModerator, removeCommunityBannerImage);
router.patch('/:communityId/banUserFromCommunity', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.isLoggedUserCommunityCreatorOrModerator, banUserFromCommunity);
router.patch('/:communityId/undoUserCommunityBan', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.isLoggedUserCommunityCreatorOrModerator, undoBanUserFromCommunity);
router.patch('/:communityId/invite', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.isLoggedUserCommunityCreatorOrModerator, inviteUserToJoinCommunity);
router.patch('/:communityId/moderatorWidthrawJoinInviteForUser', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.isLoggedUserCommunityCreatorOrModerator, moderatorWithdrawJoinCommunityInviteForUser);
router.patch('/:communityId/userAcceptInviteJoinCommunity/:inviteType', communityMiddlewares_1.doesCommunityExist, communityMembersManagement_1.userAcceptJoinCommunityInvite);
exports.default = router;
