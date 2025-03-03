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
exports.userLeaveCommunity = exports.userDeclineJoinCommunityInvite = exports.userAcceptJoinCommunityInvite = exports.moderatorWithdrawJoinCommunityInviteForUser = exports.inviteUserToJoinCommunity = exports.undoBanUserFromCommunity = exports.banUserFromCommunity = void 0;
const communityService_1 = __importDefault(require("services/communityService"));
const catchAsync_1 = __importDefault(require("utils/catchAsync"));
const appError_1 = __importDefault(require("utils/appError"));
const userModel_1 = __importDefault(require("models/userModel"));
const notificationModel_1 = __importDefault(require("models/notificationModel"));
exports.banUserFromCommunity = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { targetUserId, shouldNotifyUser = false } = req.body;
    // if id is same as logged in user id - almost impossible, but why not check
    if (targetUserId.toString() === req.userId.toString()) {
        next(new appError_1.default(400, 'You cannot ban yourself'));
        return;
    }
    const community = req.community;
    const userAlreadyBanned = community.bannedUsers.find((bannerUser) => bannerUser.toString() === targetUserId.toString());
    if (userAlreadyBanned) {
        next(new appError_1.default(400, 'You have already banned this user - can not be done twice'));
        return;
    }
    const isUserMember = community.joinedUsers.find((joined) => joined.toString() === targetUserId.toString());
    const isUserInPendingMemberList = community.pendingInvitedUsers.find((pending) => pending.toString() === targetUserId.toString());
    const isUserInPendingModeratorList = community.pendingInvitedModerators.find((pending) => pending.toString() === targetUserId.toString());
    const isUserToBanModerator = community.moderators.find((moderator) => moderator.toString() === targetUserId.toString());
    if (!isUserMember && !isUserInPendingMemberList && !isUserInPendingModeratorList && !isUserToBanModerator) {
        next(new appError_1.default(400, 'User you are trying to ban is not a member of community, nor is he / she in pending lists. Maybe he / she already left'));
        return;
    }
    const isBannerCommunityCreator = community.creator.toString() === req.userId.toString();
    if (isUserToBanModerator) {
        if (!isBannerCommunityCreator) {
            next(new appError_1.default(400, 'You are trying to ban moderator of this community. Only creator can ban moderators'));
            return;
        }
        community.moderators = community.moderators.filter((user) => user.toString() !== targetUserId.toString());
    }
    if (isUserMember) {
        community.joinedUsers = community.joinedUsers.filter((user) => user.toString() !== targetUserId.toString());
    }
    if (isUserInPendingMemberList) {
        community.pendingInvitedUsers = community.pendingInvitedUsers.filter((user) => user.toString() !== targetUserId.toString());
    }
    if (isUserInPendingModeratorList) {
        community.pendingInvitedModerators = community.pendingInvitedModerators.filter((user) => user.toString() !== targetUserId.toString());
    }
    community.bannedUsers.push(targetUserId);
    // remove user from community chats
    yield communityService_1.default.removeUserFromAllCommunityChats(community._id, community.availableChats.length, targetUserId, 'Failed to remove banned user from chats');
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
    const { targetUserId, shouldNotifyUser = false, inviteUserToJoinOrModerate = null } = req.body;
    const community = req.community;
    const userInBannedList = community.bannedUsers.find((user) => user.toString() === targetUserId.toString());
    if (!userInBannedList) {
        next(new appError_1.default(400, 'User you are trying to un-ban is not in banned users list. You cannot un-ban user that is not banned'));
        return;
    }
    community.bannedUsers = community.bannedUsers.filter((user) => user.toString() !== targetUserId.toString());
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
        responseData.userRemovedBanNotifications = [userRemovedBanNotifications];
    }
    if (inviteUserToJoinOrModerate &&
        (inviteUserToJoinOrModerate === 'member' || inviteUserToJoinOrModerate === 'moderator')) {
        const notificationData = {
            receiver: targetUserId,
            notificationType: inviteUserToJoinOrModerate === 'member' ? 'becomeCommunityMemberRequest' : 'becomeCommunityModeratorRequest',
            text: `You have been invited to become ${inviteUserToJoinOrModerate} in "${community.name}" community.`,
            community: community._id
        };
        if (inviteUserToJoinOrModerate === 'member') {
            community.pendingInvitedUsers.push(targetUserId);
        }
        if (inviteUserToJoinOrModerate === 'moderator') {
            community.pendingInvitedModerators.push(targetUserId);
        }
        const inviteNotification = yield notificationModel_1.default.create(notificationData);
        if (responseData.userRemovedBanNotifications) {
            responseData.userRemovedBanNotifications.push(inviteNotification);
        }
        else {
            responseData.userRemovedBanNotifications = [inviteNotification];
        }
    }
    yield community.save();
    return res.status(200).json(responseData);
}));
exports.inviteUserToJoinCommunity = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { targetUserId, inviteType } = req.body;
    if (!inviteType || (inviteType && inviteType !== 'member' && inviteType !== 'moderator')) {
        next(new appError_1.default(400, 'User invitation type must be either "member" or "moderator"'));
        return;
    }
    const community = req.community;
    const userBanned = community.bannedUsers.find((user) => user.toString() === targetUserId.toString());
    if (userBanned) {
        next(new appError_1.default(400, `You are trying to invite BANNED user to join as ${inviteType}. Remove ban first and then proceed.`));
        return;
    }
    const userAlreadyInvitedAsMember = community.pendingInvitedUsers.find((user) => user.toString() === targetUserId.toString());
    const userAlreadyInvitedAsModerator = community.pendingInvitedModerators.find((user) => user.toString() === targetUserId.toString());
    if (userAlreadyInvitedAsMember) {
        next(new appError_1.default(400, 'You have already invitied this user to join as member. Only 1 invitation is allowed per user.'));
        return;
    }
    if (userAlreadyInvitedAsModerator) {
        next(new appError_1.default(400, 'You have already invitied this user to join as moderator. Only 1 invitation is allowed per user.'));
        return;
    }
    const userAlreadyMember = community.joinedUsers.find((user) => user.toString() === targetUserId.toString());
    const userAlreadyModerator = community.moderators.find((user) => user.toString() === targetUserId.toString());
    if (inviteType === 'member' && userAlreadyMember) {
        next(new appError_1.default(400, 'This user is already a member of this community.'));
        return;
    }
    if (userAlreadyModerator) {
        next(new appError_1.default(400, 'This user is already a moderator of this community.'));
        return;
    }
    let responseDataMessage = '';
    // if user is member he can be invited as moderator
    if (inviteType === 'moderator') {
        community.pendingInvitedModerators.push(targetUserId);
        if (userAlreadyMember) {
            responseDataMessage = 'You have invited joined member to become moderator of this community successfully';
        }
        else {
            responseDataMessage = 'You have invited user to become moderator of this community successfully';
        }
    }
    else if (inviteType === 'member') {
        responseDataMessage = 'You have invited user join this community successfully';
        community.pendingInvitedUsers.push(targetUserId);
    }
    const inviteUserNotification = yield notificationModel_1.default.create({
        receiver: targetUserId,
        notificationType: inviteType === 'moderator' ? 'becomeCommunityModeratorRequest' : 'becomeCommunityMemberRequest',
        text: `You have been invited to become ${inviteType} of "${community.name}"${userAlreadyMember ? ' community where you are already a member.' : '.'}`,
        community: community._id
    });
    yield community.save();
    return res.status(200).json({
        status: 'success',
        message: responseDataMessage,
        targetUserId,
        inviteUserNotification
    });
}));
exports.moderatorWithdrawJoinCommunityInviteForUser = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { targetUserid, inviteType } = req.body;
    if (!inviteType || (inviteType && inviteType !== 'member' && inviteType !== 'moderator')) {
        next(new appError_1.default(400, 'User widthraw invitation type must be either "member" or "moderator"'));
        return;
    }
    const community = req.community;
    if (inviteType === 'member') {
        const isUserInPendingMembersList = community.pendingInvitedUsers.find((user) => user.toString() === targetUserid.toString());
        if (!isUserInPendingMembersList) {
            next(new appError_1.default(400, 'User in not found in pending invite list. Maybe he / she has declined request in the meantime'));
            return;
        }
        community.pendingInvitedUsers = community.pendingInvitedUsers.filter((user) => user.toString() !== targetUserid.toString());
    }
    if (inviteType === 'moderator') {
        const isUserInPendingModeratorsList = community.pendingInvitedModerators.find((user) => user.toString() === targetUserid.toString());
        if (!isUserInPendingModeratorsList) {
            next(new appError_1.default(400, 'User in not found in pending invite moderator list. Maybe he / she has declined request in the meantime'));
            return;
        }
        community.pendingInvitedModerators = community.pendingInvitedModerators.filter((user) => user.toString() !== targetUserid.toString());
    }
    yield community.save();
    return res.status(200).json({
        status: 'success',
        message: `You have successfully withdrew ${inviteType} invite for user`,
        userToWithdrawInviteId: targetUserid
    });
}));
exports.userAcceptJoinCommunityInvite = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { inviteType } = req.params;
    if (!inviteType || (inviteType && inviteType !== 'member' && inviteType !== 'moderator')) {
        next(new appError_1.default(400, 'User invitation type must be either "member" or "moderator"'));
        return;
    }
    const userId = req.userId;
    const community = req.community;
    if (community.creator.toString() === userId.toString()) {
        next(new appError_1.default(400, `You are creator of "${community.name}", so if you have invites for it, we have a bug in application :).`));
        return;
    }
    const isAlreadyMember = community.joinedUsers.find((user) => user.toString() === userId.toString());
    if (inviteType === 'member' && isAlreadyMember) {
        next(new appError_1.default(400, `You are already a member of "${community.name}". Try refreshing the page`));
        return;
    }
    const isAlreadyModerator = community.moderators.find((user) => user.toString() === userId.toString());
    if (isAlreadyModerator) {
        next(new appError_1.default(400, `You are already a moderator of "${community.name}". Try refreshing the page`));
        return;
    }
    const isInPendingMemberList = community.pendingInvitedUsers.find((user) => user.toString() === userId.toString());
    if (inviteType === 'member' && !isInPendingMemberList) {
        next(new appError_1.default(400, `There seems to be missing invitation for joining "${community.name}" as member. Maybe admins have withdrew it.`));
        return;
    }
    const isInPendingModeratorList = community.pendingInvitedModerators.find((user) => user.toString() === userId.toString());
    if (inviteType === 'moderator' && !isInPendingModeratorList) {
        next(new appError_1.default(400, `There seems to be missing invitation for joining "${community.name}" as moderator. Maybe admins have withdrew it.`));
        return;
    }
    if (inviteType === 'member' && isInPendingMemberList) {
        community.pendingInvitedUsers = community.pendingInvitedUsers.filter((user) => user.toString() !== userId.toString());
        community.joinedUsers.push(userId);
    }
    if (inviteType === 'moderator' && isInPendingModeratorList) {
        community.pendingInvitedModerators = community.pendingInvitedModerators.filter((user) => user.toString() !== userId.toString());
        community.moderators.push(userId);
        // if user was regular member before
        if (isAlreadyMember) {
            community.joinedUsers = community.joinedUsers.filter((user) => user.toString() !== userId.toString());
        }
    }
    const user = yield userModel_1.default.findById(userId).select('_id fullName');
    const moderatorNotifictaions = [
        {
            receiver: community.creator,
            notificationType: inviteType === 'member' ? 'userAcceptedCommunityMemberInvite' : 'userAcceptedCommunityModeratorInvite',
            text: `${user.fullName} has accepted to join as ${inviteType} "${community.name}" community that you manage`,
            community: community._id,
            sender: user._id
        }
    ];
    req.community.moderators.forEach((moderator) => {
        moderatorNotifictaions.push({
            receiver: moderator,
            notificationType: inviteType === 'member' ? 'userAcceptedCommunityMemberInvite' : 'userAcceptedCommunityModeratorInvite',
            text: `${user.fullName} has accepted to join as ${inviteType} "${community.name}" community that you manage`,
            community: community._id,
            sender: user._id
        });
    });
    yield community.save();
    const notificationsToSendToCommunityModerators = yield notificationModel_1.default.insertMany(moderatorNotifictaions);
    return res.status(200).json({
        status: 'success',
        message: `Accepted invite to become ${inviteType} of "${community.name}" community`,
        notificationsToSendToCommunityModerators
    });
}));
exports.userDeclineJoinCommunityInvite = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { inviteType } = req.params;
    if (!inviteType || (inviteType && inviteType !== 'member' && inviteType !== 'moderator')) {
        next(new appError_1.default(400, 'User invitation type must be either "member" or "moderator"'));
        return;
    }
    const userId = req.userId;
    const community = req.community;
    const isInPendingMemberList = community.pendingInvitedUsers.find((user) => user.toString() === userId.toString());
    if (inviteType === 'member' && !isInPendingMemberList) {
        next(new appError_1.default(400, `There seems to be missing invitation for joining "${community.name}". Maybe admins have withdrew it.`));
        return;
    }
    const isInPendingModeratorList = community.pendingInvitedModerators.find((user) => user.toString() === userId.toString());
    if (inviteType === 'moderator' && !isInPendingModeratorList) {
        next(new appError_1.default(400, `There seems to be missing invitation for joining "${community.name}" as moderator. Maybe admins have withdrew it.`));
        return;
    }
    if (inviteType === 'member') {
        community.pendingInvitedUsers = community.pendingInvitedUsers.filter((user) => user.toString() !== userId.toString());
    }
    if (inviteType === 'moderator') {
        community.pendingInvitedModerators = community.pendingInvitedModerators.filter((user) => user.toString() !== userId.toString());
    }
    yield community.save();
    return res.status(200).json({
        status: 'success',
        message: `Invitation to join "${community.name}" community as ${inviteType} declined successfully.`
    });
}));
exports.userLeaveCommunity = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { communityRole } = req.params;
    if (!communityRole || (communityRole && communityRole !== 'member' && communityRole !== 'moderator')) {
        next(new appError_1.default(400, 'Invalid community role provided: must be either "member" or "moderator"'));
        return;
    }
    const userId = req.userId;
    const community = req.community;
    if (communityRole === 'member') {
        const isMember = community.joinedUsers.find((user) => user.toString() === userId.toString());
        if (!isMember) {
            next(new appError_1.default(400, `You seem not to be member of "${community.name}" community. Maybe you have been kicked out already. Try refreshing the page.`));
            return;
        }
        community.joinedUsers = community.joinedUsers.filter((user) => user.toString() !== userId.toString());
    }
    if (communityRole === 'moderator') {
        const isModerator = community.moderators.find((user) => user.toString() === userId.toString());
        if (!isModerator) {
            next(new appError_1.default(400, `You seem not to be moderator of "${community.name}" community. Maybe you have been kicked out already. Try refreshing the page.`));
            return;
        }
        community.moderators = community.moderators.filter((user) => user.toString() !== userId.toString());
    }
    // remove user from community chats
    yield communityService_1.default.removeUserFromAllCommunityChats(community._id, community.availableChats.length, userId, 'Failed to remove you from communit chats');
    yield community.save();
    return res.status(200).json({
        status: 'success',
        message: `You have left "${community.name}" community`
    });
}));
