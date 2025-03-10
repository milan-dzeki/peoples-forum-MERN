"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.moderatorDeclineUserJoinRequest = exports.moderatorAcceptUserJoinRequest = exports.widthrawCommunityModeratorInvite = exports.withdrawCommunityInviteForUser = exports.inviteUserToJoinAsModerator = exports.inviteUserToJoinAsMember = exports.undoBanUserFromCommunity = exports.banUserFromCommunity = void 0;
const mongoose_1 = require("mongoose");
const communityService_1 = __importDefault(require("services/communityService"));
const catchAsync_1 = __importDefault(require("utils/catchAsync"));
const notificationModel_1 = __importDefault(require("models/notificationModel"));
const communityUserManagerBuilder_1 = __importDefault(require("utils/builders/community/communityUserManagerBuilder"));
exports.banUserFromCommunity = (0, catchAsync_1.default)((req, res, _) => __awaiter(void 0, void 0, void 0, function* () {
    const existInLists = req.existInLists;
    const community = req.community;
    const isCreator = req.isCreator;
    const { targetUserId, shouldNotifyUser = false } = req.body;
    const targetUserIdString = targetUserId.toString();
    const manageAction = new communityUserManagerBuilder_1.default(community, targetUserIdString, req.userId, existInLists);
    yield manageAction
        .throwErrorIfNotInAnyList('User you are trying to ban is not a member of community, nor is he / she in pending lists. Maybe he / she already left')
        .throwErrorIfCreatorActionTriedByNonCreator(existInLists.moderators.exists && !isCreator, 'User you are trying to ban is moderator. Only creator can ban moderators')
        .throwErrorIfCreatorActionTriedByNonCreator(existInLists.pendingInvitedModerators.exists && !isCreator, 'User you are trying to ban is invited to be moderator. Only creator can ban moderators invitations')
        .removeUserFromLists(['members', 'pendingInvitedUsers', 'userJoinRequests', 'bannedUsers', 'pendingInvitedModerators', 'moderators'])
        .addUserToList('bannedUsers', { bannedBy: new mongoose_1.Types.ObjectId(req.userId) })
        .saveCommunity();
    // remove user from community chats
    yield communityService_1.default.removeUserFromAllCommunityChats(community._id.toString(), community.availableChats.length, targetUserIdString, 'Failed to remove banned user from chats');
    const responseData = {
        status: 'success',
        message: 'You have successfully banned user from community',
        bannedUserId: targetUserId
    };
    if (shouldNotifyUser) {
        const bannedUserNotification = yield notificationModel_1.default.create({
            receiver: targetUserId,
            notificationType: 'bannedFromCommunity',
            text: `You have been banned from community: "${community.name}". You can no longer see this comuunity posts and chats unless admins remove ban`
        });
        responseData.bannedUserNotification = bannedUserNotification;
    }
    return res.status(200).json(responseData);
}));
exports.undoBanUserFromCommunity = (0, catchAsync_1.default)((req, res, _) => __awaiter(void 0, void 0, void 0, function* () {
    const { targetUserId, shouldNotifyUser = false } = req.body;
    const targetUserIdString = targetUserId.toString();
    const community = req.community;
    const existInLists = req.existInLists;
    const manageAction = new communityUserManagerBuilder_1.default(community, targetUserIdString, req.userId, existInLists);
    yield manageAction
        .throwErrorIfInAnyListExcept(['bannedUsers'])
        .throwErrorIfUserNotInList('bannedUsers', 'User you are trying to un-ban is not in banned users list. You cannot un-ban user that is not banned')
        .removeUserFromLists(['bannedUsers'])
        .saveCommunity();
    const responseData = {
        status: 'success',
        message: 'You have successfully removed ban for user',
        userRemovedBanId: targetUserId
    };
    if (shouldNotifyUser) {
        const userRemovedBanNotifications = yield notificationModel_1.default.create({
            receiver: targetUserId,
            notificationType: 'removeCommunityBan',
            text: `Your ban from community: "${community.name}" has been removed. You can see this communities posts and chats now.`,
            community: community._id
        });
        responseData.userRemovedBanNotifications = userRemovedBanNotifications;
    }
    return res.status(200).json(responseData);
}));
exports.inviteUserToJoinAsMember = (0, catchAsync_1.default)((req, res, _) => __awaiter(void 0, void 0, void 0, function* () {
    const existInLists = req.existInLists;
    const { targetUserId } = req.body;
    const targetUserIdString = targetUserId.toString();
    const community = req.community;
    const manageAction = new communityUserManagerBuilder_1.default(community, targetUserIdString, req.userId, existInLists);
    yield manageAction
        .throwErrorIfInAnyListExcept([])
        .addUserToList('pendingInvitedUsers', { invitedBy: new mongoose_1.Types.ObjectId(req.userId) })
        .saveCommunity();
    const inviteUserNotification = yield communityService_1.default.createInviteUserNotification(targetUserIdString, req.userId, community._id.toString(), community.name, 'becomeCommunityMemberRequest');
    return res.status(200).json({
        status: 'success',
        message: 'User successfully invited to join',
        targetUserId,
        inviteUserNotification
    });
}));
exports.inviteUserToJoinAsModerator = (0, catchAsync_1.default)((req, res, _) => __awaiter(void 0, void 0, void 0, function* () {
    const community = req.community;
    const { targetUserId } = req.body;
    const targetUserIdString = targetUserId.toString();
    const existInLists = req.existInLists;
    const manageAction = new communityUserManagerBuilder_1.default(community, targetUserIdString, req.userId, existInLists);
    yield manageAction
        .throwErrorIfInAnyListExcept(['members'])
        .addUserToList('pendingInvitedModerators', { invitedBy: new mongoose_1.Types.ObjectId(req.userId) })
        .saveCommunity();
    const inviteUserNotification = yield communityService_1.default.createInviteUserNotification(targetUserIdString, req.userId, community._id.toString(), community.name, 'becomeCommunityModeratorRequest');
    // await community.save();
    return res.status(200).json({
        status: 'success',
        message: 'User successfully invited to join as moderator',
        targetUserId,
        inviteUserNotification
    });
}));
exports.withdrawCommunityInviteForUser = (0, catchAsync_1.default)((req, res, _) => __awaiter(void 0, void 0, void 0, function* () {
    const existInLists = req.existInLists;
    const { targetUserId } = req.body;
    const targetUserIdString = targetUserId.toString();
    const community = req.community;
    const manageAction = new communityUserManagerBuilder_1.default(community, targetUserIdString, req.userId, existInLists);
    yield manageAction
        .throwErrorIfInAnyListExcept(['pendingInvitedUsers'])
        .throwErrorIfUserNotInList('pendingInvitedUsers', 'User is not in pending list. Maybe request was withdrew or declined before')
        .removeUserFromLists(['pendingInvitedUsers'])
        .saveCommunity();
    return res.status(200).json({
        status: 'success',
        message: 'You have successfully withdrew invite for user',
        userToWithdrawInviteId: targetUserIdString
    });
}));
// doesnt need internal check if user is creator (only creators can deal with moderators)
// because is done in permission middleware
exports.widthrawCommunityModeratorInvite = (0, catchAsync_1.default)((req, res, _) => __awaiter(void 0, void 0, void 0, function* () {
    const community = req.community;
    const existInLists = req.existInLists;
    const { targetUserId } = req.body;
    const targetUserIdString = targetUserId.toString();
    const manageAction = new communityUserManagerBuilder_1.default(community, targetUserIdString, req.userId, existInLists);
    yield manageAction
        .throwErrorIfUserNotInList('pendingInvitedModerators', 'User not found in moderator invitation list. Maybe it has declined request. Try refreshing the page')
        .throwErrorIfInAnyListExcept(['members', 'pendingInvitedModerators'])
        .removeUserFromLists(['pendingInvitedModerators'])
        .saveCommunity();
    return res.status(200).json({
        status: 'success',
        message: 'Moderator invitation withdrew successfully',
        withdrewUserInviteId: targetUserId
    });
}));
exports.moderatorAcceptUserJoinRequest = (0, catchAsync_1.default)((req, res, _) => __awaiter(void 0, void 0, void 0, function* () {
    const existInLists = req.existInLists;
    const { targetUserId } = req.body;
    const targetUserIdString = targetUserId.toString();
    const community = req.community;
    const manageAction = new communityUserManagerBuilder_1.default(community, targetUserIdString, req.userId, existInLists);
    yield manageAction
        .throwErrorIfInAnyListExcept(['userJoinRequests'])
        .throwErrorIfUserNotInList('userJoinRequests', 'User is not in request list. Maybe request was removed before')
        .removeUserFromLists(['userJoinRequests'])
        .addUserToList('members')
        .saveCommunity();
    const userNotification = yield notificationModel_1.default.create({
        receiver: targetUserId,
        community: community._id,
        text: `Your request to join "${community.name}" community has been approved. You are not a member`,
        notificationType: 'requestToJoinCommunityAccepted'
    });
    return res.status(200).json({
        status: 'success',
        message: 'User join request approved successfully',
        joinedUserId: targetUserId,
        userNotification
    });
}));
exports.moderatorDeclineUserJoinRequest = (0, catchAsync_1.default)((req, res, _) => __awaiter(void 0, void 0, void 0, function* () {
    const existInLists = req.existInLists;
    const community = req.community;
    const { targetUserId } = req.body;
    const targetUserIdString = targetUserId.toString();
    const manageAction = new communityUserManagerBuilder_1.default(community, targetUserIdString, req.userId, existInLists);
    yield manageAction
        .throwErrorIfUserNotInList('userJoinRequests', 'User is not in request list. Maybe it has withdrew request')
        .throwErrorIfInAnyListExcept(['userJoinRequests'])
        .removeUserFromLists(['userJoinRequests'])
        .saveCommunity();
    const userNotification = yield notificationModel_1.default.create({
        receiver: targetUserId,
        community: community._id,
        text: `Your request to join "${community.name}" community has been declined.`,
        notificationType: 'requestToJoinCommunityDeclined'
    });
    yield community.save();
    return res.status(200).json({
        status: 'success',
        message: 'User join request declined successfully',
        declinedUser: targetUserId,
        userNotification
    });
}));
