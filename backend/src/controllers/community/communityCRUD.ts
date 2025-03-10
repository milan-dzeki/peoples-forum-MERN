import { Response, NextFunction } from 'express';
import cloudinary from 'configs/cloudinary';
import type { RequestWithUserIdType, RequestWithCommunityType } from 'types/lib';
import type { PrepareCommunityForCreateType } from 'types/controllers/community';
import { COMMUNITY_MODERATOR_REQUEST_TYPES } from 'configs/community/communityModeratorChangeRequests';
import catchAsync from 'utils/catchAsync';
import CommunityValidator from 'configs/validators/community/communityValidator';
import CommunityService from 'services/communityService';
import CloudinaryManagementService from 'services/cloudinaryManagementService';
import AppError from 'utils/appError';
import Community, { CommunitySchemaType } from 'models/communityModel';
import CommunitySettings from 'models/settings/communitySettingsModel';
import Chat from 'models/chatModel';
import Message from 'models/messageModel';
import CommunityActivityLog from 'models/communityActivityLogsModel';
import { COMMUNITY_LOG_TYPE } from 'configs/community/communityActivityLogs';
import { NOTIFICATION_TYPES } from 'configs/notifications';
import HandleSendModeratorRequestResponseActionBuilder from 'utils/builders/community/handleSendModeratorRequestResponseAction';
import HandleSendUpdateCommunityFieldRequestResponseActionBuilder from 'utils/builders/community/handleSendUpdateCommunityFieldRequestResponseAction';

export const createCommunity = catchAsync (async (
  req: RequestWithUserIdType,
  res: Response,
  next: NextFunction
) => {
  const {
    pendingInvitedModerators,
    name,
    description,
    rules,
    pendingInvitedUsers,
    chatNames
  } = req.fields  as {
    [key: string]: string | undefined;
  };

  const parsedPendingInvitedModerators = pendingInvitedModerators ? JSON.parse(pendingInvitedModerators) : [];
  const parsedRules = rules ? JSON.parse(rules) : [];
  const parsedPendingInvitedUsers = pendingInvitedUsers ? JSON.parse(pendingInvitedUsers) : [];
  const parsedChatNames = chatNames ? JSON.parse(chatNames) : [];

  const { errors } = await CommunityValidator.validateCommunityInputs({
    pendingInvitedModerators: parsedPendingInvitedModerators,
    name,
    description,
    rules: parsedRules,
    pendingInvitedUsers: parsedPendingInvitedUsers,
    chatNames: parsedChatNames
  });

  if (errors) {
    next(new AppError(422, 'Invalid Inputs', errors));
    return;
  }

  const prepareCommunity: PrepareCommunityForCreateType = {
    creator: req.userId!,
    pendingInvitedModerators: parsedPendingInvitedModerators,
    moderators: [],
    name: name!,
    description: description!,
    rules: parsedRules,
    pendingInvitedUsers: parsedPendingInvitedUsers,
    members: [],
    bannedUsers: [],
    availableChats: []
  };

  if (req.files) {
    if (req.files.profileImage) {
      const uploadedPhotoData = await CloudinaryManagementService.uploadSinglePhotoToCloudinary(req.files.profilePhotoImage);

      prepareCommunity.profileImageUrl = uploadedPhotoData.secure_url;
      prepareCommunity.profileImagePublicId = uploadedPhotoData.secure_url;
    }
    
    if (req.files.bannerImage) {
      const uploadedPhotoData = await CloudinaryManagementService.uploadSinglePhotoToCloudinary(req.files.bannerImage);

      prepareCommunity.bannerImageUrl = uploadedPhotoData.secure_url;
      prepareCommunity.bannerImagePublicId = uploadedPhotoData.secure_url;
    }
  }

  const newCommunity = await Community.create(prepareCommunity);

  const communitySettings = await CommunitySettings.create({ community: newCommunity._id });
  const communitySettingsWithVirtuals = communitySettings.toJSON({ virtuals: true })

  const chatIds = await CommunityService.createCommunityChatsUponCommunityCreation(req.userId!, newCommunity._id, parsedChatNames);
  
  newCommunity.availableChats = chatIds;
  await newCommunity.save();

  await CommunityActivityLog.create({
    community: newCommunity._id,
    logType: 'communityCreated',
    text: 'created community',
    user: req.userId!
  });

  return res.status(201).json({
    status: 'success',
    message: 'Community created successfully',
    community: newCommunity,
    communitySettings: communitySettingsWithVirtuals
  });
});

