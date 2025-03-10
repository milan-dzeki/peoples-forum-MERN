import { NextFunction, Response } from 'express';
import { RequestWithCommunityType } from 'types/lib';
import Community, { CommunitySchemaType } from 'models/communityModel';
import AppError from 'utils/appError';
import User from 'models/userModel';
import CommunitySettings from 'models/settings/communitySettingsModel';
import { CommunityListType, CommunityPermissionNameType, UserExistInListsType } from 'types/controllers/community';
import { COMMUNITY_LIST_RESPONSE_NAMES } from 'configs/community/community';

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

export const isUserCommunityCreator = async (
  req: RequestWithCommunityType,
  _: Response,
  next: NextFunction
) => {
  try {
    if (req.userId!.toString() !== req.community!.creator.toString()) {
      next(new AppError(403, 'Only community creator is permitted to perform this action.'));
      return;
    }

    next();
  } catch (error: unknown) {
    next(error);
    return;
  }
};

export const havePermissionToPerformAction = (permissionName: CommunityPermissionNameType, creatorPermittedOnly?: boolean) => {
  return async (
    req: RequestWithCommunityType,
    _: Response,
    next: NextFunction
  ) => {
    try {
      const community = req.community! as CommunitySchemaType;
      const isCreator = community.creator.toString() == req.userId!.toString();

      if (creatorPermittedOnly && !isCreator) {
        next(new AppError(401, 'Action dennied: Only community creator is permitted to perform this action.'));
        return;
      }
      // if user is creator go next because creator has all permissions
      if (isCreator) {
        req.isCreator = true;
        next();
        return;
      }

      let allowedToProceed = false;

      if (!permissionName) {
        next(new AppError(400, 'Cannot find permission for this action.'));
        return;
      }
    
      // if user is not creator or moderator denny access
      const moderators: string[] = community.moderators.map((moderator) => moderator.user.toString());
      
      if (!isCreator && !moderators.includes(req.userId!.toString())) {
        next(new AppError(401, 'Only moderators and creator can update community data'));
        return;
      }

      // if fails to find settings throw error
      const communitySettingsModeratorPermissions = await CommunitySettings.findOne({ community: community._id }).select('moderators_settings -_id');
      
      if (!communitySettingsModeratorPermissions || !communitySettingsModeratorPermissions.moderators_settings?.moderatorPermissions?.value) {
        next(new AppError(404, 'Cannot access community settings. Try updating settings and save changes.'));
        return;
      }

      // if permission exists for all moderators in community schema, allow action
      const permissionGratnedForAllModerators = communitySettingsModeratorPermissions.moderators_settings.moderatorPermissions.value.includes(permissionName);
      if (permissionGratnedForAllModerators) {
        allowedToProceed = true;
      }
      
      // if permission exists for current user / moderator, allow action
      const targetModeratorPermissions = community.moderators.find((moderator) => moderator.user.toString() === req.userId!.toString())!.customPermissions;
      const permissionGrantedForTargetModerator = targetModeratorPermissions.includes(permissionName);
      
      if (permissionGrantedForTargetModerator) {
        allowedToProceed = true;
      }

      if (!allowedToProceed) {
        next(new AppError(401, 'You dont have permission to perform this action'));
        return;
      }

      req.communitySettings = communitySettingsModeratorPermissions;
      req.isCreator = isCreator;
      next();
    } catch (error: unknown) {
      next(error);
      return;
    }
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

const getIsInListsInfo = (userId: string, community: CommunitySchemaType) => {
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
    members: {
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
    const isInList = community[list as keyof CommunitySchemaType].find((user: any) => user.user.toString() === userId.toString());
    if (isInList) {
        listInfo[list as keyof typeof listInfo].exists = true;
      }
  });

  return listInfo;
}

/*
  this is for community requests where moderator manage users
  user is got in request body
*/
export const isTargetUserAlreadyInLists = async (
  req: RequestWithCommunityType,
  _: Response,
  next: NextFunction
) => {
  try {
    const community = req.community! as CommunitySchemaType;

    const { targetUserId } = req.body;

    const listInfo = getIsInListsInfo(targetUserId, community);

    req.existInLists = listInfo;
    next();
  } catch (error: unknown) {
    next(error);
    return
  }
};

/*
  this is for community requests where logged in users manage actions
  accepting / declining invitations got by communities etc
*/
export const isRequestUserAlreadyInLists = async (
  req: RequestWithCommunityType,
  _: Response,
  next: NextFunction
) => {
  try {
    const community = req.community! as CommunitySchemaType;

    const userId = req.userId!;

    const listInfo = getIsInListsInfo(userId, community);

    req.existInLists = listInfo;
    next();
  } catch (error: unknown) {
    next(error);
    return
  }
};

export const changesByModeratorRequireAdminApproval = async (
  req: RequestWithCommunityType,
  _: Response,
  next: NextFunction
) => {
  try {
    const communitySettings = req.communitySettings!;

    if (!communitySettings) {
      req.moderatorActionRequirePermission = false;
    } else {
      req.moderatorActionRequirePermission = communitySettings.moderators_settings!.changesByModeratorRequireApproval!.value;
    }
    
    next();
  } catch (error: unknown) {
    next(error);
    return;
  }
};

export const isTargetUserInTargetList = (listName: CommunityListType) => {
  return (
    req: RequestWithCommunityType,
    _: Response,
    next: NextFunction
  ) => {
    const { targetUserId } = req.body;
    const community = req.community!;

    const isInList = community[listName].find((user) => user.user!.toString() === targetUserId.toString());
    if (isInList) {
      next(new AppError(400, `User is already in ${COMMUNITY_LIST_RESPONSE_NAMES[listName]} list`));
      return;
    }

    next();
  };
};

export const isNotInRequiredList = (listName: CommunityListType) => {
  return (
    req: RequestWithCommunityType,
    _: Response,
    next: NextFunction
  ) => {
    const { targetUserId } = req.body;
    const community = req.community!;

    const isInList = community[listName].find((user) => user.user!.toString() === targetUserId.toString());
    if (!isInList) {
      next(new AppError(400, `User is no found in ${COMMUNITY_LIST_RESPONSE_NAMES[listName]} list. Maybe request was removed.`));
      return;
    }

    next();
  };
};