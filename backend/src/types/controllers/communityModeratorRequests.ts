import { Response } from 'express';
import { Types } from 'mongoose';
import { COMMUNITY_MODERATOR_REQUEST_TYPES } from 'configs/community/communityModeratorChangeRequests';
import { NotificationSchemaType } from 'models/notificationModel';
import { CommunityModeratorChangeRequestSchemaType } from 'models/communityModeratorChangeRequestModel';

export interface CommunityModeratorRequestResponseType {
  status: string;
  message: string;
  newDescriptionValue?: string;
  moderatorNotification?: NotificationSchemaType;
}

export type ModeratorRequestType = typeof COMMUNITY_MODERATOR_REQUEST_TYPES[keyof typeof COMMUNITY_MODERATOR_REQUEST_TYPES];

export interface CreateModeratorRequestParameteresType {
  requestType: ModeratorRequestType;
  communityId: Types.ObjectId | string;
  communityCreator: Types.ObjectId | string;
  moderator: Types.ObjectId | string;
  requestText: string;
  forUser?: Types.ObjectId | string;
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
}

export interface PrepareNewModeratorRequestType {
  requestType: ModeratorRequestType;
  community: Types.ObjectId | string;
  communityCreator: Types.ObjectId | string;
  moderator: Types.ObjectId | string;
  requestText: string;
  forUser?: Types.ObjectId | string;
  newDescriptionValue?: string;
  photo?: {
    secure_url: string;
    public_id: string;
  };
  newRules?: {
    _id?: Types.ObjectId | string;
    title: string;
    description?: string;
  }[];
  deleteRuleIds?: (Types.ObjectId | string)[];
}

export interface SendModeratorRequestResponseParametersType {
  res: Response;
  message: string;
  moderatorRequest: CommunityModeratorChangeRequestSchemaType;
}
