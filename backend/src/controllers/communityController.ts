import { Response, NextFunction } from 'express';
import type { RequestWithCommunityType, RequestWithUserIdType } from 'types/lib';
import type { BannedUserResDataType, PrepareCommunityForCreateType } from 'types/controllers/community';
import catchAsync from 'utils/catchAsync';
import cloudinary from 'configs/cloudinary';
import CommunityValidator from 'configs/validators/community/communityValidator';
import AppError from 'utils/appError';
import User from 'models/userModel';
import Community from 'models/communityModel';
import Chat from 'models/chatModel';
import CommunityService from 'services/communityService';
import CloudinaryManagementService from 'services/cloudinaryManagementService';
import Message from 'models/messageModel';
import Notification, { NotificationSchemaType } from 'models/notificationModel';

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
    status: 'success',
    message: 'Community created successfully',
    community: newCommunity
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

  const community = req.community!;

  community.description = description;
  await community.save();

  return res.status(200).json({
    status: 'success',
    message: 'Community description updated successfully',
    newDescription: community.description
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
    status: 'success',
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
    status: 'success',
    message: 'Community profile image updated successfully',
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
  _: NextFunction
) => {
  const community = req.community!;

  const bannerImagePublicId = community.bannerImagePublicId;
  community.bannerImageUrl = null;
  community.bannerImagePublicId = null;

  await community.save();

  await cloudinary.uploader.destroy(bannerImagePublicId);

  return res.status(200).json({
    status: 'success',
    message: 'Community banner image removed successfully'
  });
});

export const banUserFromCommunity = catchAsync (async (
  req: RequestWithCommunityType,
  res: Response,
  next: NextFunction
) => {
  const { userToBanId, shouldNotifyUser = false } = req.body;

  if (!userToBanId) {
    next(new AppError(400, 'User to ban ID is not provided'));
    return;
  }

  const userExist = await User.exists({ _id: userToBanId });
  if (!userExist) {
    next(new AppError(404, 'User you are trying to ban cannot be found. Maybe its account no longer exist'));
    return;
  }

  // if id is same as logged in user id - almost impossible, but why not check
  if (userToBanId.toString() === req.userId!.toString()) {
    next(new AppError(400, 'You cannot ban yourself'));
    return;
  }

  const community = req.community!;

  const userAlreadyBanned = community.bannedUsers.find((bannerUser: any) => bannerUser.toString() === userToBanId.toString());
  if (userAlreadyBanned) {
    next(new AppError(400, 'You have already banned this user - can not be done twice'));
    return;
  }

  const isUserMember = community.joinedUsers.find((joined: any) => joined.toString() === userToBanId.toString());
  const isUserInPendingMemberList = community.pendingInvitedUsers.find((pending: any) => pending.toString() === userToBanId.toString());
  const isUserInPendingModeratorList = community.pendingInvitedModerators.find((pending: any) => pending.toString() === userToBanId.toString());
  const isUserToBanModerator = community.moderators.find((moderator: any) => moderator.toString() === userToBanId.toString());

  if (!isUserMember && !isUserInPendingMemberList && !isUserInPendingModeratorList && !isUserToBanModerator) {
    next(new AppError(400, 'User you are trying to ban is not a member of community, nor is he / she in pending lists. Maybe he / she already left'));
    return;
  }

  const isBannerCommunityCreator = community.creator.toString() === req.userId!.toString();

  if (!isBannerCommunityCreator && isUserToBanModerator) {
    next(new AppError(400, 'You are trying to ban moderator of this community. Only creator can ban moderators'));
    return;
  }

  if (isUserMember) {
    community.joinedUsers = community.joinedUsers.filter((user: any) => user.toString() !== userToBanId.toString());
  }

  if (isUserInPendingMemberList) {
    community.pendingInvitedUsers = community.pendingInvitedUsers.filter((user: any) => user.toString() !== userToBanId.toString());
  }

  if (isUserInPendingModeratorList) {
    community.pendingInvitedModerators = community.pendingInvitedModerators.filter((user: any) => user.toString() !== userToBanId.toString());
  }

  community.bannedUsers.push(userToBanId);

  await community.save();

  // remove user from community chats
  if (community.availableChats && community.availableChats.length > 0) {
    await Chat.updateMany(
      {
        communityId: community._id,
        members: { $in: [userToBanId] }
      },
      { $pull: { members: userToBanId } }
    );
  }

  const responseData: BannedUserResDataType = {
    status: 'success',
    message: 'You have successfully baned user from community',
    bannedUserId: userToBanId
  };

  if (shouldNotifyUser) {
    const bannedUserNotification = await Notification.create({
      receiver: userToBanId,
      notificationType: 'bannedFromCommunity',
      text: `You have been banned from community: "${community.name}". You can no longer see this comuunity posts and chats unless admins remove ban`
    });

    responseData.bannedUserNotification = bannedUserNotification;
  }

  return res.status(200).json(responseData);
});