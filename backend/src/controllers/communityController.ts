import { Response, NextFunction } from 'express';
import type { RequestWithCommunityType, RequestWithUserIdType } from 'types/lib';
import type { PrepareCommunityForCreateType } from 'types/controllers/community';
import catchAsync from 'utils/catchAsync';
import cloudinary from 'configs/cloudinary';
import CommunityValidator from 'configs/validators/community/communityValidator';
import AppError from 'utils/appError';
import Community from 'models/communityModel';
import Chat from 'models/chatModel';
import CommunityService from 'services/communityService';
import CloudinaryManagementService from 'services/cloudinaryManagementService';
import Message from 'models/messageModel';

export const createCommunity = catchAsync (async (
  req: RequestWithUserIdType,
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

  const parsedPendingInvitedModerators = pendingInvitedModerators ? JSON.parse(pendingInvitedModerators) : [];
  const parsedRules = rules ? JSON.parse(rules) : [];
  const parsedPendingInvitedUsers = pendingInvitedUsers ? JSON.parse(pendingInvitedUsers) : [];
  const parsedChatNames = chatNames ? JSON.parse(chatNames) : [];

  const { errors } = await CommunityValidator.validateCommunityInputs({
    pendingInvitedModerators: parsedPendingInvitedModerators,
    access,
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
    access: access! as 'public' | 'private',
    name: name!,
    description: description!,
    rules: parsedRules,
    pendingInvitedUsers: parsedPendingInvitedUsers,
    joinedUsers: [],
    bannedUsers: []
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

  const chatIds = await CommunityService.createCommunityChatsUponCommunityCreation(req.userId!, newCommunity._id, parsedChatNames);
  
  newCommunity.availableChats = chatIds;
  await newCommunity.save();

  return res.status(201).json({
    status: 'Community created successfully',
    community: newCommunity
  });
});

export const deleteCommunity = catchAsync (async (
  req: RequestWithCommunityType,
  res: Response,
  _: NextFunction
) => {
  const communityToDelete = req.community!;

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
    message: 'Community deleted successfully together with all associated chats'
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

  const community = req.community!;

  if (community.profileImageUrl && community.profileImagePublicId) {
    await cloudinary.uploader.destroy(community.profileImagePublicId);
  }

  const uploadedPhotoData = await CloudinaryManagementService.uploadSinglePhotoToCloudinary(reqFiles.profileImage);

  community.profileImageUrl = uploadedPhotoData.secure_url;
  community.profileImagePublicId = uploadedPhotoData.public_id;

  await community.save();

  return res.status(200).json({
    status: 'Community profile image updated successfully',
    newProfileImage: community.profileImageUrl
  });
});

export const removeCommunityProfileImage = catchAsync(async (
  req: RequestWithCommunityType,
  res: Response,
  _: NextFunction
) => {
  const community = req.community!;

  const profileImagePublicId = community.profileImagePublicId;
  community.profileImageUrl = null;
  community.profileImagePublicId = null;

  await community.save();

  await cloudinary.uploader.destroy(profileImagePublicId);

  return res.status(200).json({
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
    status: 'Community banner image updated successfully',
    newProfileImage: community.bannerImageUrl
  });
});

export const removeCommunityBannerImage = catchAsync(async (
  req: RequestWithCommunityType,
  res: Response,
  _: NextFunction
) => {
  const community = req.community!;

  const bannerImagePublicId = community.bannerImagePublicId;
  community.bannerImageUrl = null;
  community.bannerImagePublicId = null;

  await community.save();

  await cloudinary.uploader.destroy(bannerImagePublicId);

  return res.status(200).json({
    message: 'Community banner image removed successfully'
  });
});