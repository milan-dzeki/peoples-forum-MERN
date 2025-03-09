import { Types } from 'mongoose';
import { CommunitySettingsSchemaType } from 'models/settings/communitySettingsModel';
import { CommunitySchemaType } from 'models/communityModel';
import { NOTIFICATION_TYPES } from 'configs/notifications';
import { CommunitySettingsResponseType, ModeratorCommunitySettingsChangedNotificationType } from 'types/controllers/communitySettings';
import CommunityActivityLog from 'models/communityActivityLogs';
import Notification from 'models/notificationModel';

class CommunitySettingsService {
  // for joined_members_permissions_settings
  static setAllPostCommentSettingsToFalseIfCommentsAreNotAllowed (communitySettings: CommunitySettingsSchemaType) {
    communitySettings.joined_members_permissions!.posts_settings!.allowPostComments!.value = false;
    communitySettings.joined_members_permissions!.posts_settings!.allowPostCommentsVotes!.value = false;
    communitySettings.joined_members_permissions!.posts_settings!.allowPostCommentsSharing!.value = false;
  }
  // for joined_members_permissions_settings
  static setAllChatSettingsToFalseIfChatsAreNotAllowed (communitySettings: CommunitySettingsSchemaType) {
    communitySettings.joined_members_permissions!.chats_settings!.allowChats!.value = false;
    communitySettings.joined_members_permissions!.chats_settings!.membersCanCreateChats!.value = false;
    communitySettings.joined_members_permissions!.chats_settings!.membersChatsRequireApprovalBeforeCreate!.value = false;
    communitySettings.joined_members_permissions!.chats_settings!.membersCanManageTheirChats!.value = false;
  }

  static setAllNonMemberCommentSettingsToFalseIfCommentsNotAllowed (communitySettings: CommunitySettingsSchemaType) {
    communitySettings.non_members_permissions!.canPostComments!.value = false;
    communitySettings.non_members_permissions!.canViewComments!.value = false;
    communitySettings.non_members_permissions!.canVoteComments!.value = false;
    communitySettings.non_members_permissions!.canShareComments!.value = false;
  }

  static setAllNonMemberPostSettingsToFalseIfPostsNotAllowed (communitySettings: CommunitySettingsSchemaType) {
    communitySettings.non_members_permissions!.canCreatePosts!.value = false;
    communitySettings.non_members_permissions!.canViewPosts!.value = false;
    communitySettings.non_members_permissions!.canVotePosts!.value = false;
    communitySettings.non_members_permissions!.canSharePosts!.value = false;
    
    this.setAllNonMemberCommentSettingsToFalseIfCommentsNotAllowed(communitySettings);
  }

  static async createCommunitySettingsChangedLog (
    comunityId: Types.ObjectId | string,
    actor: Types.ObjectId | string,
    logText: string
  ) {
    await CommunityActivityLog.create({
      community: comunityId,
      user: actor,
      logType: 'changedSettings',
      text: logText
    });
  }

  static async createModeratorNotifictaionsForSettingChanges (
    shouldSendNotifications: boolean,
    community: CommunitySchemaType,
    notificationMessage: string,
    responseJson: CommunitySettingsResponseType
  ): Promise<CommunitySettingsResponseType> {
    console.log(shouldSendNotifications, community, notificationMessage)
    if (
      !shouldSendNotifications ||
      !community.moderators || 
      (community.moderators && community.moderators.length === 0)
    ) {
      return responseJson;
    }

    const notifications: ModeratorCommunitySettingsChangedNotificationType[] = [];

    for (const moderator of community.moderators) {
      notifications.push({
        receiver: moderator.user,
        notificationType: NOTIFICATION_TYPES.COMMUNITY_SETTINGS_CHANGED,
        text: notificationMessage,
        community: community._id
      });
    }

    const createdNotifications = await Notification.insertMany(notifications);

    responseJson.moderatorNotifications = createdNotifications;

    return responseJson;
  }
}

export default CommunitySettingsService;