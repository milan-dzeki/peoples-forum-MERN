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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const chatModel_1 = __importDefault(require("models/chatModel"));
const communityModel_1 = __importDefault(require("models/communityModel"));
const notificationModel_1 = __importDefault(require("models/notificationModel"));
const userModel_1 = __importDefault(require("models/userModel"));
const appError_1 = __importDefault(require("utils/appError"));
const communityModeratorChangeRequestsSerivce_1 = __importDefault(require("./communityModeratorChangeRequestsSerivce"));
const communityActivityLogsService_1 = __importDefault(require("./communityActivityLogsService"));
const communityValidator_1 = __importDefault(require("configs/validators/community/communityValidator"));
class CommunityService {
    static createCommunityChatsUponCommunityCreation(creatorId, communityId, chatNames) {
        return __awaiter(this, void 0, void 0, function* () {
            if (chatNames.length === 0) {
                return;
            }
            try {
                const createdChatIds = [];
                for (const name of chatNames) {
                    const newChat = yield chatModel_1.default.create({
                        creator: creatorId,
                        name,
                        members: [creatorId],
                        admins: [creatorId],
                        communityId,
                        bannedUsers: []
                    });
                    if (newChat) {
                        createdChatIds.push(newChat._id);
                    }
                }
                return createdChatIds;
            }
            catch (error) {
                // remove chats and community if something fails
                yield chatModel_1.default.deleteMany({ creator: creatorId, communityId });
                yield communityModel_1.default.deleteOne({ _id: communityId, creator: creatorId });
                throw new appError_1.default(500, 'Failed to create chats for community. Maybe servers are down. Reftesh the page and try again');
            }
        });
    }
    static removeUserFromAllCommunityChats(communityId, communityChatsLength, userId, actionFailMsg) {
        return __awaiter(this, void 0, void 0, function* () {
            if (communityChatsLength === 0) {
                return;
            }
            try {
                yield chatModel_1.default.updateMany({
                    communityId,
                    members: { $in: [userId] }
                }, { $pull: { members: userId } });
            }
            catch (error) {
                throw new appError_1.default(500, actionFailMsg);
            }
        });
    }
    static removeUserFromLists(community, listNames, userId) {
        for (const list of listNames) {
            community[list].pull({ user: userId });
        }
    }
    static createInviteUserNotification(targetUserId, invitatorId, communityId, communityName, notificationType) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const invitator = yield userModel_1.default.findById(invitatorId).select('fullName profilePhotoUrl');
                const inviteUserNotification = yield notificationModel_1.default.create({
                    receiver: targetUserId,
                    sender: invitatorId,
                    notificationType: notificationType,
                    text: `<sender>${invitator.fullName}</sender> have invited you to join "${communityName}" community ${notificationType === 'becomeCommunityModeratorRequest' ? 'as moderator' : ''}.`,
                    community: communityId
                });
                const populatedInviteNotification = yield inviteUserNotification.populate({ path: 'sender', select: 'fullName profilePhotoUrl' });
                return populatedInviteNotification;
            }
            catch (error) {
                throw error;
            }
        });
    }
    static extractCreatorAndModeratorIds(moderators, communityCreatorId, doNotIncludeIds) {
        let ids = [...moderators.map((moderator) => moderator.user), communityCreatorId];
        if (doNotIncludeIds) {
            const doNotIncludeIdsString = doNotIncludeIds.map((user) => user.toString());
            ids = ids.filter((user) => !doNotIncludeIdsString.includes(user.toString()));
        }
        return ids;
    }
    static createCreatorAndModeratorNotifications(moderators, communityCreatorId, notificationInput, doNotIncludeIds) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const moderatorIds = this.extractCreatorAndModeratorIds(moderators, communityCreatorId, doNotIncludeIds);
                const { notificationType, text, sender, communityId } = notificationInput;
                const preparedNotifications = [];
                for (const moderatorId of moderatorIds) {
                    preparedNotifications.push({
                        receiver: moderatorId,
                        notificationType,
                        text,
                        sender,
                        communityId
                    });
                }
                const notifications = yield notificationModel_1.default.insertMany(preparedNotifications);
                return notifications;
            }
            catch (error) {
                throw error;
            }
        });
    }
    static createUpdateFieldRequestResponse(parameters) {
        const { res, message, moderatorNotifications, approvedRequestModeratorNotification, newDescription } = parameters;
        const responseJson = {
            status: 'success',
            message,
            moderatorNotifications
        };
        if (approvedRequestModeratorNotification) {
            responseJson.approvedRequestModeratorNotification = approvedRequestModeratorNotification;
        }
        if (newDescription) {
            responseJson.newDescription = newDescription;
        }
        return res.status(200).json(responseJson);
    }
    static handleSendModeratorRequestResponseAction(parameters) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { commons: { communityId, moderator }, moderatorRequestData: { requestType, communityCreator, requestText, updateValues }, communityActivityLogData: { logType, text, photoUrl }, resJson: { res, message } } = parameters;
                const moderatorRequest = yield communityModeratorChangeRequestsSerivce_1.default.createNewModeratorRequest({
                    requestType,
                    communityId,
                    communityCreator,
                    moderator,
                    requestText,
                    updateValues: updateValues || {}
                });
                yield communityActivityLogsService_1.default.createNewCommunityActivityLog({
                    communityId,
                    logType,
                    moderator,
                    text,
                    moderatorRequest: moderatorRequest._id,
                    photoUrl: photoUrl || undefined
                });
                return communityModeratorChangeRequestsSerivce_1.default.sendModeratorRequestResponse({
                    res,
                    message,
                    moderatorRequest
                });
            }
            catch (error) {
                throw error;
            }
        });
    }
    static handleSendUpdateCommunityFieldRequestResponseAction(parameters) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { fieldUpdateHandler, communityId, communityActivityLogData: { logType, moderator, text: notificationText, photoUrl }, approvedRequestModeratorNotification, moderatorsNotificationsData: { moderators, communityCreator, notificationType, text, sender, doNotIncludeIds }, resJson: { res, message } } = parameters;
                const newDescription = yield fieldUpdateHandler();
                yield communityActivityLogsService_1.default.createNewCommunityActivityLog({
                    communityId,
                    logType,
                    text: notificationText,
                    moderator,
                    photoUrl: photoUrl || undefined
                });
                const moderatorNotifications = yield this.createCreatorAndModeratorNotifications(moderators, communityCreator, {
                    communityId,
                    notificationType,
                    sender,
                    text
                }, doNotIncludeIds);
                return this.createUpdateFieldRequestResponse({
                    res,
                    message,
                    moderatorNotifications,
                    approvedRequestModeratorNotification,
                    newDescription
                });
            }
            catch (error) {
                throw error;
            }
        });
    }
}
_a = CommunityService;
CommunityService.updateFieldHandlers = {
    handleUpdateDescription: (community, newDescription, shouldValidate, moderatorRequest) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (shouldValidate) {
                communityValidator_1.default.validateStringValues(newDescription, 'description', true);
            }
            community.description = newDescription;
            yield community.save();
            if (moderatorRequest) {
                moderatorRequest.status = 'approved';
                yield moderatorRequest.save();
            }
            return community.description;
        }
        catch (error) {
            throw error;
        }
    })
};
exports.default = CommunityService;
