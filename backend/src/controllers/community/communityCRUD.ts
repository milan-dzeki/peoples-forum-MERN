import { Response, NextFunction } from 'express';
import cloudinary from 'configs/cloudinary';
import type { RequestWithUserIdType, RequestWithCommunityType } from 'types/lib';
import type { PrepareCommunityForCreateType } from 'types/controllers/community';
import catchAsync from 'utils/catchAsync';
import CommunityValidator from 'configs/validators/community/communityValidator';
import CommunityService from 'services/communityService';
import CloudinaryManagementService from 'services/cloudinaryManagementService';
import AppError from 'utils/appError';
import Community, { CommunitySchemaType } from 'models/communityModel';
import CommunitySettings from 'models/settings/communitySettingsModel';
import Chat from 'models/chatModel';
import Message from 'models/messageModel';

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

  community.description = description;
  await community.save();

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

  if (community.profileImageUrl && community.profileImagePublicId) {
    await cloudinary.uploader.destroy(community.profileImagePublicId);
  }

  const uploadedPhotoData = await CloudinaryManagementService.uploadSinglePhotoToCloudinary(reqFiles.profileImage);

  community.profileImageUrl = uploadedPhotoData.secure_url;
  community.profileImagePublicId = uploadedPhotoData.public_id;

  await community.save();

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
  community.profileImageUrl = null;
  community.profileImagePublicId = null;

  await community.save();

  await cloudinary.uploader.destroy(profileImagePublicId);

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
  const community = req.community!;

  const reqFiles = req.files as any;
  if (
    !reqFiles || 
    (reqFiles && !reqFiles.bannerImage) ||
    (reqFiles && reqFiles.bannerImage && !reqFiles.bannerImage.path)
  ) {
    next(new AppError(400, 'No new photo is provided'));
    return;
  }

  if (community.bannerImageUrl && community.bannerImagePublicId) {
    await cloudinary.uploader.destroy(community.bannerImagePublicId);
  }

  const uploadedPhotoData = await CloudinaryManagementService.uploadSinglePhotoToCloudinary(reqFiles.bannerImage);

  community.bannerImageUrl = uploadedPhotoData.secure_url;
  community.bannerImagePublicId = uploadedPhotoData.public_id;

  await community.save();

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
  community.bannerImageUrl = null;
  community.bannerImagePublicId = null;

  await community.save();

  await cloudinary.uploader.destroy(bannerImagePublicId);

  return res.status(200).json({
    status: 'success',
    message: 'Community banner image removed successfully'
  });
});

export const addNewCommunityRule = catchAsync (async (
  req: RequestWithCommunityType,
  res: Response,
  next: NextFunction  
) => {
  const community = req.community! as CommunitySchemaType;
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

  community.rules.push(rule);
  await community.save();

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

  const targetRuleIndex = community.rules.findIndex((rule) => rule._id.toString() === rule.id.toString());
  if (targetRuleIndex === -1) {
    next(new AppError(400, 'Rule at provided position is not found'));
  }

  const rulesInvalidError = CommunityValidator.areRulesValid([rule.data]);
  if (rulesInvalidError) {
    next(new AppError(422, 'Invalid rules data provided', { rules: rulesInvalidError }));
    return;
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
  community.set('rules', []);
  await community.save();

  return res.status(200).json({
    status: 'success',
    message: 'All community rules successfully deleted'
  });
});

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

