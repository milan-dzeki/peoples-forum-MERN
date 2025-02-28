import { Response, NextFunction } from 'express';
import { RequestWithBodyType, ControllerType } from 'types/lib';

const catchAsync = (controller: ControllerType) => {
  return (req: RequestWithBodyType, res: Response, next: NextFunction) => {
    controller(req, res, next).catch((err: unknown) => next(err));
  };
};

export default catchAsync;