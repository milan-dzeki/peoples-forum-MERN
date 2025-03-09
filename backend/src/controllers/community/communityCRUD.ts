import { Response, NextFunction } from 'express';
import cloudinary from 'configs/cloudinary';
import type { RequestWithUserIdType, RequestWithCommunityType } from 'types/lib';
import type { PrepareCommunityForCreateType } from 'types/controllers/community';
import { COMMUNITY_MODERATOR_REQUEST_TYPES } from 'configs/communityModeratorChangeRequests';
import catchAsync from 'utils/catchAsync';
import CommunityValidator from 'configs/validators/community/communityValidator';
import CommunityService from 'services/communityService';
import CloudinaryManagementService from 'services/cloudinaryManagementService';
import AppError from 'utils/appError';
import Community, { CommunitySchemaType } from 'models/communityModel';
import CommunitySettings from 'models/settings/communitySettingsModel';
import Chat from 'models/chatModel';
import Message from 'models/messageModel';
import CommunityActivityLog from 'models/communityActivityLogs';
import CommunityModeratorChangeRequest from 'models/communityModeratorChangeRequestModel';
import { COMMUNITY_LOG_TYPE } from 'configs/communityActivityLogs';
import CommunityModeratorChangeRequestService from 'services/communityModeratorChangeRequestsSerivce';

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
  next: NextFunction
) => {
  const { description } = req.body;

  const descriptionInvalidError = CommunityValidator.validateStringValues(description, 'description');
  if (descriptionInvalidError) {
    next(new AppError(422, descriptionInvalidError));
    return;
  } 

  const community = req.community! as CommunitySchemaType;

  const isCreator = req.isCreator!;
  const moderatorActionRequirePermission = req.moderatorActionRequirePermission!;

  if (!isCreator && moderatorActionRequirePermission) {
    const moderatorChangeRequest = await CommunityModeratorChangeRequestService.createNewModeratorRequest({
      requestType: COMMUNITY_MODERATOR_REQUEST_TYPES.UPDATE_DESCRIPTION,
      communityId: community._id,
      communityCreator: community.creator,
      moderator: req.userId!,
      requestText: `*user* (moderator) wants to change "${community.name}" community description to: "${description}"`,
      updateValues: { newDescriptionValue: description }
  });

    await CommunityActivityLog.create({
      community: community._id,
      logType: COMMUNITY_LOG_TYPE.MODERATOR_MADE_REQUESTS,
      moderator: req.userId!,
      text: `Moderator *user* made request to update community description to "${description}"`,
      moderatorRequest: moderatorChangeRequest._id
    });

    return res.status(200).json({
      status: 'success',
      message: `Request to update community description to "${description}" is sent to admin`,
      moderatorChangeRequest
    });
  }

  community.description = description;
  await community.save();

  await CommunityActivityLog.create({
    community: community._id,
    logType: COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
    moderator: req.userId!,
    text: `Moderator *user* updated community description to "${community.description}"`
  });

  return res.status(200).json({
    status: 'success',
    message: 'Community description updated successfully',
    newDescription: community.description
  });
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
    const moderatorChangeRequest = await CommunityModeratorChangeRequestService.createNewModeratorRequest({
      requestType: COMMUNITY_MODERATOR_REQUEST_TYPES.UPDATE_PROFILE_PHOTO,
      communityId: community._id,
      communityCreator: community.creator,
      moderator: req.userId!,
      requestText: `*user* (moderator) wants to change "${community.name}" community profile image.`,
      updateValues: { photo: {
        secure_url: uploadedPhotoData.secure_url,
        public_id: uploadedPhotoData.public_id
      } }
    });

    await CommunityActivityLog.create({
      community: community._id,
      logType: COMMUNITY_LOG_TYPE.MODERATOR_MADE_REQUESTS,
      moderator: req.userId!,
      text: `Moderator *user* made request to update community profile photo`,
      moderatorRequest: moderatorChangeRequest._id,
      photoUrl: uploadedPhotoData.secure_url
    });

    return res.status(200).json({
      status: 'success',
      message: 'Request to update community profile image is sent to admin.',
      moderatorChangeRequest
    });
  }

  if (community.profileImageUrl && community.profileImagePublicId) {
    await cloudinary.uploader.destroy(community.profileImagePublicId);
  }

  community.profileImageUrl = uploadedPhotoData.secure_url;
  community.profileImagePublicId = uploadedPhotoData.public_id;

  await community.save();

  await CommunityActivityLog.create({
    community: community._id,
    logType: COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
    moderator: req.userId!,
    text: 'Moderator *user* updated community profile photo'
  });

  return res.status(200).json({
    status: 'success',
    message: 'Community profile image updated successfully',
    newProfileImage: community.profileImageUrl
  });
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
    const moderatorChangeRequest = await CommunityModeratorChangeRequestService.createNewModeratorRequest({
      requestType: COMMUNITY_MODERATOR_REQUEST_TYPES.REMOVE_PROFILE_PHOTO,
      communityId: community._id,
      communityCreator: community.creator,
      moderator: req.userId!,
      requestText: `*user* (moderator) wants to remove "${community.name}" community profile image.`
    });

    await CommunityActivityLog.create({
      community: community._id,
      logType: COMMUNITY_LOG_TYPE.MODERATOR_MADE_REQUESTS,
      moderator: req.userId!,
      text: `Moderator *user* made request to remove community profile photo`,
      moderatorRequest: moderatorChangeRequest._id
    });

    return res.status(200).json({
      status: 'success',
      message: 'Request to remove community profile image is sent to admin.',
      moderatorChangeRequest
    });
  }

  community.profileImageUrl = null;
  community.profileImagePublicId = null;

  await community.save();

  await cloudinary.uploader.destroy(profileImagePublicId);

  await CommunityActivityLog.create({
    community: community._id,
    logType: COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
    moderator: req.userId!,
    text: 'Moderator *user* removed community profile photo'
  });

  return res.status(200).json({
    status: 'success',
    message: 'Community profile image removed successfully'
  });
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
    const moderatorChangeRequest = await CommunityModeratorChangeRequestService.createNewModeratorRequest({
      requestType: COMMUNITY_MODERATOR_REQUEST_TYPES.UPDATE_BANNER_PHOTO,
      communityId: community._id,
      communityCreator: community.creator,
      moderator: req.userId!,
      requestText: `*user* (moderator) wants to change "${community.name}" community banner image.`,
      updateValues: {photo: {
        secure_url: uploadedPhotoData.secure_url,
        public_id: uploadedPhotoData.public_id
      }}
    });

    await CommunityActivityLog.create({
      community: community._id,
      logType: COMMUNITY_LOG_TYPE.MODERATOR_MADE_REQUESTS,
      moderator: req.userId!,
      text: `Moderator *user* made request to change community banner photo`,
      moderatorRequest: moderatorChangeRequest._id
    });

    return res.status(200).json({
      status: 'success',
      message: 'Request to update community banner image is sent to admin.',
      moderatorChangeRequest
    });
  }

  if (community.bannerImageUrl && community.bannerImagePublicId) {
    await cloudinary.uploader.destroy(community.bannerImagePublicId);
  }

  community.bannerImageUrl = uploadedPhotoData.secure_url;
  community.bannerImagePublicId = uploadedPhotoData.public_id;

  await community.save();

  await CommunityActivityLog.create({
    community: community._id,
    logType: COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
    moderator: req.userId!,
    text: 'Moderator *user* changed community banner photo'
  });

  return res.status(200).json({
    status: 'success',
    message: 'Community banner image updated successfully',
    newProfileImage: community.bannerImageUrl
  });
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
    const moderatorChangeRequest = await CommunityModeratorChangeRequestService.createNewModeratorRequest({
      requestType: COMMUNITY_MODERATOR_REQUEST_TYPES.REMOVE_BANNER_PHOTO,
      communityId: community._id,
      communityCreator: community.creator,
      moderator: req.userId!,
      requestText: `*user* (moderator) wants to remove "${community.name}" community banner image.`
    });

    await CommunityActivityLog.create({
      community: community._id,
      logType: COMMUNITY_LOG_TYPE.MODERATOR_MADE_REQUESTS,
      moderator: req.userId!,
      text: `Moderator *user* made request to remove community banner photo`,
      moderatorRequest: moderatorChangeRequest._id
    });

    return res.status(200).json({
      status: 'success',
      message: 'Request to remove community banner image is sent to admin.',
      moderatorChangeRequest
    });
  }

  community.bannerImageUrl = null;
  community.bannerImagePublicId = null;

  await community.save();

  await cloudinary.uploader.destroy(bannerImagePublicId);

  await CommunityActivityLog.create({
    community: community._id,
    logType: COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
    moderator: req.userId!,
    text: 'Moderator *user* removed community banner photo'
  });

  return res.status(200).json({
    status: 'success',
    message: 'Community banner image removed successfully'
  });
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

  const ruleInvalidError = CommunityValidator.areRulesValid([rule]);
  if (ruleInvalidError) {
    next(new AppError(422, 'Rule data invalid', { rule: ruleInvalidError }));
    return;
  }

  const community = req.community! as CommunitySchemaType;
  const isCreator = req.isCreator!;
  const moderatorActionRequirePermission = req.moderatorActionRequirePermission!;
  
  if (!isCreator && moderatorActionRequirePermission) {
    const moderatorChangeRequest = await CommunityModeratorChangeRequestService.createNewModeratorRequest({
      requestType: COMMUNITY_MODERATOR_REQUEST_TYPES.ADD_RULE,
      communityId: community._id,
      communityCreator: community.creator,
      moderator: req.userId!,
      requestText: `*user* (moderator) wants to add new comunity rule for "${community.name}" community.`,
      updateValues: {
        newRules: [rule]
      }
    });

    await CommunityActivityLog.create({
      community: community._id,
      logType: COMMUNITY_LOG_TYPE.MODERATOR_MADE_REQUESTS,
      moderator: req.userId!,
      text: `Moderator *user* made request to add new community rule`,
      moderatorRequest: moderatorChangeRequest._id
    });

    return res.status(200).json({
      status: 'success',
      message: 'Request to add new community rule is sent to admin.',
      moderatorChangeRequest
    });
  }

  community.rules.push(rule);
  await community.save();

  await CommunityActivityLog.create({
    community: community._id,
    logType: COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
    moderator: req.userId!,
    text: 'Moderator *user* added new community rule'
  });

  return res.status(200).json({
    status: 'success',
    message: 'New Rule added successfully',
    updatedRules: community.rules
  });
});