export const updateCommunityDescription = catchAsync (async (
  req: RequestWithCommunityType,
  res: Response,
  _: NextFunction
) => {
  const { description } = req.body;

  CommunityValidator.validateStringValues(description, 'description', true);

  const community = req.community! as CommunitySchemaType;

  const isCreator = req.isCreator!;
  const moderatorActionRequirePermission = req.moderatorActionRequirePermission!;

  if (!isCreator && moderatorActionRequirePermission) {
    const prepareModeratorRequestResponse = new HandleSendModeratorRequestResponseActionBuilder()
      .setCommons({ communityId: community._id, moderator: req.userId! })
      .setModeratorRequestData({
        requestType: COMMUNITY_MODERATOR_REQUEST_TYPES.UPDATE_DESCRIPTION,
        communityCreator: community.creator,
        requestText: `*user* (moderator) wants to change "${community.name}" community description to: "${description}"`,
        updateValues: { newDescriptionValue: description }
      })
      .setCommunityActivityLogData({
        logType: COMMUNITY_LOG_TYPE.MODERATOR_MADE_REQUESTS,
        text: `Moderator *user* made request to update community description to "${description}"`
      })
      .setResJson({
        res,
        message: `Request to update community description to "${description}" is sent to admin`
      });

    const moderatorRequestResponse = await prepareModeratorRequestResponse.execute();

    return moderatorRequestResponse;
  }

  const prepareUpdateResponse = new HandleSendUpdateCommunityFieldRequestResponseActionBuilder()
    .setFieldUpdateHandler(
      CommunityService.updateFieldHandlers.handleUpdateDescription.bind(
        null,
        community,
        description 
      )
    )
    .setCommunityId(community._id)
    .setCommunityActivityLogData({
      moderator: req.userId!,
      logType: COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
      text: `Moderator *user* updated community description to "${description}"`
    })
    .setModeratorsNotificationsData({
      moderators: community.moderators,
      communityCreator: community.creator,
      notificationType: NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
      text: `"${community.name}" community description was changed`,
      sender: req.userId!,
      doNotIncludeIds: [req.userId!]
    })
    .setResJson({
      res,
      message: 'Community description updated successfully'
    });

  const updateResponse = await prepareUpdateResponse.execute();

  return updateResponse;
});

