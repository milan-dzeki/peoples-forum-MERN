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
const catchAsync_1 = __importDefault(require("utils/catchAsync"));
const communityUserManagerBuilder_1 = __importDefault(require("utils/builders/community/communityUserManagerBuilder"));
const notifications_1 = require("configs/notifications");
const handleSendModeratorRequestResponseAction_1 = __importDefault(require("utils/builders/community/handleSendModeratorRequestResponseAction"));
const communityActivityLogs_1 = require("configs/community/communityActivityLogs");
const communityModeratorChangeRequests_1 = require("configs/community/communityModeratorChangeRequests");
exports.banUserFromCommunity = (0, catchAsync_1.default)((req, res, _) => __awaiter(void 0, void 0, void 0, function* () {
    const existInLists = req.existInLists;
    const settings = req.communitySettings;
    const community = req.community;
    const isCreator = req.isCreator;
    const { targetUserId, shouldNotifyUser = false } = req.body;
    const targetUserIdString = targetUserId.toString();
    if (!isCreator && settings.moderators_settings.changesByModeratorRequireApproval.value) {
        const prepareModeratorResponse = new handleSendModeratorRequestResponseAction_1.default()
            .setCommons({ communityId: community._id, moderator: req.userId })
            .setModeratorRequestData({
            requestType: communityModeratorChangeRequests_1.COMMUNITY_MODERATOR_REQUEST_TYPES.BAN_USER,
            communityCreator: community.creator,
            requestText: `*moderator* (moderator) requested to ban *user* from "${community.name}" commnuity`,
            forUser: targetUserIdString
        })
            .setCommunityActivityLogData({
            logType: communityActivityLogs_1.COMMUNITY_LOG_TYPE.MODERATOR_MADE_REQUESTS,
            text: '*moderator* (moderator) made request to ban *user*',
            user: targetUserIdString
        })
            .setResJson({
            res,
            message: 'Your request to ban user form community is sent to admin'
        });
        const moderatorResponse = yield prepareModeratorResponse.execute();
        return moderatorResponse;
    }
    const manageAction = new communityUserManagerBuilder_1.default(community, targetUserIdString, req.userId, existInLists);
    let communityUpdated = yield manageAction
        .throwErrorIfNotInAnyList('User you are trying to ban is not a member of community, nor is he / she in pending lists. Maybe he / she already left')
        .throwErrorIfCreatorActionTriedByNonCreator(existInLists.moderators.exists && !isCreator, 'User you are trying to ban is moderator. Only creator can ban moderators')
        .throwErrorIfCreatorActionTriedByNonCreator(existInLists.pendingInvitedModerators.exists && !isCreator, 'User you are trying to ban is invited to be moderator. Only creator can ban moderators invitations')
        .removeUserFromLists(['members', 'pendingInvitedUsers', 'userJoinRequests', 'bannedUsers', 'pendingInvitedModerators', 'moderators'])
        .addUserToList('bannedUsers', { bannedBy: new mongoose_1.Types.ObjectId(req.userId) })
        .saveCommunity();
    if (shouldNotifyUser) {
        communityUpdated = communityUpdated.setUserNotification({
            receiver: targetUserIdString,
            notificationType: notifications_1.NOTIFICATION_TYPES.BANNED_FROM_COMMUNITY,
            text: `You have been banned from "${community.name}" community.`
        });
    }
    if (!isCreator && settings.notifyCreatorForUserManagementActions.value) {
        communityUpdated = communityUpdated.setCreatorNotification({
            receiver: community.creator,
            notificationType: notifications_1.NOTIFICATION_TYPES.USERS_MANAGED_BY_MODERATOR,
            text: `*user* (moderator) banned *banned* from your "${community.name}" community`,
            sender: req.userId,
            community: community._id,
            user: targetUserIdString
        });
    }
    communityUpdated = communityUpdated.setResJson({
        res,
        message: 'You have successfully banned user from community',
        targetUserId: targetUserIdString
    });
    const response = yield communityUpdated.execute();
    return response;
    // remove user from community chats
    // await CommunityService.removeUserFromAllCommunityChats(community._id.toString(), community.availableChats.length, targetUserIdString, 'Failed to remove banned user from chats');
}));
exports.undoBanUserFromCommunity = (0, catchAsync_1.default)((req, res, _) => __awaiter(void 0, void 0, void 0, function* () {
    const { targetUserId, shouldNotifyUser = false } = req.body;
    const targetUserIdString = targetUserId.toString();
    const settings = req.communitySettings;
    const isCreator = req.isCreator;
    const community = req.community;
    const existInLists = req.existInLists;
    const manageAction = new communityUserManagerBuilder_1.default(community, targetUserIdString, req.userId, existInLists);
    let communityUpdated = yield manageAction
        .throwErrorIfInAnyListExcept(['bannedUsers'])
        .throwErrorIfUserNotInList('bannedUsers', 'User you are trying to un-ban is not in banned users list. You cannot un-ban user that is not banned')
        .removeUserFromLists(['bannedUsers'])
        .saveCommunity();
    if (shouldNotifyUser) {
        communityUpdated = communityUpdated.setUserNotification({
            receiver: targetUserIdString,
            notificationType: notifications_1.NOTIFICATION_TYPES.REMOVED_COMMUNITY_BAN,
            text: `Your ban from community: "${community.name}" has been removed. You can see this communities posts and chats now.`,
            community: community._id
        });
    }
    if (!isCreator && settings.notifyCreatorForUserManagementActions.value) {
        communityUpdated = communityUpdated.setCreatorNotification({
            receiver: community.creator,
            notificationType: notifications_1.NOTIFICATION_TYPES.USERS_MANAGED_BY_MODERATOR,
            text: `*user* (moderator) removed ban for *banned* for your "${community.name}" community`,
            sender: req.userId,
            community: community._id,
            user: targetUserIdString
        });
    }
    communityUpdated = communityUpdated.setResJson({
        res,
        message: 'You have successfully un-banned user from community',
        targetUserId: targetUserIdString
    });
    const response = yield communityUpdated.execute();
    return response;
}));
exports.inviteUserToJoinAsMember = (0, catchAsync_1.default)((req, res, _) => __awaiter(void 0, void 0, void 0, function* () {
    const existInLists = req.existInLists;
    const { targetUserId } = req.body;
    const targetUserIdString = targetUserId.toString();
    const settings = req.communitySettings;
    const isCreator = req.isCreator;
    const community = req.community;
    const manageAction = new communityUserManagerBuilder_1.default(community, targetUserIdString, req.userId, existInLists);
    let communitySaved = yield manageAction
        .throwErrorIfInAnyListExcept([])
        .addUserToList('pendingInvitedUsers', { invitedBy: new mongoose_1.Types.ObjectId(req.userId) })
        .saveCommunity();
    communitySaved = communitySaved
        .setUserNotification({
        receiver: targetUserIdString,
        notificationType: notifications_1.NOTIFICATION_TYPES.BECOME_COMMUNITY_MEMBER_INVITATION,
        text: `*user* invited you to become member of "${community.name}" community.`,
        community: community._id
    });
    if (!isCreator && settings.notifyCreatorForUserManagementActions.value) {
        communitySaved = communitySaved.setCreatorNotification({
            receiver: community.creator,
            notificationType: notifications_1.NOTIFICATION_TYPES.USERS_MANAGED_BY_MODERATOR,
            text: `*moderator* (moderator) invited *user* to join your "${community.name}" community`,
            sender: req.userId,
            community: community._id,
            user: targetUserIdString
        });
    }
    communitySaved = communitySaved.setResJson({
        res,
        message: 'User successfully invited to join',
        targetUserId: targetUserIdString
    });
    const response = yield communitySaved.execute();
    return response;
}));
exports.inviteUserToJoinAsModerator = (0, catchAsync_1.default)((req, res, _) => __awaiter(void 0, void 0, void 0, function* () {
    const community = req.community;
    const { targetUserId } = req.body;
    const targetUserIdString = targetUserId.toString();
    const existInLists = req.existInLists;
    const manageAction = new communityUserManagerBuilder_1.default(community, targetUserIdString, req.userId, existInLists);
    let communitySaved = yield manageAction
        .throwErrorIfInAnyListExcept(['members'])
        .addUserToList('pendingInvitedModerators', { invitedBy: new mongoose_1.Types.ObjectId(req.userId) })
        .saveCommunity();
    communitySaved = communitySaved
        .setUserNotification({
        receiver: targetUserIdString,
        notificationType: notifications_1.NOTIFICATION_TYPES.BECOME_COMMUNITY_MODERATOR_INVITATION,
        text: `*user* invited you to become moderator of "${community.name}" community.`,
        community: community._id
    });
    communitySaved = communitySaved.setResJson({
        res,
        message: 'User successfully invited to join as moderator',
        targetUserId: targetUserIdString
    });
    const response = yield communitySaved.execute();
    return response;
}));
exports.withdrawCommunityInviteForUser = (0, catchAsync_1.default)((req, res, _) => __awaiter(void 0, void 0, void 0, function* () {
    const existInLists = req.existInLists;
    const { targetUserId } = req.body;
    const targetUserIdString = targetUserId.toString();
    const community = req.community;
    const isCreator = req.isCreator;
    const settings = req.communitySettings;
    const manageAction = new communityUserManagerBuilder_1.default(community, targetUserIdString, req.userId, existInLists);
    let communitySaved = yield manageAction
        .throwErrorIfInAnyListExcept(['pendingInvitedUsers'])
        .throwErrorIfUserNotInList('pendingInvitedUsers', 'User is not in pending list. Maybe request was withdrew or declined before')
        .removeUserFromLists(['pendingInvitedUsers'])
        .saveCommunity();
    if (!isCreator && settings.notifyCreatorForUserManagementActions.value) {
        communitySaved = communitySaved.setCreatorNotification({
            receiver: community.creator,
            notificationType: notifications_1.NOTIFICATION_TYPES.USERS_MANAGED_BY_MODERATOR,
            text: `*moderator* (moderator) withdrew member invite for *user* to join your "${community.name}" community`,
            sender: req.userId,
            community: community._id,
            user: targetUserIdString
        });
    }
    communitySaved = communitySaved
        .setResJson({
        res,
        message: 'You have successfully withdrew invite for user',
        targetUserId: targetUserIdString
    });
    const response = yield communitySaved.execute();
    return response;
}));
// doesnt need internal check if user is creator (only creators can deal with moderators)
// because is done in permission middleware
exports.widthrawCommunityModeratorInvite = (0, catchAsync_1.default)((req, res, _) => __awaiter(void 0, void 0, void 0, function* () {
    const community = req.community;
    const existInLists = req.existInLists;
    const { targetUserId } = req.body;
    const targetUserIdString = targetUserId.toString();
    const manageAction = new communityUserManagerBuilder_1.default(community, targetUserIdString, req.userId, existInLists);
    let communitySaved = yield manageAction
        .throwErrorIfUserNotInList('pendingInvitedModerators', 'User not found in moderator invitation list. Maybe it has declined request. Try refreshing the page')
        .throwErrorIfInAnyListExcept(['members', 'pendingInvitedModerators'])
        .removeUserFromLists(['pendingInvitedModerators'])
        .saveCommunity();
    communitySaved = communitySaved
        .setResJson({
        res,
        message: 'Moderator invitation withdrew successfully',
        targetUserId: targetUserIdString
    });
    const response = yield communitySaved.execute();
    return response;
}));
exports.moderatorAcceptUserJoinRequest = (0, catchAsync_1.default)((req, res, _) => __awaiter(void 0, void 0, void 0, function* () {
    const existInLists = req.existInLists;
    const { targetUserId } = req.body;
    const targetUserIdString = targetUserId.toString();
    const community = req.community;
    const isCreator = req.isCreator;
    const settings = req.communitySettings;
    const manageAction = new communityUserManagerBuilder_1.default(community, targetUserIdString, req.userId, existInLists);
    let communitySaved = yield manageAction
        .throwErrorIfInAnyListExcept(['userJoinRequests'])
        .throwErrorIfUserNotInList('userJoinRequests', 'User is not in request list. Maybe request was removed before')
        .removeUserFromLists(['userJoinRequests'])
        .addUserToList('members')
        .saveCommunity();
    if (!isCreator && settings.notifyCreatorForUserManagementActions.value) {
        communitySaved = communitySaved.setCreatorNotification({
            receiver: community.creator,
            notificationType: notifications_1.NOTIFICATION_TYPES.USERS_MANAGED_BY_MODERATOR,
            text: `*moderator* (moderator) accepted member request for *user* to join your "${community.name}" community`,
            sender: req.userId,
            community: community._id,
            user: targetUserIdString
        });
    }
    communitySaved = communitySaved
        .setUserNotification({
        receiver: targetUserId,
        community: community._id,
        text: `Your request to join "${community.name}" community has been approved. You are now a member`,
        notificationType: notifications_1.NOTIFICATION_TYPES.REQUEST_TO_JOIN_COMMUNITY_AS_MEMBER_ACCEPTED
    })
        .setResJson({
        res,
        message: 'User join request approved successfully',
        targetUserId: targetUserIdString
    });
    const response = yield communitySaved.execute();
    return response;
}));
exports.moderatorDeclineUserJoinRequest = (0, catchAsync_1.default)((req, res, _) => __awaiter(void 0, void 0, void 0, function* () {
    const existInLists = req.existInLists;
    const community = req.community;
    const { targetUserId } = req.body;
    const targetUserIdString = targetUserId.toString();
    const isCreator = req.isCreator;
    const settings = req.communitySettings;
    const manageAction = new communityUserManagerBuilder_1.default(community, targetUserIdString, req.userId, existInLists);
    let communitySaved = yield manageAction
        .throwErrorIfUserNotInList('userJoinRequests', 'User is not in request list. Maybe it has withdrew request')
        .throwErrorIfInAnyListExcept(['userJoinRequests'])
        .removeUserFromLists(['userJoinRequests'])
        .saveCommunity();
    if (!isCreator && settings.notifyCreatorForUserManagementActions.value) {
        communitySaved = communitySaved.setCreatorNotification({
            receiver: community.creator,
            notificationType: notifications_1.NOTIFICATION_TYPES.USERS_MANAGED_BY_MODERATOR,
            text: `*moderator* (moderator) declined member request for *user* to join your "${community.name}" community`,
            sender: req.userId,
            community: community._id,
            user: targetUserIdString
        });
    }
    communitySaved = communitySaved
        .setUserNotification({
        receiver: targetUserId,
        community: community._id,
        text: `Your request to join "${community.name}" community has been declined.`,
        notificationType: notifications_1.NOTIFICATION_TYPES.REQUEST_TO_JOIN_COMMUNITY_AS_MEMBER_DECLINED
    })
        .setResJson({
        res,
        message: 'User join request approved successfully',
        targetUserId: targetUserIdString
    });
    const response = yield communitySaved.execute();
    return response;
}));
