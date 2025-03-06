import { Request, Response, NextFunction } from 'express';
import { CommunitySettingsSchemaType } from 'models/settings/communitySettingsModel';

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
  community?: any;
  existInLists?: any;
  isCreator?: boolean;
}

export interface RequestWithCommunitySettingsType extends Request {
  userId?: string;
  communityId?: string;
  isCreator?: boolean;
  communitySettings?: CommunitySettingsSchemaType;
}

export type ControllerType = (req: RequestWithBodyType, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;