export const updateSingleCommunityRule = catchAsync(async (
  req: RequestWithCommunityType,
  res: Response,
  next: NextFunction
) => {
  const community = req.community! as CommunitySchemaType;

  const { rule } = req.body;
  if (!rule || (rule && !rule.data && !rule.id) || (rule && rule.data && !rule.data.title)) {
    next(new AppError(422, 'Invalid rule data provided'));
    return;
  }

  const targetRuleIndex = community.rules.findIndex((oldRule) => oldRule._id.toString() === rule.id.toString());
  if (targetRuleIndex === -1) {
    next(new AppError(400, 'Rule at provided position is not found'));
    return;
  }

  const rulesInvalidError = CommunityValidator.areRulesValid([rule.data]);
  if (rulesInvalidError) {
    next(new AppError(422, 'Invalid rules data provided', { rules: rulesInvalidError }));
    return;
  }

  const isCreator = req.isCreator!;
  const moderatorActionRequirePermission = req.moderatorActionRequirePermission!;
  
  if (!isCreator && moderatorActionRequirePermission) {
    const moderatorChangeRequest = await CommunityModeratorChangeRequestService.createNewModeratorRequest({
      requestType: COMMUNITY_MODERATOR_REQUEST_TYPES.UPDATE_SINGLE_RULE,
      communityId: community._id,
      communityCreator: community.creator,
      moderator: req.userId!,
      requestText: `*user* (moderator) wants to update comunity rule for "${community.name}" community.`,
      updateValues: {
        newRules: [{
          _id: rule.id,
          ...rule.data
        }]
      }
    });

    await CommunityActivityLog.create({
      community: community._id,
      logType: COMMUNITY_LOG_TYPE.MODERATOR_MADE_REQUESTS,
      moderator: req.userId!,
      text: `Moderator *user* made request to update community rule`,
      moderatorRequest: moderatorChangeRequest._id
    });

    return res.status(200).json({
      status: 'success',
      message: 'Request to update community rule is sent to admin.',
      moderatorChangeRequest
    });
  }

  community.rules[targetRuleIndex] = {
    _id: rule.id,
    ...rule.data
  };

  await community.save();

  return res.status(200).json({
    status: 'success',
    message: `Rule #${targetRuleIndex + 1} updated successfully`,
    updatedRule: community.rules[targetRuleIndex]
  });
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

  const rulesInvalidError = CommunityValidator.areRulesValid(rules);
  if (rulesInvalidError) {
    next(new AppError(422, 'Invalid rules data provided', { rules: rulesInvalidError }));
    return;
  }

  const isCreator = req.isCreator!;
  const moderatorActionRequirePermission = req.moderatorActionRequirePermission!;
  
  if (!isCreator && moderatorActionRequirePermission) {
    const moderatorChangeRequest = await CommunityModeratorChangeRequestService.createNewModeratorRequest({
      requestType: COMMUNITY_MODERATOR_REQUEST_TYPES.UPDATE_RULES,
      communityId: community._id,
      communityCreator: community.creator,
      moderator: req.userId!,
      requestText: `*user* (moderator) wants to update comunity rules for "${community.name}" community.`,
      updateValues: {
        newRules: [...rules]
      }
    });

    await CommunityActivityLog.create({
      community: community._id,
      logType: COMMUNITY_LOG_TYPE.MODERATOR_MADE_REQUESTS,
      moderator: req.userId!,
      text: `Moderator *user* made request to update community rules`,
      moderatorRequest: moderatorChangeRequest._id
    });

    return res.status(200).json({
      status: 'success',
      message: 'Request to update community rules is sent to admin.',
      moderatorChangeRequest
    });
  }

  community.rules = rules;
  await community.save();

  return res.status(200).json({
    status: 'success',
    message: 'Community rules updated successfully',
    updatedRules: community.rules
  });
});

