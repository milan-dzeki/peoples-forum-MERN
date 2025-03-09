import { COMMUNITY_PERMISSION_NAMES } from 'configs/community';
import { NotificationSchemaType } from 'models/notificationModel';

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

export type CommunityPermissionNameType = typeof COMMUNITY_PERMISSION_NAMES[keyof typeof COMMUNITY_PERMISSION_NAMES];