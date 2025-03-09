import { Types } from 'mongoose';
import { NOTIFICATION_TYPES } from 'configs/notifications';

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

export interface PreparedNotificationType {
  receiver: Types.ObjectId | string;
  notificationType: NotificationType;
  text: string;
  sender: Types.ObjectId | string;
  communityId: Types.ObjectId | string;
}