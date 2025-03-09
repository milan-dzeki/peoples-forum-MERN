import { NextFunction, Response } from 'express';
import { RequestWithCommunityType, RequestWithModeratorRequestType } from 'types/lib';
import catchAsync from 'utils/catchAsync';
import AppError from 'utils/appError';
import cloudinary from 'configs/cloudinary';
import Community from 'models/communityModel';
import CommunityModeratorChangeRequest, { CommunityModeratorChangeRequestSchemaType } from 'models/communityModeratorChangeRequestModel';
import User from 'models/userModel';
import { NOTIFICATION_TYPES } from 'configs/notifications';
import CommunityValidator from 'configs/validators/community/communityValidator';
import CommunityModeratorChangeRequestService from 'services/communityModeratorChangeRequestsSerivce';
import Notification from 'models/notificationModel';
import { CommunityModeratorRequestResponseType } from 'types/controllers/communityModeratorRequests';
import CommunityActivityLog from 'models/communityActivityLogs';
import { COMMUNITY_LOG_TYPE } from 'configs/communityActivityLogs';
import CommunityService from 'services/communityService';

export const declineModeratorRequest = catchAsync (async (
  req: RequestWithModeratorRequestType,
  res: Response,
  next: NextFunction
) => {
  // CommunityService.updateCommunityField.update_description(req.community!);
  const moderatorRequest = req.moderatorRequest!;
  if (moderatorRequest.status === 'declined') {
    next(new AppError(400, 'You have already declined this request in the past.'));
    return;
  }

  if (moderatorRequest.status === 'approved') {
    next(new AppError(400, 'You have already approved this request in the past. If you wnat to revert changes doen tby it, do it manually.'));
    return;
  }

  await CommunityModeratorChangeRequestService.removeRequestPhotoIfItExists(moderatorRequest.photo);

  moderatorRequest.status = 'declined';

  const community = req.community!;
  const shouldNotifyModerator = req.shouldNotifyModerator!;

  const responseJson: CommunityModeratorRequestResponseType = {
    status: 'success',
    message: 'Request declined successfully'
  };

  if (shouldNotifyModerator) {
    const moderatorNotification = await Notification.create({
      receiver: moderatorRequest.moderator,
      notificationType: NOTIFICATION_TYPES.MODERATOR_CHANGE_REQUEST_DECLINED,
      text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been declined`,
      community: community._id
    });

    responseJson.moderatorNotification = moderatorNotification;
  }

  await CommunityActivityLog.create({
    community: community._id,
    logType: COMMUNITY_LOG_TYPE.HANDLE_MODERATOR_REQUESTS,
    moderator: moderatorRequest.moderator,
    text: `declined request to ${moderatorRequest.requestType} made by moderator *user*`,
    moderatorRequest: moderatorRequest._id
  });

  await moderatorRequest.save();

  return res.status(200).json(responseJson);
});

export const acceptModeratorRequest = catchAsync (async (
  req: RequestWithModeratorRequestType,
  res: Response,
  next: NextFunction
) => {
  const community = req.community!;
  const moderatorRequest = req.moderatorRequest!;
  if (moderatorRequest.status === 'declined') {
    next(new AppError(400, 'You have already declined this request in the past.'));
    return;
  }

  if (moderatorRequest.status === 'approved') {
    next(new AppError(400, 'You have already approved this request in the past. If you wnat to revert changes doen tby it, do it manually.'));
    return;
  }

  const shouldNotifyModerator = req.shouldNotifyModerator!;
  
  const moderatorNotification = await CommunityModeratorChangeRequestService
    .acceptUpdateCommunityField[
      moderatorRequest.requestType! as keyof typeof CommunityModeratorChangeRequestService.acceptUpdateCommunityField
    ](
      community,
      moderatorRequest,
      shouldNotifyModerator
    );

  return res.status(200).json({
    status: 'success',
    message: 'Moderator request approved',
    moderatorNotification
  });
});

export const acceptUpdateCommuntyDescriptionRequest = catchAsync (async (
  req: RequestWithModeratorRequestType,
  res: Response,
  next: NextFunction
) => {
  const community = req.community!;
  const moderatorRequest = req.moderatorRequest!;
  if (moderatorRequest.status === 'declined') {
    next(new AppError(400, 'You have already declined this request in the past.'));
    return;
  }

  if (moderatorRequest.status === 'approved') {
    next(new AppError(400, 'You have already approved this request in the past. If you wnat to revert changes doen tby it, do it manually.'));
    return;
  }

  const requestDescription = moderatorRequest.newDescriptionValue!;

  const descriptionInvalid = CommunityValidator.validateStringValues(requestDescription, 'description');
  if (descriptionInvalid) {
    next(new AppError(400, descriptionInvalid));
    return;
  }

  community.description = requestDescription;
  await community.save();

  moderatorRequest.status = 'approved';
  await moderatorRequest.save();

  const responseJson: CommunityModeratorRequestResponseType = {
    status: 'success',
    message: `Moderator request approved and community description changed to "${requestDescription}"`,
    newDescriptionValue: community.description
  }

  const shouldNotifyModerator = req.shouldNotifyModerator!;
  if (shouldNotifyModerator) {
    const moderatorNotification = await Notification.create({
      receiver: moderatorRequest.moderator,
      notificationType: NOTIFICATION_TYPES.MODERATOR_CHANGE_REQUEST_APPROVED,
      text: `Your request to ${moderatorRequest.requestType} to "${requestDescription}" for "${community.name}" community has been approved`,
      community: community._id
    });

    responseJson.moderatorNotification = moderatorNotification;
  }

  await CommunityActivityLog.create({
    community: community._id,
    logType: COMMUNITY_LOG_TYPE.HANDLE_MODERATOR_REQUESTS,
    moderator: moderatorRequest.moderator,
    text: `approved request to update community description to "${community.description}" made by moderator`,
    moderatorRequest: moderatorRequest._id
  });

  return res.status(200).json(responseJson);
});