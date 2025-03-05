"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_formidable_1 = __importDefault(require("express-formidable"));
const community_1 = require("configs/community");
const isAuthMiddleware_1 = __importDefault(require("middleware/isAuthMiddleware"));
const communityMiddlewares_1 = require("middleware/communityMiddlewares");
const community_2 = require("controllers/community");
const { createCommunity, deleteCommunity, updateCommunityDescription, addNewCommunityRule, updateSingleCommunityRule, updateCommunityRules, deleteSingleCommunityRule, deleteMultipleCommunityRules, deleteAllCommunityRules, updateCommunityProfileImage, removeCommunityProfileImage, updateCommunityBannerImage, removeCommunityBannerImage } = community_2.communityCRUD;
const { banUserFromCommunity, undoBanUserFromCommunity, inviteUserToJoinAsMember, inviteUserToJoinAsModerator, withdrawCommunityInviteForUser, widthrawCommunityModeratorInvite, moderatorAcceptUserJoinRequest, moderatorDeclineUserJoinRequest } = community_2.communityMembersManagement;
const { userAcceptJoinCommunityInvite, userDeclineJoinCommunityInvite, userLeaveCommunity, userRequestCommunityJoin, userWithdrawRequestToJoinCommunity, } = community_2.communityUserActions;
const router = (0, express_1.Router)();
router.use(isAuthMiddleware_1.default);
// COMMUNUTY CRUD --start
router.post('/', (0, express_formidable_1.default)(), createCommunity);
router.delete('/:communityId', communityMiddlewares_1.doesCommunityExist, deleteCommunity);
router.patch('/:communityId/updateDescription', communityMiddlewares_1.doesCommunityExist, (0, communityMiddlewares_1.havePermissionToPerformAction)(community_1.COMMUNITY_PERMISSION_NAMES.UPDATE_DESCRIPTION), updateCommunityDescription);
router.patch('/:communityId/updateProfileImage', communityMiddlewares_1.doesCommunityExist, (0, express_formidable_1.default)(), (0, communityMiddlewares_1.havePermissionToPerformAction)(community_1.COMMUNITY_PERMISSION_NAMES.UPDATE_PROFILE_PHOTO), updateCommunityProfileImage);
router.patch('/:communityId/removeProfileImage', communityMiddlewares_1.doesCommunityExist, (0, communityMiddlewares_1.havePermissionToPerformAction)(community_1.COMMUNITY_PERMISSION_NAMES.REMOVE_PROFILE_PHOTOO), removeCommunityProfileImage);
router.patch('/:communityId/updateBannerImage', communityMiddlewares_1.doesCommunityExist, (0, express_formidable_1.default)(), (0, communityMiddlewares_1.havePermissionToPerformAction)(community_1.COMMUNITY_PERMISSION_NAMES.UPDATE_BANNER_PHOTO), updateCommunityBannerImage);
router.patch('/:communityId/removeBannerImage', communityMiddlewares_1.doesCommunityExist, (0, communityMiddlewares_1.havePermissionToPerformAction)(community_1.COMMUNITY_PERMISSION_NAMES.REMOVE_BANNER_PHOTO), removeCommunityBannerImage);
// community rules --start
router.post('/:communityId/addNewRule', communityMiddlewares_1.doesCommunityExist, (0, communityMiddlewares_1.havePermissionToPerformAction)(community_1.COMMUNITY_PERMISSION_NAMES.UPDATE_RULES), addNewCommunityRule);
router.patch('/:communityId/updateSingleRule/', communityMiddlewares_1.doesCommunityExist, (0, communityMiddlewares_1.havePermissionToPerformAction)(community_1.COMMUNITY_PERMISSION_NAMES.UPDATE_RULES), updateSingleCommunityRule);
router.put('/:communityId/updateRules', communityMiddlewares_1.doesCommunityExist, (0, communityMiddlewares_1.havePermissionToPerformAction)(community_1.COMMUNITY_PERMISSION_NAMES.UPDATE_RULES), updateCommunityRules);
router.patch('/:communityId/deleteSingleRule/:ruleId', communityMiddlewares_1.doesCommunityExist, (0, communityMiddlewares_1.havePermissionToPerformAction)(community_1.COMMUNITY_PERMISSION_NAMES.UPDATE_RULES), deleteSingleCommunityRule);
router.patch('/:communityId/deleteMultipleRules', communityMiddlewares_1.doesCommunityExist, (0, communityMiddlewares_1.havePermissionToPerformAction)(community_1.COMMUNITY_PERMISSION_NAMES.UPDATE_RULES), deleteMultipleCommunityRules);
router.patch('/:communityId/deleteAllRules', communityMiddlewares_1.doesCommunityExist, (0, communityMiddlewares_1.havePermissionToPerformAction)(community_1.COMMUNITY_PERMISSION_NAMES.UPDATE_RULES), deleteAllCommunityRules);
// community rules --end
// COMMUNUTY CRUD --end
// COMMUNITY MEMBER MANAGEMENT --start
router.patch('/:communityId/banUserFromCommunity', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.checkIfTargetUserExist, communityMiddlewares_1.isTargetUserLoggedInUser, (0, communityMiddlewares_1.havePermissionToPerformAction)(community_1.COMMUNITY_PERMISSION_NAMES.BAN_USERS), communityMiddlewares_1.isTargetUserAlreadyInLists, banUserFromCommunity);
router.patch('/:communityId/undoUserCommunityBan', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.checkIfTargetUserExist, communityMiddlewares_1.isTargetUserLoggedInUser, (0, communityMiddlewares_1.havePermissionToPerformAction)(community_1.COMMUNITY_PERMISSION_NAMES.UNDO_BAN_USERS), communityMiddlewares_1.isTargetUserAlreadyInLists, undoBanUserFromCommunity);
router.patch('/:communityId/inviteToJoinAsMember', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.checkIfTargetUserExist, (0, communityMiddlewares_1.havePermissionToPerformAction)(community_1.COMMUNITY_PERMISSION_NAMES.INVITE_USERS_AS_MEMBERS), communityMiddlewares_1.isTargetUserLoggedInUser, communityMiddlewares_1.isTargetUserAlreadyInLists, inviteUserToJoinAsMember);
router.patch('/:communityId/inviteToJoinAsModerator', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.checkIfTargetUserExist, communityMiddlewares_1.isTargetUserAlreadyInLists, inviteUserToJoinAsModerator);
router.patch('/:communityId/withdrawMemberJoinInvite', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.checkIfTargetUserExist, communityMiddlewares_1.isTargetUserLoggedInUser, communityMiddlewares_1.isTargetUserAlreadyInLists, (0, communityMiddlewares_1.havePermissionToPerformAction)(community_1.COMMUNITY_PERMISSION_NAMES.WITHDRAW_INVITE_USERS_AS_MEMBERS), withdrawCommunityInviteForUser);
router.patch('/:communityId/withdrawModeratorJoinInvite', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.checkIfTargetUserExist, communityMiddlewares_1.isTargetUserLoggedInUser, communityMiddlewares_1.isTargetUserAlreadyInLists, widthrawCommunityModeratorInvite);
router.patch('/:communityId/acceptUserJoinRequest', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.checkIfTargetUserExist, communityMiddlewares_1.isTargetUserLoggedInUser, communityMiddlewares_1.isTargetUserAlreadyInLists, (0, communityMiddlewares_1.havePermissionToPerformAction)(community_1.COMMUNITY_PERMISSION_NAMES.ACCEPT_JOIN_REQUESTS), moderatorAcceptUserJoinRequest);
router.patch('/:communityId/declineUserJoinRequest', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.checkIfTargetUserExist, communityMiddlewares_1.isTargetUserLoggedInUser, communityMiddlewares_1.isTargetUserAlreadyInLists, (0, communityMiddlewares_1.havePermissionToPerformAction)(community_1.COMMUNITY_PERMISSION_NAMES.DECLINE_JOIN_REQUESTS), moderatorDeclineUserJoinRequest);
// COMMUNITY MEMBER MANAGEMENT --end
// COMMUNITY USER ACTIONS --start
router.patch('/:communityId/requestToJoin', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.isRequestUserAlreadyInLists, userRequestCommunityJoin);
router.patch('/:communityId/userWithdrawRequestToJoin', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.isRequestUserAlreadyInLists, userWithdrawRequestToJoinCommunity);
router.patch('/:communityId/userAcceptInviteJoinCommunity/:inviteType', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.isRequestUserAlreadyInLists, userAcceptJoinCommunityInvite);
router.patch('/:communityId/userDeclineInviteJoinCommunity/:inviteType', communityMiddlewares_1.doesCommunityExist, communityMiddlewares_1.isRequestUserAlreadyInLists, userDeclineJoinCommunityInvite);
router.patch('/:communityId/userLeaveCommunity/:communityRole', communityMiddlewares_1.doesCommunityExist, userLeaveCommunity);
// COMMUNITY USER ACTIONS --end
exports.default = router;
