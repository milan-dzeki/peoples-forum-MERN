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
}
exports.default = CommunityService;