export const updateCommunityProfileImage = catchAsync(async (
  req: RequestWithCommunityType,
  res: Response,
  next: NextFunction
) => {
  const reqFiles = req.files as any;
  if (
    !reqFiles || 
    (reqFiles && !reqFiles.profileImage) ||
    (reqFiles && reqFiles.profileImage && !reqFiles.profileImage.path)
  ) {
    next(new AppError(400, 'No new photo is provided'));
    return;
  }

  const community = req.community! as CommunitySchemaType;
  const isCreator = req.isCreator!;
  const moderatorActionRequirePermission = req.moderatorActionRequirePermission!;

  const uploadedPhotoData = await CloudinaryManagementService.uploadSinglePhotoToCloudinary(reqFiles.profileImage);
  
  if (!isCreator && moderatorActionRequirePermission) {
    const prepareModeratorRequestResponse = new HandleSendModeratorRequestResponseActionBuilder()
      .setCommons({ communityId: community._id, moderator: req.userId! })
      .setModeratorRequestData({
        requestType: COMMUNITY_MODERATOR_REQUEST_TYPES.UPDATE_PROFILE_PHOTO,
        communityCreator: community.creator,
        requestText: `*user* (moderator) wants to change "${community.name}" community profile image.`,
        updateValues: { photo: {
          secure_url: uploadedPhotoData.secure_url,
          public_id: uploadedPhotoData.public_id
        } }
      })
      .setCommunityActivityLogData({
        logType: COMMUNITY_LOG_TYPE.MODERATOR_MADE_REQUESTS,
        text: 'Moderator *user* made request to update community profile photo',
        photoUrl: uploadedPhotoData.secure_url
      })
      .setResJson({
        res,
        message: 'Request to update community profile image is sent to admin'
      });

    const moderatorRequestResponse = await prepareModeratorRequestResponse.execute();

    return moderatorRequestResponse;
  }

  const prepareUpdateResponse = new HandleSendUpdateCommunityFieldRequestResponseActionBuilder()
    .setResponseField('newProfilePhoto')
    .setFieldUpdateHandler(
      CommunityService.updateFieldHandlers.handleUpdateProfilePhoto.bind(
        null,
        community,
        { secure_url: uploadedPhotoData.secure_url, public_id: uploadedPhotoData.public_id }
      )
    )
    .setCommunityId(community._id)
    .setCommunityActivityLogData({
      moderator: req.userId!,
      logType: COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
      text: 'Moderator *user* updated community profile photo'
    })
    .setModeratorsNotificationsData({
      moderators: community.moderators,
      communityCreator: community.creator,
      notificationType: NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
      text: `"${community.name}" community profile photo was changed`,
      sender: req.userId!,
      doNotIncludeIds: [req.userId!]
    })
    .setResJson({
      res,
      message: 'Community profile photo updated successfully'
    });

  const updateResponse = await prepareUpdateResponse.execute();

  return updateResponse;
});

export const removeCommunityProfileImage = catchAsync(async (
  req: RequestWithCommunityType,
  res: Response,
  next: NextFunction
) => {
  const community = req.community! as CommunitySchemaType;

  const profileImagePublicId = community.profileImagePublicId;
  if (!profileImagePublicId) {
    next(new AppError(404, 'Community doesnt have profile image, so there is nothing to remove'));
    return;
  }

  const isCreator = req.isCreator!;
  const moderatorActionRequirePermission = req.moderatorActionRequirePermission!;
  
  if (!isCreator && moderatorActionRequirePermission) {
    const prepareModeratorRequestResponse = new HandleSendModeratorRequestResponseActionBuilder()
      .setCommons({ communityId: community._id, moderator: req.userId! })
      .setModeratorRequestData({
        requestType: COMMUNITY_MODERATOR_REQUEST_TYPES.REMOVE_PROFILE_PHOTO,
        communityCreator: community.creator,
        requestText: 'Moderator *user* made request to remove community profile photo'
      })
      .setCommunityActivityLogData({
        logType: COMMUNITY_LOG_TYPE.MODERATOR_MADE_REQUESTS,
        text: 'Moderator *user* made request to update community profile photo'
      })
      .setResJson({
        res,
        message: 'Request to remove community profile image is sent to admin.'
      });

    const moderatorRequestResponse = await prepareModeratorRequestResponse.execute();

    return moderatorRequestResponse;
  }

  const prepareUpdateResponse = new HandleSendUpdateCommunityFieldRequestResponseActionBuilder()
    .setFieldUpdateHandler(
      CommunityService.updateFieldHandlers.handleRemoveProfilePhoto.bind(
        null,
        community
      )
    )
    .setCommunityId(community._id)
    .setCommunityActivityLogData({
      moderator: req.userId!,
      logType: COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
      text: 'Moderator *user* removed community profile photo'
    })
    .setModeratorsNotificationsData({
      moderators: community.moderators,
      communityCreator: community.creator,
      notificationType: NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
      text: `"${community.name}" community profile photo was removed`,
      sender: req.userId!,
      doNotIncludeIds: [req.userId!]
    })
    .setResJson({
      res,
      message: 'Community profile photo removed successfully'
    });

  const updateResponse = await prepareUpdateResponse.execute();

  return updateResponse;
});

