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
const communityActivityLogs_1 = __importDefault(require("models/communityActivityLogs"));
class CommunitySettingsService {
    // for joined_members_permissions_settings
    static setAllPostCommentSettingsToFalseIfCommentsAreNotAllowed(communitySettings) {
        communitySettings.joined_members_permissions.posts_settings.allowPostComments.value = false;
        communitySettings.joined_members_permissions.posts_settings.allowPostCommentsVotes.value = false;
        communitySettings.joined_members_permissions.posts_settings.allowPostCommentsSharing.value = false;
    }
    // for joined_members_permissions_settings
    static setAllChatSettingsToFalseIfChatsAreNotAllowed(communitySettings) {
        communitySettings.joined_members_permissions.chats_settings.allowChats.value = false;
        communitySettings.joined_members_permissions.chats_settings.membersCanCreateChats.value = false;
        communitySettings.joined_members_permissions.chats_settings.membersChatsRequireApprovalBeforeCreate.value = false;
        communitySettings.joined_members_permissions.chats_settings.membersCanManageTheirChats.value = false;
    }
    static setAllNonMemberCommentSettingsToFalseIfCommentsNotAllowed(communitySettings) {
        communitySettings.non_members_permissions.canPostComments.value = false;
        communitySettings.non_members_permissions.canViewComments.value = false;
        communitySettings.non_members_permissions.canVoteComments.value = false;
        communitySettings.non_members_permissions.canShareComments.value = false;
    }
    static setAllNonMemberPostSettingsToFalseIfPostsNotAllowed(communitySettings) {
        communitySettings.non_members_permissions.canCreatePosts.value = false;
        communitySettings.non_members_permissions.canViewPosts.value = false;
        communitySettings.non_members_permissions.canVotePosts.value = false;
        communitySettings.non_members_permissions.canSharePosts.value = false;
        this.setAllNonMemberCommentSettingsToFalseIfCommentsNotAllowed(communitySettings);
    }
    static createCommunitySettingsChangedLog(comunityId, actor, logText) {
        return __awaiter(this, void 0, void 0, function* () {
            yield communityActivityLogs_1.default.create({
                community: comunityId,
                user: actor,
                logType: 'changedSettings',
                text: logText
            });
        });
    }
}
exports.default = CommunitySettingsService;
