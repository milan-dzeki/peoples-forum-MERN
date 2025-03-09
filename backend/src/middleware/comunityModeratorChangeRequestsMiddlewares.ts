import { NextFunction, Response } from 'express';
import CommunityModeratorChangeRequest from 'models/communityModeratorChangeRequestModel';
import CommunitySettings from 'models/settings/communitySettingsModel';
import User from 'models/userModel';
import CommunityModeratorChangeRequestService from 'services/communityModeratorChangeRequestsSerivce';
import { RequestWithModeratorRequestType } from 'types/lib';
import AppError from 'utils/appError';

export const isModeratorRequestValid = async (
  req: RequestWithModeratorRequestType,
  _: Response,
  next: NextFunction
) => {
  try {
    const { requestId } = req.params;

    if (!requestId) {
      next(new AppError(400, 'Request ID was not found. Cannot perform an action.'));
      return;
    }

    const moderatorRequest = await CommunityModeratorChangeRequest.findOne({
      _id: requestId,
      community: req.community!._id
    });

    if (!moderatorRequest) {
      next(new AppError(404, 'Request was not found. Maybe it was canceled.'));
      return;
    }

    if (!moderatorRequest.moderator) {
      await CommunityModeratorChangeRequestService.removeRequestPhotoIfItExists(moderatorRequest.photo);
      await CommunityModeratorChangeRequest.deleteOne({ _id: requestId });

      next(new AppError(404, 'Request is invalid. Moderator id not found so request is deleted.'));
      return;
    }

    const moderatorExist = await User.exists({ _id: moderatorRequest.moderator });
    if (!moderatorExist) {
      await CommunityModeratorChangeRequestService.removeRequestPhotoIfItExists(moderatorRequest.photo);
      await CommunityModeratorChangeRequest.deleteOne({ _id: requestId });

      next(new AppError(404, 'Failed to find account of moderator who sent request so request is deleted.'));
      return;
    }

    const isModerator = req.community!.moderators.find((moderator) => moderator.user.toString() === moderatorRequest.moderator.toString());
    if (!isModerator) {
      next(new AppError(400, 'User who made request is not moderator. You should remove this request because it is invalid.'));
      return;
    }

    req.moderatorRequest = moderatorRequest;
    next();
  } catch (error: unknown) {
    next(error);
    return;
  }
};

export const shouldNotifyModerator = async (
  req: RequestWithModeratorRequestType,
  _: Response,
  next: NextFunction
) => {
  try {
    const moderatorSettings = await CommunitySettings
      .findOne({ community: req.community!._id })
      .select('moderators_settings.notifyModeratorAboutSettingsChanges');

    if (!moderatorSettings) {
      next(new AppError(400, 'Community settings are not found. Please go to settings page and creat them.'));
      return;
    }

    req.shouldNotifyModerator = moderatorSettings.moderators_settings!.notifyModeratorAboutSettingsChanges!.value;
    next();
  } catch (error: unknown) {
    next(error);
    return;
  }
};