export const updateCommunityBannerImage = catchAsync(async (
  req: RequestWithCommunityType,
  res: Response,
  next: NextFunction
) => {
  const reqFiles = req.files as any;
  if (
    !reqFiles || 
    (reqFiles && !reqFiles.bannerImage) ||
    (reqFiles && reqFiles.bannerImage && !reqFiles.bannerImage.path)
  ) {
    next(new AppError(400, 'No new photo is provided'));
    return;
  }

  const community = req.community! as CommunitySchemaType;
  const isCreator = req.isCreator!;
  const moderatorActionRequirePermission = req.moderatorActionRequirePermission!;

  const uploadedPhotoData = await CloudinaryManagementService.uploadSinglePhotoToCloudinary(reqFiles.bannerImage);
  
  if (!isCreator && moderatorActionRequirePermission) {
    const prepareModeratorRequestResponse = new HandleSendModeratorRequestResponseActionBuilder()
      .setCommons({ communityId: community._id, moderator: req.userId! })
      .setModeratorRequestData({
        requestType: COMMUNITY_MODERATOR_REQUEST_TYPES.UPDATE_BANNER_PHOTO,
        communityCreator: community.creator,
        requestText: `*user* (moderator) wants to change "${community.name}" community banner image.`,
        updateValues: { photo: {
          secure_url: uploadedPhotoData.secure_url,
          public_id: uploadedPhotoData.public_id
        } }
      })
      .setCommunityActivityLogData({
        logType: COMMUNITY_LOG_TYPE.MODERATOR_MADE_REQUESTS,
        text: 'Moderator *user* made request to change community banner photo',
        photoUrl: uploadedPhotoData.secure_url
      })
      .setResJson({
        res,
        message: 'Request to update community banner image is sent to admin'
      });

    const moderatorRequestResponse = await prepareModeratorRequestResponse.execute();

    return moderatorRequestResponse;
  }

  const prepareUpdateResponse = new HandleSendUpdateCommunityFieldRequestResponseActionBuilder()
    .setResponseField('newBannerPhoto')
    .setFieldUpdateHandler(
      CommunityService.updateFieldHandlers.handleUpdateBannerPhoto.bind(
        null,
        community,
        { secure_url: uploadedPhotoData.secure_url, public_id: uploadedPhotoData.public_id }
      )
    )
    .setCommunityId(community._id)
    .setCommunityActivityLogData({
      moderator: req.userId!,
      logType: COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
      text: 'Moderator *user* updated community profile photo'
    })
    .setModeratorsNotificationsData({
      moderators: community.moderators,
      communityCreator: community.creator,
      notificationType: NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
      text: `"${community.name}" community profile photo was changed`,
      sender: req.userId!,
      doNotIncludeIds: [req.userId!]
    })
    .setResJson({
      res,
      message: 'Community profile photo updated successfully'
    });

  const updateResponse = await prepareUpdateResponse.execute();

  return updateResponse;
});

export const removeCommunityBannerImage = catchAsync(async (
  req: RequestWithCommunityType,
  res: Response,
  next: NextFunction
) => {
  const community = req.community! as CommunitySchemaType;

  const bannerImagePublicId = community.bannerImagePublicId;
  if (!bannerImagePublicId) {
    next(new AppError(404, 'Community doesnt have banner image so there is nothing to remove'));
    return;
  }

  const isCreator = req.isCreator!;
  const moderatorActionRequirePermission = req.moderatorActionRequirePermission!;
  
  if (!isCreator && moderatorActionRequirePermission) {
    const prepareModeratorRequestResponse = new HandleSendModeratorRequestResponseActionBuilder()
      .setCommons({ communityId: community._id, moderator: req.userId! })
      .setModeratorRequestData({
        requestType: COMMUNITY_MODERATOR_REQUEST_TYPES.REMOVE_BANNER_PHOTO,
        communityCreator: community.creator,
        requestText: `*user* (moderator) wants to remove "${community.name}" community banner image.`
      })
      .setCommunityActivityLogData({
        logType: COMMUNITY_LOG_TYPE.MODERATOR_MADE_REQUESTS,
        text: 'Moderator *user* made request to remove community banner photo'
      })
      .setResJson({
        res,
        message: 'Request to remove community banner image is sent to admin'
      });

    const moderatorRequestResponse = await prepareModeratorRequestResponse.execute();

    return moderatorRequestResponse;
  }

  const prepareUpdateResponse = new HandleSendUpdateCommunityFieldRequestResponseActionBuilder()
    .setFieldUpdateHandler(
      CommunityService.updateFieldHandlers.handleRemoveBannerPhoto.bind(
        null,
        community
      )
    )
    .setCommunityId(community._id)
    .setCommunityActivityLogData({
      moderator: req.userId!,
      logType: COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
      text: 'Moderator *user* removed community banner photo'
    })
    .setModeratorsNotificationsData({
      moderators: community.moderators,
      communityCreator: community.creator,
      notificationType: NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
      text: `"${community.name}" community profile banner was removed`,
      sender: req.userId!,
      doNotIncludeIds: [req.userId!]
    })
    .setResJson({
      res,
      message: 'Community profile banner removed successfully'
    });

  const updateResponse = await prepareUpdateResponse.execute();

  return updateResponse;
});

