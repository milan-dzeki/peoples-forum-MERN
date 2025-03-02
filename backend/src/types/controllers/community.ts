import { NotificationSchemaType } from "models/notificationModel";

export interface CommunityRuleType {
  title: string;
  description: string;
}

export interface PrepareCommunityForCreateType {
  creator: string;
  pendingInvitedModerators: string[];
  moderators: string[];
  access: 'public' | 'private';
  name: string;
  description: string;
  rules: CommunityRuleType[];
  pendingInvitedUsers: string[];
  joinedUsers: string[];
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
  userRemovedBanNotifications?: NotificationSchemaType[];
}