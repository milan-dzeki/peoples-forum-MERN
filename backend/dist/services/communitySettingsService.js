"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
}
exports.default = CommunitySettingsService;