/* COMMUNITY RULES CRUD --start */
export const addNewCommunityRule = catchAsync (async (
  req: RequestWithCommunityType,
  res: Response,
  next: NextFunction  
) => {
  const { rule } = req.body;

  if (!rule || (rule && !rule.title)) {
    next(new AppError(400, 'Rule to add not provided'));
    return;
  }

  CommunityValidator.areRulesValid([rule], true);

  const community = req.community! as CommunitySchemaType;
  const isCreator = req.isCreator!;
  const moderatorActionRequirePermission = req.moderatorActionRequirePermission!;
  
  if (!isCreator && moderatorActionRequirePermission) {
    const prepareModeratorRequestResponse = new HandleSendModeratorRequestResponseActionBuilder()
      .setCommons({ communityId: community._id, moderator: req.userId! })
      .setModeratorRequestData({
        requestType: COMMUNITY_MODERATOR_REQUEST_TYPES.ADD_RULE,
        communityCreator: community.creator,
        requestText: `*user* (moderator) wants to add new comunity rule for "${community.name}" community.`,
        updateValues: {
          newRules: [rule]
        }
      })
      .setCommunityActivityLogData({
        logType: COMMUNITY_LOG_TYPE.MODERATOR_MADE_REQUESTS,
        text: 'Moderator *user* made request to add new community rule'
      })
      .setResJson({
        res,
        message: 'Request to add new community rule is sent to admin.'
      });

    const moderatorRequestResponse = await prepareModeratorRequestResponse.execute();

    return moderatorRequestResponse;
  }

  const prepareUpdateResponse = new HandleSendUpdateCommunityFieldRequestResponseActionBuilder()
    .setResponseField('newRule')
    .setFieldUpdateHandler(
      CommunityService.updateFieldHandlers.handleAddRule.bind(
        null,
        community,
        rule
      )
    )
    .setCommunityId(community._id)
    .setCommunityActivityLogData({
      moderator: req.userId!,
      logType: COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
      text: 'Moderator *user* added new community rule'
    })
    .setModeratorsNotificationsData({
      moderators: community.moderators,
      communityCreator: community.creator,
      notificationType: NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
      sender: req.userId!,
      text: `"${community.name}" community has new rule added`,
      doNotIncludeIds: [req.userId!]
    })
    .setResJson({
      res,
      message: 'New community rule added successfully'
    });

  const updateResponse = await prepareUpdateResponse.execute();

  return updateResponse;
});

