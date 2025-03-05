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
exports.userLeaveCommunity = exports.userDeclineJoinCommunityInvite = exports.userAcceptJoinCommunityInvite = exports.userWithdrawRequestToJoinCommunity = exports.userRequestCommunityJoin = void 0;
const mongoose_1 = require("mongoose");
const catchAsync_1 = __importDefault(require("utils/catchAsync"));
const appError_1 = __importDefault(require("utils/appError"));
const userModel_1 = __importDefault(require("models/userModel"));
const notificationModel_1 = __importDefault(require("models/notificationModel"));
const communitySettingsModel_1 = __importDefault(require("models/settings/communitySettingsModel"));
const communityService_1 = __importDefault(require("services/communityService"));
const community_1 = require("configs/community");
exports.userRequestCommunityJoin = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    const community = req.community;
    if (userId.toString() === community.creator.toString()) {
        next(new appError_1.default(400, 'You cannot join - you are the creator of this community'));
        return;
    }
    const existInLists = req.existInLists;
    if (existInLists.userJoinRequests.exists) {
        next(new appError_1.default(400, 'You have already requested to join this community. Cannot request twice'));
        return;
    }
    const existInAnyLists = Object.keys(existInLists).find((list) => existInLists[list].exists && list !== 'userJoinRequests');
    if (existInAnyLists) {
        next(new appError_1.default(400, `You are alredy registered in ${existInLists[existInAnyLists].alias}, so request cannot be sent.`));
        return;
    }
    community.userJoinRequests.push({ user: new mongoose_1.Types.ObjectId(userId) });
    const communityModeratorPermissions = yield communitySettingsModel_1.default.findOne({ community: community._id }).select('moderators_settings.moderatorPermissions -_id');
    const communityModeratorPermissionsList = communityModeratorPermissions.moderators_settings.moderatorPermissions.value;
    let moderatorsToGetNotified = [];
    /*
      IF global setting have "accept_join_requests" permission, notifications about
      user request to join are sent to all moderators + creator
      ELSE only to moderators that have this permission in their custom field
    */
    if (!communityModeratorPermissionsList.includes(community_1.COMMUNITY_PERMISSION_NAMES.ACCEPT_JOIN_REQUESTS)) {
        moderatorsToGetNotified = community.moderators
            .filter((moderator) => moderator.customPermissions.includes(community_1.COMMUNITY_PERMISSION_NAMES.ACCEPT_JOIN_REQUESTS))
            .map((moderator) => moderator.user);
    }
    else {
        moderatorsToGetNotified = community.moderators.map((moderator) => moderator.user);
    }
    moderatorsToGetNotified.push(community.creator);
    const user = yield userModel_1.default.findById(userId).select('fullName profilePhotoUrl');
    const notificationsToBeSentToModerators = [];
    for (const id of moderatorsToGetNotified) {
        const notification = yield notificationModel_1.default.create({
            receiver: id,
            sender: userId,
            notificationType: 'userRequestedToJoinCommunity',
            text: `<sender>${user.fullName}</sender> sent request to join yout "${community.name}" community.`,
            community: community._id
        });
        notificationsToBeSentToModerators.push(notification);
    }
    yield community.save();
    return res.status(200).json({
        status: 'success',
        message: `You have succesfully sent request to join "${community.name}" community. Moderators have been notified.`,
        communityRequestedId: community._id,
        notificationsToBeSentToModerators
    });
}));
exports.userWithdrawRequestToJoinCommunity = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const existInLists = req.existInLists;
    const community = req.community;
    const userId = req.userId.toString();
    if (!existInLists.userJoinRequests.exists) {
        next(new appError_1.default(400, 'You are not in request list. Maybe moderators have approved or declined your request. Try refreshing the page and check whether you are already member of community'));
        return;
    }
    const existInAnyList = Object.keys(existInLists).find((list) => existInLists[list].exists && list !== 'userJoinRequests');
    if (existInAnyList) {
        next(new appError_1.default(400, `You are already in ${existInLists[existInAnyList].alias}. If you dont want to be, remove yourself`));
        return;
    }
    communityService_1.default.removeUserFromLists(community, ['userJoinRequests'], userId);
    yield community.save();
    // should somehow update / remove notifications sent to moderators
    return res.status(200).json({
        status: 'success',
        message: 'You have succsssfully withdrew request to join community'
    });
}));
exports.userAcceptJoinCommunityInvite = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const existInLists = req.existInLists;
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
    const existInAnyLists = Object.keys(existInLists)
        .find((list) => existInLists[list].exists && list !== 'pendingInvitedUsers' && list !== 'pendingInvitedModerators' && list !== 'members');
    if (existInAnyLists) {
        next(new appError_1.default(400, `You are already in ${existInLists[existInAnyLists].alias}, so cannot accept request`));
        return;
    }
    if (inviteType === 'member') {
        if (!existInLists.pendingInvitedUsers.exists) {
            next(new appError_1.default(400, 'You are not in request list. Maybe moderators have widthrew request. Try refreshing the page.'));
            return;
        }
        communityService_1.default.removeUserFromLists(community, ['pendingInvitedUsers'], userId.toString());
        community.members.push({ user: new mongoose_1.Types.ObjectId(userId) });
    }
    if (inviteType === 'moderator') {
        if (!existInLists.pendingInvitedModerators.exists) {
            next(new appError_1.default(400, 'You are not in request list. Maybe moderators have widthrew request. Try refreshing the page.'));
            return;
        }
        communityService_1.default.removeUserFromLists(community, existInLists.members.exists ? ['pendingInvitedModerators', 'members'] : ['pendingInvitedModerators'], userId.toString());
        community.moderators.push({ user: userId, customPermissions: [] });
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
    if (inviteType === 'member') {
        req.community.moderators.forEach((moderator) => {
            moderatorNotifictaions.push({
                receiver: moderator.user,
                notificationType: inviteType === 'member' ? 'userAcceptedCommunityMemberInvite' : 'userAcceptedCommunityModeratorInvite',
                text: `${user.fullName} has accepted to join as ${inviteType} "${community.name}" community that you manage`,
                community: community._id,
                sender: user._id
            });
        });
    }
    yield community.save();
    const notificationsToSendToCommunityModerators = yield notificationModel_1.default.insertMany(moderatorNotifictaions);
    return res.status(200).json({
        status: 'success',
        message: `Accepted invite to become ${inviteType} of "${community.name}" community`,
        notificationsToSendToCommunityModerators
    });
}));
exports.userDeclineJoinCommunityInvite = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const existInLists = req.existInLists;
    const { inviteType } = req.params;
    const userId = req.userId;
    const community = req.community;
    if (!inviteType || (inviteType && inviteType !== 'member' && inviteType !== 'moderator')) {
        next(new appError_1.default(400, 'User invitation type must be either "member" or "moderator"'));
        return;
    }
    if (community.creator.toString() === userId.toString()) {
        next(new appError_1.default(400, `You are creator of "${community.name}", so if you have invites for it, we have a bug in application :).`));
        return;
    }
    const existInAnyLists = Object.keys(existInLists)
        .find((list) => existInLists[list].exists && list !== 'pendingInvitedUsers' && list !== 'pendingInvitedModerators' && list !== 'members');
    if (existInAnyLists) {
        next(new appError_1.default(400, `You are already in ${existInLists[existInAnyLists].alias}, so cannot accept request`));
        return;
    }
    if (inviteType === 'member') {
        if (!existInLists.pendingInvitedUsers.exists) {
            next(new appError_1.default(400, `There seems to be missing invitation for joining "${community.name}". Maybe admins have already accepted / declined it. Check whether you are already a member`));
            return;
        }
        communityService_1.default.removeUserFromLists(community, ['pendingInvitedUsers'], userId.toString());
    }
    if (inviteType === 'moderator') {
        if (!existInLists.pendingInvitedModerators.exists) {
            next(new appError_1.default(400, `There seems to be missing invitation for joining "${community.name}" as moderator. Maybe admins have already accepted / declined it. Check whether you are already a moderator.`));
            return;
        }
        communityService_1.default.removeUserFromLists(community, ['pendingInvitedModerators'], userId.toString());
    }
    yield community.save();
    return res.status(200).json({
        status: 'success',
        message: `Invitation to join "${community.name}" community as ${inviteType} declined successfully.`
    });
}));
// still needs some checking
exports.userLeaveCommunity = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { communityRole } = req.params;
    if (!communityRole || (communityRole && communityRole !== 'member' && communityRole !== 'moderator')) {
        next(new appError_1.default(400, 'Invalid community role provided: must be either "member" or "moderator"'));
        return;
    }
    const userId = req.userId;
    const community = req.community;
    if (communityRole === 'member') {
        const isMember = community.members.find((user) => user.toString() === userId.toString());
        if (!isMember) {
            next(new appError_1.default(400, `You seem not to be member of "${community.name}" community. Maybe you have been kicked out already. Try refreshing the page.`));
            return;
        }
        communityService_1.default.removeUserFromLists(community, ['members'], req.userId.toString());
    }
    if (communityRole === 'moderator') {
        const isModerator = community.moderators.find((moderator) => moderator.user.toString() === userId.toString());
        if (!isModerator) {
            next(new appError_1.default(400, `You seem not to be moderator of "${community.name}" community. Maybe you have been kicked out already. Try refreshing the page.`));
            return;
        }
        community.moderators = community.moderators.filter((moderator) => moderator.user.toString() !== userId.toString());
    }
    // remove user from community chats
    yield communityService_1.default.removeUserFromAllCommunityChats(community._id.toString(), community.availableChats.length, userId, 'Failed to remove you from communit chats');
    yield community.save();
    return res.status(200).json({
        status: 'success',
        message: `You have left "${community.name}" community`
    });
}));
