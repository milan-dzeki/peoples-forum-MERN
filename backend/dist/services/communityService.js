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
const chatModel_1 = __importDefault(require("models/chatModel"));
const communityModel_1 = __importDefault(require("models/communityModel"));
const notificationModel_1 = __importDefault(require("models/notificationModel"));
const userModel_1 = __importDefault(require("models/userModel"));
const appError_1 = __importDefault(require("utils/appError"));
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
    static isUserInLists(community, listNames, userId) {
        const existInLists = {};
        for (const list of listNames) {
            const isInList = community[list].find((user) => user.toString() === userId);
            if (isInList) {
                existInLists[list] = true;
            }
        }
        return existInLists;
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
}
exports.default = CommunityService;