export const updateSingleCommunityRule = catchAsync(async (
  req: RequestWithCommunityType,
  res: Response,
  next: NextFunction
) => {
  const community = req.community! as CommunitySchemaType;

  const { rule } = req.body;
  if (!rule || (rule && (!rule._id || !rule.title))) {
    next(new AppError(422, 'Invalid rule data provided'));
    return;
  }

  const targetRuleIndex = CommunityService.getUpdateRuleIndex(community.rules, rule);

  CommunityValidator.areRulesValid([rule], true);

  const isCreator = req.isCreator!;
  const moderatorActionRequirePermission = req.moderatorActionRequirePermission!;
  
  if (!isCreator && moderatorActionRequirePermission) {
    const prepareModeratorRequestResponse = new HandleSendModeratorRequestResponseActionBuilder()
      .setCommons({ communityId: community._id, moderator: req.userId! })
      .setModeratorRequestData({
        requestType: COMMUNITY_MODERATOR_REQUEST_TYPES.UPDATE_SINGLE_RULE,
        communityCreator: community.creator,
        requestText: `*user* (moderator) wants to update comunity rule for "${community.name}" community.`,
        updateValues: {
          newRules: [rule]
        }
      })
      .setCommunityActivityLogData({
        logType: COMMUNITY_LOG_TYPE.MODERATOR_MADE_REQUESTS,
        text: 'Moderator *user* made request to update community rule'
      })
      .setResJson({
        res,
        message: 'Request to update community rule is sent to admin.'
      });

    const moderatorRequestResponse = await prepareModeratorRequestResponse.execute();

    return moderatorRequestResponse;
  }

  const prepareUpdateResponse = new HandleSendUpdateCommunityFieldRequestResponseActionBuilder()
    .setResponseField('updatedRule')
    .setFieldUpdateHandler(
      CommunityService.updateFieldHandlers.handleUpdateSingleRule.bind(
        null,
        community,
        rule,
        targetRuleIndex
      )
    )
    .setCommunityId(community._id)
    .setCommunityActivityLogData({
      moderator: req.userId!,
      logType: COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
      text: 'Moderator *user* updated community rule'
    })
    .setModeratorsNotificationsData({
      moderators: community.moderators,
      communityCreator: community.creator,
      notificationType: NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
      sender: req.userId!,
      text: `"${community.name}" community has 1 rule updated`,
      doNotIncludeIds: [req.userId!]
    })
    .setResJson({
      res,
      message: 'Community rule updated successfully'
    });

  const updateResponse = await prepareUpdateResponse.execute();

  return updateResponse;
});

export const updateCommunityRules = catchAsync(async (
  req: RequestWithCommunityType,
  res: Response,
  next: NextFunction
) => {
  const community = req.community! as CommunitySchemaType;

  const { rules } = req.body;
  if (!rules || (rules && rules.length === 0)) {
    next(new AppError(422, 'No rules have been provided'));
    return;
  }

  CommunityValidator.areRulesValid(rules, true);

  const isCreator = req.isCreator!;
  const moderatorActionRequirePermission = req.moderatorActionRequirePermission!;
  
  if (!isCreator && moderatorActionRequirePermission) {
    const prepareModeratorRequestResponse = new HandleSendModeratorRequestResponseActionBuilder()
      .setCommons({ communityId: community._id, moderator: req.userId! })
      .setModeratorRequestData({
        requestType: COMMUNITY_MODERATOR_REQUEST_TYPES.UPDATE_RULES,
        communityCreator: community.creator,
        requestText: `*user* (moderator) wants to update comunity rules for "${community.name}" community.`,
        updateValues: {
          newRules: [...rules]
        }
      })
      .setCommunityActivityLogData({
        logType: COMMUNITY_LOG_TYPE.MODERATOR_MADE_REQUESTS,
        text: 'Moderator *user* made request to update community rules'
      })
      .setResJson({
        res,
        message: 'Request to update community rules is sent to admin.'
      });

    const moderatorRequestResponse = await prepareModeratorRequestResponse.execute();

    return moderatorRequestResponse;
  }

  const prepareUpdateResponse = new HandleSendUpdateCommunityFieldRequestResponseActionBuilder()
    .setResponseField('updatedRules')
    .setFieldUpdateHandler(
      CommunityService.updateFieldHandlers.handleUpdateCommunityRules.bind(
        null,
        community,
        rules
      )
    )
    .setCommunityId(community._id)
    .setCommunityActivityLogData({
      moderator: req.userId!,
      logType: COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
      text: 'Moderator *user* updated community rules'
    })
    .setModeratorsNotificationsData({
      moderators: community.moderators,
      communityCreator: community.creator,
      notificationType: NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
      sender: req.userId!,
      text: `"${community.name}" community rules have been updated`,
      doNotIncludeIds: [req.userId!]
    })
    .setResJson({
      res,
      message: 'Community rules updated successfully'
    });

  const updateResponse = await prepareUpdateResponse.execute();

  return updateResponse;
});

