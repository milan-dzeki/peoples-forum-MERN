import { Response, NextFunction } from 'express';
import type { RequestWithCommunitySettingsType } from 'types/lib';
import AppError from 'utils/appError';
import Community from 'models/communityModel';
import CommunitySettings from 'models/settings/communitySettingsModel';

export const doesCommunityExistAndIsUserCreator = async (
  req: RequestWithCommunitySettingsType,
  _: Response,
  next: NextFunction
) => {
  try {
    const { communityId } = req.params;
    
    if (!communityId) {
      next(new AppError(400, 'Community ID is missing'));
      return;
    }

    const community = await Community.findById(communityId).select('creator');

    if (!community) {
      next(new AppError(404, 'Community not found.'));
      return;
    }

    if (community.creator.toString() !== req.userId!.toString()) {
      next(new AppError(403, 'You have no access to community settings'));
      return;
    }

    req.communityId = community._id;
    next();
  } catch (error: unknown) {
    next(error);
    return;
  }
};

export const doesCommunitySettingExist = async (
  req: RequestWithCommunitySettingsType,
  _: Response,
  next: NextFunction
) => {
  try {
    const communityId = req.communityId;

    const communitySettings = await CommunitySettings.findOne({ community: communityId });
    if (!communitySettings) {
      next(new AppError(404, 'Community setting not found. You should create one'));
      return;
    }

    req.communitySettings = communitySettings;
    next();
  } catch (error: unknown) {
    next(error);
    return;
  }
};