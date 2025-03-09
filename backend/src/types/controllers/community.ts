import { Response } from 'express';
import { Types } from 'mongoose';
import { COMMUNITY_PERMISSION_NAMES } from 'configs/community';
import { NotificationSchemaType } from 'models/notificationModel';
import { ModeratorRequestType } from './communityModeratorRequests';
import { CommunityActivityLogType } from './communityActivityLogs';
import { NotificationType } from 'types/models/notificationModelTypes';
import { CommunitySchemaType } from 'models/communityModel';

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

export interface ModeratorNotificationType {
  notificationType: NotificationType;
  text: string;
  sender: Types.ObjectId | string;
  communityId: Types.ObjectId | string;
}

export type CommunityPermissionNameType = typeof COMMUNITY_PERMISSION_NAMES[keyof typeof COMMUNITY_PERMISSION_NAMES];

export interface UpdateFieldResponseJsonType {
  status: string;
  message: string;
  moderatorNotifications: NotificationSchemaType[];
  approvedRequestModeratorNotification?: NotificationSchemaType;
  newDescription?: string;
}

export interface SendUpdateFieldRequestResponseType {
  res: Response;
  message: string;
  moderatorNotifications: NotificationSchemaType[];
  approvedRequestModeratorNotification?: NotificationSchemaType;
  newDescription?: string;
}

export interface HandleSendModeratorRequestResponseActionParameters {
  commons: {
    communityId: Types.ObjectId | string;
    moderator: Types.ObjectId | string;
  };
  moderatorRequestData: {
    requestType: ModeratorRequestType;
    communityCreator: Types.ObjectId | string;
    requestText: string;
    updateValues?: {
      newDescriptionValue?: string;
      photo?: { secure_url: string, public_id: string };
      newRules?: {
        _id?: Types.ObjectId | string;
        title: string;
        description?: string;
      }[];
      deleteRuleIds?: (Types.ObjectId | string)[];
    };
  };
  communityActivityLogData: {
    logType: CommunityActivityLogType;
    text: string;
    photoUrl?: string;
  };
  resJson: {
    res: Response;
    message: string;
  }
}

export interface HandleSendUpdateCommunityFieldRequestResponseActionType {
  fieldUpdateHandler: () => Promise<any>;
  communityId: Types.ObjectId | string;
  communityActivityLogData: {
    logType: CommunityActivityLogType;
    moderator: Types.ObjectId | string;
    text: string;
    photoUrl?: string;
  };
  moderatorsNotificationsData: {
    moderators: CommunitySchemaType['moderators'];
    communityCreator: Types.ObjectId | string;
    notificationType: NotificationType;
    text: string;
    sender: Types.ObjectId | string;
    doNotIncludeIds?:( Types.ObjectId | string)[];
  };
  approvedRequestModeratorNotification?: NotificationSchemaType;
  resJson: {
    res: Response;
    message: string;
  }
}