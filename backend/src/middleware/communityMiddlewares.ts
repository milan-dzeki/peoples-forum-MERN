import { NextFunction, Response } from 'express';
import { RequestWithCommunityType } from 'types/lib';
import Community, { CommunitySchemaType } from 'models/communityModel';
import AppError from 'utils/appError';
import User from 'models/userModel';
import CommunitySettings from 'models/settings/communitySettingsModel';
import { UserExistInListsType } from 'types/controllers/community';

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

export const havePermissionToPerformAction = async (
  req: RequestWithCommunityType,
  _: Response,
  next: NextFunction
) => {
  try {
    const community = req.community! as CommunitySchemaType;
    const isCreator = community.creator.toString() == req.userId!.toString();
    // if user is creator go next because creator has all permissions
    if (isCreator) {
      req.isCreator = true;
      next();
      return;
    }

    let allowedToProceed = false;
    const permissionNameInBody = req.body.permissionName;
    const permissionNameInFields = req.fields?.permissionName as string | undefined;
    const permissionName = permissionNameInBody || permissionNameInFields;

    if (!permissionName) {
      next(new AppError(400, 'Cannot find permission for this action.'));
      return;
    }
    
    // if user is not creator or moderator denny access
    const moderators: string[] = community.moderators.map((moderator) => moderator.user.toString());
    
    if (!isCreator && !moderators.includes(req.userId!.toString())) {
      next(new AppError(401, 'Only moderators and crator can update community data'));
      return;
    }

    // if fails to find settings throw error
    const communitySettingsModeratorPermissions = await CommunitySettings.findOne({ community: community._id }).select('moderators_settings.moderatorPermissions -_id');
    
    if (!communitySettingsModeratorPermissions || !communitySettingsModeratorPermissions.moderators_settings?.moderatorPermissions?.value) {
      next(new AppError(404, 'Cannoot access community settings. Try updating settings and save changes.'));
      return;
    }

    // if permission exists for all moderators in community schema, allow action
    const permissionGratnedForAllModerators = communitySettingsModeratorPermissions.moderators_settings.moderatorPermissions.value.includes(permissionName);
    if (permissionGratnedForAllModerators) {
      allowedToProceed = true;
    }
    
    // f permission exists for current user / moderator, allow action
    const targetModeratorPermissions = community.moderators.find((moderator) => moderator.user.toString() === req.userId!.toString())!.customPermissions;
    const permissionGrantedForTargetModerator = targetModeratorPermissions.includes(permissionName);
    console.log('mod', targetModeratorPermissions, permissionGrantedForTargetModerator);
    if (permissionGrantedForTargetModerator) {
      allowedToProceed = true;
    }

    if (!allowedToProceed) {
      next(new AppError(401, 'You dont have permission to perform this action'));
      return;
    }

    req.isCreator = isCreator;
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

export const isTargetUserLoggedInUser = async (
  req: RequestWithCommunityType,
  _: Response,
  next: NextFunction
) => {
  try { 
    const { targetUserId } = req.body;

    if (targetUserId.toString() === req.userId!.toString()) {
      next(new AppError(400, 'You cannot manage your community roles for yourself.'));
      return;
    }

    next();
  } catch (error: unknown) {
    next(error);
    return;
  }
};

export const isTargetUserAlreadyInLists = async (
  req: RequestWithCommunityType,
  _: Response,
  next: NextFunction
) => {
  try {
    const community = req.community! as CommunitySchemaType;

    const { targetUserId } = req.body;

    const listInfo: UserExistInListsType = {
      pendingInvitedModerators: {
        exists: false,
        alias: 'pending invited moderators list'
      },
      moderators: {
        exists: false,
        alias: 'moderator list'
      },
      pendingInvitedUsers: {
        exists: false,
        alias: 'pending invited members list'
      },
      joinedUsers: {
        exists: false,
        alias: 'members list'
      },
      bannedUsers: {
        exists: false,
        alias: 'banned list'
      },
      userJoinRequests: {
        exists: false,
        alias: 'requested to join list'
      }
    };

    Object.keys(listInfo).forEach((list) => {
      if (list !== 'moderators') {
        const isInList = community[list as keyof CommunitySchemaType]
          .find((user: any) => user.toString() === targetUserId.toString());

        if (isInList) {
          listInfo[list as keyof typeof listInfo].exists = true;
        }
      }
    });

    const existsInModeratorList = community.moderators.find((moderator) => moderator.user.toString() === targetUserId.toString());
    if (existsInModeratorList) {
      listInfo.moderators.exists = true;
    }

    req.existInLists = listInfo;
    next();
  } catch (error: unknown) {
    next(error);
    return
  }
};