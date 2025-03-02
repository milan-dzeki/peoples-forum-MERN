import { NextFunction, Response } from 'express';
import { RequestWithCommunityType } from 'types/lib';
import Community from 'models/communityModel';
import AppError from 'utils/appError';
import User from 'models/userModel';

export const doesCommunityExist = async (
  req: RequestWithCommunityType,
  _: Response,
  next: NextFunction
) => {
  try {
    const { communityId } = req.params;
    if (!communityId) {
      next(new AppError(400, 'Community ID is missing'));
      return;
    }

    const community = await Community.findById(communityId).select('+profileImagePublicId +bannerImagePublicId');

    if (!community) {
      next(new AppError(404, 'Community not found.'));
      return;
    }

    req.community = community;
    next();
  } catch (error: unknown) {
    next(error);
    return;
  }
};

export const isLoggedUserCommunityCreatorOrModerator = async (
  req: RequestWithCommunityType,
  _: Response,
  next: NextFunction
) => {
  try {
    const community = req.community!;
    
    const moderators: string[] = community.moderators.map((moderator: any) => moderator.toString());
    if (community.creator.toString() !== req.userId!.toString() && !moderators.includes(req.userId!.toString())) {
      next(new AppError(401, 'Only moderators and crator can update community data'));
      return;
    }

    next();
  } catch (error: unknown) {
    next(error);
    return;
  }
};

export const checkIfTargetUserExist = async (
  req: RequestWithCommunityType,
  _: Response,
  next: NextFunction
) => {
  try {
    const { targetUserId } = req.body;

    if (!targetUserId) {
      next(new AppError(400, 'User ID is not provided. Cannot proceed without user ID'));
      return;
    }

    const userExists = await User.exists({ _id: targetUserId });
    if (!userExists) {
      next(new AppError(404, 'User with provided data is not found. Maybe its account was removed from network. Try refreshing the page'));
      return;
    }

    next();
  } catch (error: unknown) {
    next(error);
    return;
  }
};