export const deleteSingleCommunityRule = catchAsync (async (
  req: RequestWithCommunityType,
  res: Response,
  next: NextFunction  
) => {
  const community = req.community! as CommunitySchemaType;

  const { ruleId } = req.params;
  if (!ruleId) {
    next(new AppError(400, 'Rule id not provided'));
    return;
  }

  const ruleExist = community.rules.find((rule) => rule._id.toString() === ruleId.toString());
  if (!ruleExist) {
    next(new AppError(404, 'Rule for provided id is not found'));
    return;
  }

  const isCreator = req.isCreator!;
  const moderatorActionRequirePermission = req.moderatorActionRequirePermission!;

  if (!isCreator && moderatorActionRequirePermission) {
    const moderatorChangeRequest = await CommunityModeratorChangeRequestService.createNewModeratorRequest({
      requestType: COMMUNITY_MODERATOR_REQUEST_TYPES.DELETE_SINGLE_RULE,
      communityId: community._id,
      communityCreator: community.creator,
      moderator: req.userId!,
      requestText: `*user* (moderator) wants to delete comunity rule for "${community.name}" community.`,
      updateValues: {
        deleteRuleIds: [ruleId]
      }
    });

    await CommunityActivityLog.create({
      community: community._id,
      logType: COMMUNITY_LOG_TYPE.MODERATOR_MADE_REQUESTS,
      moderator: req.userId!,
      text: `Moderator *user* made request to delete community rule`,
      moderatorRequest: moderatorChangeRequest._id
    });

    return res.status(200).json({
      status: 'success',
      message: 'Request to delete community rule is sent to admin.',
      moderatorChangeRequest
    });
  }

  community.rules = community.rules.filter((rule) => rule._id.toString() !== ruleId.toString()) as typeof community.rules;
  await community.save();

  return res.status(200).json({
    status: 'success',
    message: 'Community rule deleted successfully',
    deletedCommunityId: ruleId
  });
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
    const moderatorChangeRequest = await CommunityModeratorChangeRequestService.createNewModeratorRequest({
      requestType: COMMUNITY_MODERATOR_REQUEST_TYPES.DELETE_MULTIPLE_RULES,
      communityId: community._id,
      communityCreator: community.creator,
      moderator: req.userId!,
      requestText: `*user* (moderator) wants to delete multiple comunity rules for "${community.name}" community.`,
      updateValues: {
        deleteRuleIds: [ruleIds]
      }
    });

    await CommunityActivityLog.create({
      community: community._id,
      logType: COMMUNITY_LOG_TYPE.MODERATOR_MADE_REQUESTS,
      moderator: req.userId!,
      text: `Moderator *user* made request to delete multiple community rules`,
      moderatorRequest: moderatorChangeRequest._id
    });

    return res.status(200).json({
      status: 'success',
      message: 'Request to delete community multiple rules is sent to admin.',
      moderatorChangeRequest
    });
  }

  community.rules = community.rules.filter((rule) => !ruleIds.includes(rule._id.toString())) as typeof community.rules;
  await community.save();

  return res.status(200).json({
    status: 'success',
    message: 'Multiple community rules deleted successfully',
    updatedRules: community.rules
  });
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
    const moderatorChangeRequest = await CommunityModeratorChangeRequestService.createNewModeratorRequest({
      requestType: COMMUNITY_MODERATOR_REQUEST_TYPES.DELETE_ALL_RULES,
      communityId: community._id,
      communityCreator: community.creator,
      moderator: req.userId!,
      requestText: `*user* (moderator) wants to delete all comunity rules for "${community.name}" community.`
    });

    await CommunityActivityLog.create({
      community: community._id,
      logType: COMMUNITY_LOG_TYPE.MODERATOR_MADE_REQUESTS,
      moderator: req.userId!,
      text: `Moderator *user* made request to all multiple community rules`,
      moderatorRequest: moderatorChangeRequest._id
    });

    return res.status(200).json({
      status: 'success',
      message: 'Request to delete community all rules is sent to admin.',
      moderatorChangeRequest
    });
  }

  community.set('rules', []);
  await community.save();

  return res.status(200).json({
    status: 'success',
    message: 'All community rules successfully deleted'
  });
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

