import { Request, Response, NextFunction } from 'express';
import { CommunitySchemaType } from 'models/communityModel';
import { CommunityModeratorChangeRequestSchemaType } from 'models/communityModeratorChangeRequestModel';
import { CommunitySettingsSchemaType } from 'models/settings/communitySettingsModel';

export type ControllerType = (req: RequestWithBodyType, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;

export interface RequestWithBodyType extends Request {
  body: {
    [name: string]: string | unknown;
  };
}

export interface RequestWithUserIdType extends Request {
  userId?: string;
}

export interface RequestWithCommunityType extends Request {
  userId?: string;
  community?: CommunitySchemaType;
  existInLists?: any;
  isCreator?: boolean;
  communitySettings?: CommunitySettingsSchemaType;
  moderatorActionRequirePermission?: boolean;
}

export interface RequestWithModeratorRequestType extends Request {
  userId?: string;
  community?: CommunitySchemaType;
  isCreator?: boolean;
  moderatorRequest?: CommunityModeratorChangeRequestSchemaType;
  shouldNotifyModerator?: boolean;
}

export interface RequestWithCommunitySettingsType extends Request {
  userId?: string;
  community?: CommunitySchemaType;
  isCreator?: boolean;
  communitySettings?: CommunitySettingsSchemaType;
}