export const deleteSingleCommunityRule = catchAsync (async (
  req: RequestWithCommunityType,
  res: Response,
  _: NextFunction  
) => {
  const community = req.community! as CommunitySchemaType;

  const { ruleId } = req.params;
  CommunityService.doesRuleExist(community.rules, ruleId);

  const isCreator = req.isCreator!;
  const moderatorActionRequirePermission = req.moderatorActionRequirePermission!;

  if (!isCreator && moderatorActionRequirePermission) {
    const prepareModeratorRequestResponse = new HandleSendModeratorRequestResponseActionBuilder()
      .setCommons({ communityId: community._id, moderator: req.userId! })
      .setModeratorRequestData({
        requestType: COMMUNITY_MODERATOR_REQUEST_TYPES.DELETE_SINGLE_RULE,
        communityCreator: community.creator,
        requestText: `*user* (moderator) wants to delete comunity rule for "${community.name}" community.`,
        updateValues: {
          deleteRuleIds: [ruleId]
        }
      })
      .setCommunityActivityLogData({
        logType: COMMUNITY_LOG_TYPE.MODERATOR_MADE_REQUESTS,
        text: 'Moderator *user* made request to delete community rule'
      })
      .setResJson({
        res,
        message: 'Request to delete community rule is sent to admin.'
      });

    const moderatorRequestResponse = await prepareModeratorRequestResponse.execute();

    return moderatorRequestResponse;
  }

  const prepareUpdateResponse = new HandleSendUpdateCommunityFieldRequestResponseActionBuilder()
    .setFieldUpdateHandler(
      CommunityService.updateFieldHandlers.handleDeleteSingleRule.bind(
        null,
        community,
        ruleId
      )
    )
    .setCommunityId(community._id)
    .setCommunityActivityLogData({
      moderator: req.userId!,
      logType: COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
      text: 'Moderator *user* deleted 1 community rule'
    })
    .setModeratorsNotificationsData({
      moderators: community.moderators,
      communityCreator: community.creator,
      notificationType: NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
      sender: req.userId!,
      text: `"${community.name}" community rules have been updated`,
      doNotIncludeIds: [req.userId!]
    })
    .setResJson({
      res,
      message: 'Community rule deleted successfully'
    });

  const updateResponse = await prepareUpdateResponse.execute();

  return updateResponse;
});

export const deleteMultipleCommunityRules = catchAsync (async (
  req: RequestWithCommunityType,
  res: Response,
  next: NextFunction 
) => {
  const community = req.community! as CommunitySchemaType;

  const { ruleIds } = req.body;
  if (!ruleIds || (ruleIds && ruleIds.length === 0)) {
    next(new AppError(422, 'No rule ids are provided'));
    return;
  }

  const isCreator = req.isCreator!;
  const moderatorActionRequirePermission = req.moderatorActionRequirePermission!;

  if (!isCreator && moderatorActionRequirePermission) {
    const prepareModeratorRequestResponse = new HandleSendModeratorRequestResponseActionBuilder()
      .setCommons({ communityId: community._id, moderator: req.userId! })
      .setModeratorRequestData({
        requestType: COMMUNITY_MODERATOR_REQUEST_TYPES.DELETE_MULTIPLE_RULES,
        communityCreator: community.creator,
        requestText: `*user* (moderator) wants to delete multiple comunity rules for "${community.name}" community.`,
        updateValues: {
          deleteRuleIds: ruleIds
        }
      })
      .setCommunityActivityLogData({
        logType: COMMUNITY_LOG_TYPE.MODERATOR_MADE_REQUESTS,
        text: 'Moderator *user* made request to delete multiple community rules'
      })
      .setResJson({
        res,
        message: 'Request to delete multiple community rules is sent to admin.'
      });

    const moderatorRequestResponse = await prepareModeratorRequestResponse.execute();

    return moderatorRequestResponse;
  }

  const prepareUpdateResponse = new HandleSendUpdateCommunityFieldRequestResponseActionBuilder()
    .setFieldUpdateHandler(
      CommunityService.updateFieldHandlers.handleDeleteMultipleRules.bind(
        null,
        community,
        ruleIds
      )
    )
    .setCommunityId(community._id)
    .setCommunityActivityLogData({
      moderator: req.userId!,
      logType: COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
      text: 'Moderator *user* deleted multiple community rules'
    })
    .setModeratorsNotificationsData({
      moderators: community.moderators,
      communityCreator: community.creator,
      notificationType: NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
      sender: req.userId!,
      text: `"${community.name}" community rules have been updated`,
      doNotIncludeIds: [req.userId!]
    })
    .setResJson({
      res,
      message: 'Community rules deleted successfully'
    });

  const updateResponse = await prepareUpdateResponse.execute();

  return updateResponse;
});

