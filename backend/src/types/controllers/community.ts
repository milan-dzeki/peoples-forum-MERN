import { NotificationSchemaType } from "models/notificationModel";

export interface CommunityRuleType {
  title: string;
  description: string;
}

export interface PrepareCommunityForCreateType {
  creator: string;
  pendingInvitedModerators: string[];
  moderators: string[];
  name: string;
  description: string;
  rules: CommunityRuleType[];
  pendingInvitedUsers: string[];
  members: string[];
  bannedUsers: string[];
  availableChats: string[];
  bannerImageUrl?: string;
  bannerImagePublicId?: string;
  profileImageUrl?: string;
  profileImagePublicId?: string;
}

export interface BannedUserResDataType {
  status: string;
  message: string;
  bannedUserId: string;
  bannedUserNotification?: NotificationSchemaType;
}

export interface RemoveUserBanResDataType {
  status: string;
  message: string;
  userRemovedBanId: string;
  userRemovedBanNotifications?: NotificationSchemaType;
}

export type CommunityListType = 'bannedUsers' | 'members' | 'pendingInvitedUsers' | 'pendingInvitedModerators' | 'userJoinRequests' | 'moderators';

export type UserExistInListsType = {
  [list in CommunityListType]: {
    exists: boolean;
    alias: string;
  }
}

export type CommunityPermissionNameType = (
  'update_description' |
  'update_profile_photo' |
  'remove_profile_photo' |
  'update_banner_photo' |
  'remove_banner_photo' |
  'update_rules' |
  'update_community_access' |
  'remove_posts' | 
  'remove_comments' |
  'pin_posts' |
  'ban_users' |
  'undo_ban_users' |
  'invite_users_as_members' |
  'invite_users_as_moderators' |
  'withdraw_invite_users_as_members' |
  'withdraw_invite_users_as_meoderators' |
  'ban_users_from_chats' |
  'undo_ban_users_from_chats' |
  'accept_join_requests' |
  'decline_join_requests' |
  'remove_chats' |
  'remove_chat_messages'
);