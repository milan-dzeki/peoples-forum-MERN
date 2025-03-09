import { NotificationSchemaType } from "models/notificationModel";

export interface CommunityModeratorRequestResponseType {
  status: string;
  message: string;
  newDescriptionValue?: string;
  moderatorNotification?: NotificationSchemaType;
}