export const deleteAllCommunityRules = catchAsync (async (
  req: RequestWithCommunityType,
  res: Response,
  _: NextFunction 
) => {
  const community = req.community! as CommunitySchemaType;
  const isCreator = req.isCreator!;
  const moderatorActionRequirePermission = req.moderatorActionRequirePermission!;

  if (!isCreator && moderatorActionRequirePermission) {
    const prepareModeratorRequestResponse = new HandleSendModeratorRequestResponseActionBuilder()
      .setCommons({ communityId: community._id, moderator: req.userId! })
      .setModeratorRequestData({
        requestType: COMMUNITY_MODERATOR_REQUEST_TYPES.DELETE_ALL_RULES,
        communityCreator: community.creator,
        requestText: `*user* (moderator) wants to delete all comunity rules for "${community.name}" community.`
      })
      .setCommunityActivityLogData({
        logType: COMMUNITY_LOG_TYPE.MODERATOR_MADE_REQUESTS,
        text: 'Moderator *user* made request to all multiple community rules'
      })
      .setResJson({
        res,
        message: 'Request to delete all community rules is sent to admin.'
      });

    const moderatorRequestResponse = await prepareModeratorRequestResponse.execute();

    return moderatorRequestResponse;
  }

  const prepareUpdateResponse = new HandleSendUpdateCommunityFieldRequestResponseActionBuilder()
    .setFieldUpdateHandler(
      CommunityService.updateFieldHandlers.handleDeleteAllRules.bind(
        null,
        community
      )
    )
    .setCommunityId(community._id)
    .setCommunityActivityLogData({
      moderator: req.userId!,
      logType: COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
      text: 'Moderator *user* deleted all community rules'
    })
    .setModeratorsNotificationsData({
      moderators: community.moderators,
      communityCreator: community.creator,
      notificationType: NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
      sender: req.userId!,
      text: `"${community.name}" community rules have been deleted`,
      doNotIncludeIds: [req.userId!]
    })
    .setResJson({
      res,
      message: 'All community rules deleted successfully'
    });

  const updateResponse = await prepareUpdateResponse.execute();

  return updateResponse;
});
/* COMMUNITY RULES CRUD --end */

export const deleteCommunity = catchAsync (async (
  req: RequestWithCommunityType,
  res: Response,
  next: NextFunction
) => {
  const communityToDelete = req.community!;
  if (communityToDelete.creator.toString() !== req.userId!.toString()) {
    next(new AppError(401, 'Only creator can remove delete community.'));
    return;
  }

  if (communityToDelete.bannerImagePublicId) {
    await cloudinary.uploader.destroy(communityToDelete.bannerImagePublicId);
  }

  if (communityToDelete.profileImagePublicId) {
    await cloudinary.uploader.destroy(communityToDelete.profileImagePublicId);
  }

  if (communityToDelete.availableChats) {
    for (const chatId of communityToDelete.availableChats) {
      // should delete chat images
      await Chat.deleteOne({ _id: chatId });
    }

    // should delete message images. videos, files and audios
    await Message.deleteMany({ communityId: communityToDelete._id });
  }

  await Community.deleteOne({ _id: communityToDelete._id });

  return res.status(204).json({
    status: 'success',
    message: 'Community deleted successfully together with all associated chats'
  });
});

