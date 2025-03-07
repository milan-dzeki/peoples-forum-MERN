import { Types } from 'mongoose';
import { NotificationType } from './notificationModelTypes';
import { NotificationSchemaType } from 'models/notificationModel';

export interface ModeratorCommunitySettingsChangedNotificationType {
  receiver: Types.ObjectId | string;
  notificationType: NotificationType['COMMUNITY_SETTINGS_CHANGED'];
  text: string;
  community: Types.ObjectId | string;
}

export interface CommunitySettingsResponseType {
  status: string;
  message: string;
  updatedSettings: any;
  moderatorNotifications?: NotificationSchemaType[];
}