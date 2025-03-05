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
const { banUserFromCommunity, undoBanUserFromCommunity, inviteUserToJoinAsMember, inviteUserToJoinAsModerator, withdrawCommunityInviteForUser, widthrawCommunityModeratorInvite, moderatorAcceptUserJoinRequest, moderatorDeclineUserJoinRequest } = community_1.communityMembersManagement;
const { userAcceptJoinCommunityInvite, userDeclineJoinCommunityInvite, userLeaveCommunity, userRequestCommunityJoin, userWithdrawRequestToJoinCommunity, } = community_1.communityUserActions;
const router = (0, express_1.Router)();
router.use(isAuthMiddleware_1.default);
// COMMUNUTY CRUD --start
router.post('/', (0, express_formidable_1.default)(), createCommunity);
router.delete('/:communityId', communityMiddlewares_1.doesCommunityExist, deleteCommunity);
router.patch('/:communityId/updateDescription', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.havePermissionToPerformAction, updateCommunityDescription);
router.patch('/:communityId/updateProfileImage', communityMiddlewares_1.doesCommunityExist, (0, express_formidable_1.default)(), communityMiddlewares_1.havePermissionToPerformAction, updateCommunityProfileImage);
router.patch('/:communityId/removeProfileImage', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.havePermissionToPerformAction, removeCommunityProfileImage);
router.patch('/:communityId/updateBannerImage', communityMiddlewares_1.doesCommunityExist, (0, express_formidable_1.default)(), communityMiddlewares_1.havePermissionToPerformAction, updateCommunityBannerImage);
router.patch('/:communityId/removeBannerImage', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.havePermissionToPerformAction, removeCommunityBannerImage);
// COMMUNUTY CRUD --end
// COMMUNITY MEMBER MANAGEMENT --start
router.patch('/:communityId/banUserFromCommunity', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.checkIfTargetUserExist, communityMiddlewares_1.isTargetUserLoggedInUser, communityMiddlewares_1.havePermissionToPerformAction, communityMiddlewares_1.isTargetUserAlreadyInLists, banUserFromCommunity);
router.patch('/:communityId/undoUserCommunityBan', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.checkIfTargetUserExist, communityMiddlewares_1.isTargetUserLoggedInUser, communityMiddlewares_1.havePermissionToPerformAction, communityMiddlewares_1.isTargetUserAlreadyInLists, undoBanUserFromCommunity);
router.patch('/:communityId/inviteToJoinAsMember', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.checkIfTargetUserExist, communityMiddlewares_1.havePermissionToPerformAction, communityMiddlewares_1.isTargetUserLoggedInUser, communityMiddlewares_1.isTargetUserAlreadyInLists, inviteUserToJoinAsMember);
router.patch('/:communityId/inviteToJoinAsModerator', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.checkIfTargetUserExist, communityMiddlewares_1.isTargetUserAlreadyInLists, inviteUserToJoinAsModerator);
router.patch('/:communityId/withdrawMemberJoinInvite', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.checkIfTargetUserExist, communityMiddlewares_1.isTargetUserLoggedInUser, communityMiddlewares_1.isTargetUserAlreadyInLists, communityMiddlewares_1.havePermissionToPerformAction, withdrawCommunityInviteForUser);
router.patch('/:communityId/withdrawModeratorJoinInvite', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.checkIfTargetUserExist, communityMiddlewares_1.isTargetUserLoggedInUser, communityMiddlewares_1.isTargetUserAlreadyInLists, widthrawCommunityModeratorInvite);
router.patch('/:communityId/acceptUserJoinRequest', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.checkIfTargetUserExist, communityMiddlewares_1.isTargetUserLoggedInUser, communityMiddlewares_1.isTargetUserAlreadyInLists, communityMiddlewares_1.havePermissionToPerformAction, moderatorAcceptUserJoinRequest);
router.patch('/:communityId/declineUserJoinRequest', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.checkIfTargetUserExist, communityMiddlewares_1.isTargetUserLoggedInUser, communityMiddlewares_1.isTargetUserAlreadyInLists, communityMiddlewares_1.havePermissionToPerformAction, moderatorDeclineUserJoinRequest);
// COMMUNITY MEMBER MANAGEMENT --end
// COMMUNITY USER ACTIONS --start
router.patch('/:communityId/requestToJoin', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.isTargetUserAlreadyInLists, userRequestCommunityJoin);
router.patch('/:communityId/userWithdrawRequestToJoin', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.isTargetUserAlreadyInLists, userWithdrawRequestToJoinCommunity);
router.patch('/:communityId/userAcceptInviteJoinCommunity/:inviteType', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.isTargetUserAlreadyInLists, userAcceptJoinCommunityInvite);
router.patch('/:communityId/userDeclineInviteJoinCommunity/:inviteType', communityMiddlewares_1.doesCommunityExist, userDeclineJoinCommunityInvite);
router.patch('/:communityId/userLeaveCommunity/:communityRole', communityMiddlewares_1.doesCommunityExist, userLeaveCommunity);
// COMMUNITY USER ACTIONS --end
exports.default = router;
