import { Response, NextFunction } from 'express';
import { RequestWithBodyType } from 'types/lib';
import catchAsync from 'utils/catchAsync';
import cloudinary from 'configs/cloudinary';
import CommunityValidator from 'configs/validators/communityValidator';
import AppError from 'utils/appError';
import User from 'models/userModel';

export const createCommunity = catchAsync (async (
  req: RequestWithBodyType,
  res: Response,
  next: NextFunction
) => {
  const {
    pendingInvitedModerators,
    access,
    name,
    description,
    rules,
    pendingInvitedUsers,
    chatNames
  } = req.fields  as {
    [key: string]: string | undefined;
  };

  console.log(
    pendingInvitedModerators,
    access,
    name,
    description,
    rules,
    pendingInvitedUsers,
    chatNames
  );

  const pendMods = JSON.parse(pendingInvitedModerators!);
  // const error = await CommunityValidator.areUsersValid(pendMods);
  // // console.log(error);
  // const parsedRules = JSON.parse(rules!);
  // // console.log('pRules', parsedRules[0].title)
  // const ruleErr = CommunityValidator.areRulesValid(parsedRules);
  // console.log('rilERr', ruleErr);

  return res.send('cool');
});