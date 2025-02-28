import { Response, NextFunction } from 'express';

export interface RequestWithBodyType {
  body: {
    [name: string]: string | unknown;
  };
}

export type ControllerType = (req: RequestWithBodyType, res: Response, next: NextFunction) => Promise<void>;