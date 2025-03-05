import { Request, Response, NextFunction } from 'express';

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

export type ControllerType = (req: RequestWithBodyType, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;