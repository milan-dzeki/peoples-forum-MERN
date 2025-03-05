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
const appError_1 = __importDefault(require("utils/appError"));
const notificationModel_1 = __importDefault(require("models/notificationModel"));
exports.banUserFromCommunity = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const existInLists = req.existInLists;
    if (existInLists.bannedUsers.exists) {
        next(new appError_1.default(400, 'User is already banned from this community'));
        return;
    }
    const community = req.community;
    const isCreator = req.isCreator;
    const { targetUserId, shouldNotifyUser = false } = req.body;
    const targetUserIdString = targetUserId.toString();
    const existInAnyList = Object.keys(existInLists).some((list) => existInLists[list].exists);
    if (!existInAnyList) {
        next(new appError_1.default(400, 'User you are trying to ban is not a member of community, nor is he / she in pending lists. Maybe he / she already left'));
        return;
    }
    if (existInLists.moderators.exists) {
        if (!isCreator) {
            next(new appError_1.default(400, 'User you are trying to ban is moderator. Only creator can ban moderators'));
            return;
        }
        communityService_1.default.removeUserFromLists(community, ['moderators'], targetUserIdString);
    }
    if (existInLists.pendingInvitedModerators.exists) {
        if (!isCreator) {
            next(new appError_1.default(400, 'User you are trying to ban is invited to be moderator. Only creator can ban moderators invitations'));
            return;
        }
        communityService_1.default.removeUserFromLists(community, ['pendingInvitedModerators'], targetUserIdString);
    }
    // remove from all lists except moderator lists
    communityService_1.default.removeUserFromLists(community, ['joinedUsers', 'pendingInvitedUsers', 'userJoinRequests', 'bannedUsers'], targetUserIdString);
    // add to banned list
    community.bannedUsers.push(new mongoose_1.Types.ObjectId(targetUserIdString));
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
    yield community.save();
    return res.status(200).json(responseData);
}));
exports.undoBanUserFromCommunity = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const existInLists = req.existInLists;
    if (!existInLists.bannedUsers.exists) {
        next(new appError_1.default(400, 'User you are trying to un-ban is not in banned users list. You cannot un-ban user that is not banned'));
        return;
    }
    const isInOtherLists = Object.keys(existInLists).find((list) => existInLists[list].exists && list !== 'bannedUsers');
    if (isInOtherLists) {
        next(new appError_1.default(400, `User you are trying to un-ban is member of ${existInLists[isInOtherLists].alias}. If this was not intended, remove user from this list`));
        return;
    }
    const { targetUserId, shouldNotifyUser = false } = req.body;
    const targetUserIdString = targetUserId.toString();
    const community = req.community;
    communityService_1.default.removeUserFromLists(community, ['bannedUsers'], targetUserIdString);
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
    yield community.save();
    return res.status(200).json(responseData);
}));
exports.inviteUserToJoinAsMember = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const existInLists = req.existInLists;
    const existInAnyLists = Object.keys(existInLists).find((list) => existInLists[list].exists);
    if (existInAnyLists) {
        next(new appError_1.default(400, `Invitation failed. User already found in ${existInLists[existInAnyLists].alias}.`));
        return;
    }
    const { targetUserId } = req.body;
    const targetUserIdString = targetUserId.toString();
    const community = req.community;
    community.pendingInvitedUsers.push(new mongoose_1.Types.ObjectId(targetUserIdString));
    const inviteUserNotification = yield communityService_1.default.createInviteUserNotification(targetUserIdString, req.userId, community._id.toString(), community.name, 'becomeCommunityMemberRequest');
    yield community.save();
    return res.status(200).json({
        status: 'success',
        message: 'User successfully invited to join',
        targetUserId,
        inviteUserNotification
    });
}));
exports.inviteUserToJoinAsModerator = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const community = req.community;
    const isCreator = community.creator.toString() === req.userId.toString();
    if (!isCreator) {
        next(new appError_1.default(401, 'Only community creator can invite users to join as moderators'));
        return;
    }
    const existInLists = req.existInLists;
    // joinedUsers is not checked because creator can invite them to become moderators
    const existInAnyListsExcetJoinedUsers = Object.keys(existInLists).find((list) => existInLists[list].exists && list !== 'joinedUsers');
    if (existInAnyListsExcetJoinedUsers) {
        next(new appError_1.default(400, `Invitation failed. User already found in ${existInLists[existInAnyListsExcetJoinedUsers].alias}.`));
        return;
    }
    const { targetUserId } = req.body;
    // NOTE: if user is already in JoinedUsers, now he will be in 2 lists
    // becuase he can decline moderator role and stay member
    // This need to be handled in user accept invite
    community.pendingInvitedModerators.push(targetUserId);
    const inviteUserNotification = yield communityService_1.default.createInviteUserNotification(targetUserId, req.userId, community._id.toString(), community.name, 'becomeCommunityModeratorRequest');
    yield community.save();
    return res.status(200).json({
        status: 'success',
        message: 'User successfully invited to join as moderator',
        targetUserId,
        inviteUserNotification
    });
}));
exports.withdrawCommunityInviteForUser = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const existInLists = req.existInLists;
    if (!existInLists.pendingInvitedUsers.exists) {
        next(new appError_1.default(400, 'User in not found in pending invite list. Maybe he / she has declined request in the meantime'));
        return;
    }
    const existInAnyLists = Object.keys(existInLists).find((list) => existInLists[list].exists && list !== 'pendingInvitedUsers');
    if (existInAnyLists) {
        next(new appError_1.default(400, `User also exists in ${existInLists[existInAnyLists]}. If this was not indented, remove user from that list before proceeding.`));
        return;
    }
    const { targetUserId } = req.body;
    const targetUserIdString = targetUserId.toString();
    const community = req.community;
    communityService_1.default.removeUserFromLists(community, ['pendingInvitedUsers'], targetUserIdString);
    yield community.save();
    return res.status(200).json({
        status: 'success',
        message: 'You have successfully withdrew invite for user',
        userToWithdrawInviteId: targetUserIdString
    });
}));
exports.widthrawCommunityModeratorInvite = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const community = req.community;
    const isCreator = community.creator.toString() === req.userId.toString();
    const existInLists = req.existInLists;
    if (!isCreator) {
        next(new appError_1.default(401, 'Only community creator can withdraw moderator invitation'));
        return;
    }
    const { targetUserId } = req.body;
    const targetUserIdString = targetUserId.toString();
    if (!existInLists.pendingInvitedModerators.exists) {
        next(new appError_1.default(404, 'User not found in moderator invitation list. Maybe it has declined request. Try refreshing the page'));
        return;
    }
    // user can be regular member while being invited as moderator
    const existInAnyLists = Object.keys(existInLists)
        .find((list) => existInLists[list].exists && list !== 'pendingInvitedModerators' && list !== 'joinedUsers');
    if (existInAnyLists) {
        next(new appError_1.default(400, `User also exists in ${existInLists[existInAnyLists]}. If this was not indented, remove user from that list before proceeding.`));
        return;
    }
    communityService_1.default.removeUserFromLists(community, ['pendingInvitedModerators'], targetUserIdString);
    yield community.save();
    return res.status(200).json({
        status: 'success',
        message: 'Moderator invitation withdrew successfully',
        withdrewUserInviteId: targetUserId
    });
}));
exports.moderatorAcceptUserJoinRequest = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const existInLists = req.existInLists;
    if (!existInLists.userJoinRequests.exists) {
        next(new appError_1.default(400, 'User is not in request list. Maybe it has withdrew request'));
        return;
    }
    const existInAnyLists = Object.keys(existInLists).find((list) => existInLists[list].exists && list !== 'userJoinRequests');
    if (existInAnyLists) {
        next(new appError_1.default(400, `User also exists in ${existInLists[existInAnyLists]}. If this was not indented, remove user from that list before proceeding.`));
        return;
    }
    const { targetUserId } = req.body;
    const targetUserIdString = targetUserId.toString();
    const community = req.community;
    communityService_1.default.removeUserFromLists(community, ['userJoinRequests'], targetUserIdString);
    community.joinedUsers.push(new mongoose_1.Types.ObjectId(targetUserIdString));
    const userNotification = yield notificationModel_1.default.create({
        receiver: targetUserId,
        community: community._id,
        text: `Your request to join "${community.name}" community has been approved. You are not a member`,
        notificationType: 'requestToJoinCommunityAccepted'
    });
    yield community.save();
    return res.status(200).json({
        status: 'success',
        message: 'User join request approved successfully',
        joinedUserId: targetUserId,
        userNotification
    });
}));
exports.moderatorDeclineUserJoinRequest = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const existInLists = req.existInLists;
    if (!existInLists.userJoinRequests.exists) {
        next(new appError_1.default(400, 'User is not in request list. Maybe it has withdrew request'));
        return;
    }
    const existInAnyLists = Object.keys(existInLists).find((list) => existInLists[list].exists && list !== 'userJoinRequests');
    if (existInAnyLists) {
        next(new appError_1.default(400, `User also exists in ${existInLists[existInAnyLists]}. If this was not indented, remove user from that list before proceeding.`));
        return;
    }
    const community = req.community;
    const { targetUserId } = req.body;
    const targetUserIdString = targetUserId.toString();
    communityService_1.default.removeUserFromLists(community, ['userJoinRequests'], targetUserIdString);
    const userNotification = yield notificationModel_1.default.create({
        receiver: targetUserId,
        community: community._id,
        text: `Your request to join "${community.name}" community has been declined.`,
        notificationType: 'requestToJoinCommunityDeclined'
    });
    yield community.save();
    return res.status(200).json({
        status: 'success',
        message: 'User join request approved successfully',
        declinedUser: targetUserId,
        userNotification
    });
}));
