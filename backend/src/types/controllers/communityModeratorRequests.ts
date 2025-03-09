import { COMMUNITY_MODERATOR_REQUEST_TYPES } from "configs/communityModeratorChangeRequests";
import { NotificationSchemaType } from "models/notificationModel";

export interface CommunityModeratorRequestResponseType {
  status: string;
  message: string;
  newDescriptionValue?: string;
  moderatorNotification?: NotificationSchemaType;
}

export type ModeratorRequestType = typeof COMMUNITY_MODERATOR_REQUEST_TYPES[keyof typeof COMMUNITY_MODERATOR_REQUEST_TYPES];