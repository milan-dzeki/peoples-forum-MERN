import { Response, NextFunction } from 'express';
import type { RequestWithCommunityType, RequestWithUserIdType } from 'types/lib';
import type { BannedUserResDataType, PrepareCommunityForCreateType, RemoveUserBanResDataType } from 'types/controllers/community';
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
    message: 'You have successfully banned user from community',
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

export const undoBanUserFromCommunity = catchAsync (async (
  req: RequestWithCommunityType,
  res: Response,
  next: NextFunction
) => {
  const { userToRemoveBanId, shouldNotifyUser = false, inviteUserToJoinOrModerate = null } = req.body;

  if (!userToRemoveBanId) {
    next(new AppError(400, 'User id is not provided.'));
    return;
  }

  const userExist = await User.exists({ _id: userToRemoveBanId });
  if (!userExist) {
    next(new AppError(404, 'User you are trying to un-ban cannot be found. Maybe its account no longer exist'));
    return;
  }

  const community = req.community!;

  const userInBannedList = community.bannedUsers.find((user: any) => user.toString() === userToRemoveBanId.toString());
  if (!userInBannedList) {
    next(new AppError(400, 'User you are trying to un-ban is not in banned users list. You cannot un-ban user that is not banned'));
    return;
  }

  community.bannedUsers = community.bannedUsers.filter((user: any) => user.toString() !== userToRemoveBanId.toString());

  const responseData: RemoveUserBanResDataType = {
    status: 'success',
    message: 'You have successfully removed ban for user',
    userRemovedBanId: userToRemoveBanId 
  };

  if (shouldNotifyUser) {
    const userRemovedBanNotifications = await Notification.create({
      receiver: userToRemoveBanId,
      notificationType: 'removeCommunityBan',
      text: `Your ban from community: "${community.name}" has been removed. You can see this communities posts and chats now.`,
      community: community._id
    });

    responseData.userRemovedBanNotifications = [userRemovedBanNotifications];
  }

  if (
    inviteUserToJoinOrModerate &&
    (inviteUserToJoinOrModerate === 'member' || inviteUserToJoinOrModerate === 'moderator')
  ) {
    const notificationData = {
      receiver: userToRemoveBanId,
      notificationType: inviteUserToJoinOrModerate === 'member' ? 'becomeCommunityMemberRequest' : 'becomeCommunityModeratorRequest',
      text: `You have been invited to become ${inviteUserToJoinOrModerate} in "${community.name}" community.`,
      community: community._id
    };

    if (inviteUserToJoinOrModerate === 'member') {
      community.pendingInvitedUsers.push(userToRemoveBanId);
    }

    if (inviteUserToJoinOrModerate === 'moderator') {
      community.pendingInvitedModerators.push(userToRemoveBanId);
    }

    const inviteNotification = await Notification.create(notificationData);
    
    if (responseData.userRemovedBanNotifications) {
      responseData.userRemovedBanNotifications.push(inviteNotification);
    } else {
      responseData.userRemovedBanNotifications = [inviteNotification];
    }
  }

  await community.save();

  return res.status(200).json(responseData);
});

export const inviteUserToJoinCommunity = catchAsync (async (
  req: RequestWithCommunityType,
  res: Response,
  next: NextFunction
) => {
  const { userToInviteId, inviteType } = req.body;

  if (!userToInviteId) {
    next(new AppError(400, 'User ID for invitation is not provided'));
    return;
  }

  if (!inviteType || (inviteType && inviteType !== 'member' && inviteType !== 'moderator')) {
    next(new AppError(400, 'User invitation type must be either "member" or "moderator"'));
    return;
  }

  const userExist = await User.exists({ _id: userToInviteId });
  if (!userExist) {
    next(new AppError(404, `User you are trying to invite as ${inviteType} doesnt exist. Maybe its account was deleted.`));
    return;
  }

  const community = req.community!;

  const userBanned = community.bannedUsers.find((user: any) => user.toString() === userToInviteId.toString());
  if (userBanned) {
    next(new AppError(400, `You are trying to invite BANNED user to join as ${inviteType}. Remove ban first and then proceed.`));
    return;
  }

  const userAlreadyInvitedAsMember = community.pendingInvitedUsers.find((user: any) => user.toString() === userToInviteId.toString());
  const userAlreadyInvitedAsModerator = community.pendingInvitedModerators.find((user: any) => user.toString() === userToInviteId.toString());

  if (userAlreadyInvitedAsMember) {
    next(new AppError(400, 'You have already invitied this user to join as member. Only 1 invitation is allowed per user.'));
    return;
  }
  if (userAlreadyInvitedAsModerator) {
    next(new AppError(400, 'You have already invitied this user to join as moderator. Only 1 invitation is allowed per user.'));
    return;
  }

  const userAlreadyMember = community.joinedUsers.find((user: any) => user.toString() === userToInviteId.toString());
  const userAlreadyModerator = community.moderators.find((user: any) => user.toString() === userToInviteId.toString());

  if (inviteType === 'member' && userAlreadyMember) {
    next(new AppError(400, 'This user is already a member of this community.'));
    return;
  }
  if (userAlreadyModerator) {
    next(new AppError(400, 'This user is already a moderator of this community.'));
    return;
  }

  let responseDataMessage = '';

  // if user is member he can be invited as moderator
  if (inviteType === 'moderator') {
    community.pendingInvitedModerators.push(userToInviteId);

    if (userAlreadyMember) {
      responseDataMessage = 'You have invited joined member to become moderator of this community successfully';
    } else {
      responseDataMessage = 'You have invited user to become moderator of this community successfully';
    }
  } else if(inviteType === 'member') {
    responseDataMessage = 'You have invited user join this community successfully';
    community.pendingInvitedUsers.push(userToInviteId);
  }

  await community.save();

  const inviteUserNotification = await Notification.create({
    receiver: userToInviteId,
    notificationType: inviteType === 'moderator' ? 'becomeCommunityModeratorRequest' : 'becomeCommunityMemberRequest',
    text: `You have been invited to become ${inviteType} of "${community.name}"${userAlreadyMember ? ' community where you are already a member.' : '.'}`,
    community: community._id
  });

  return res.status(200).json({
    status: 'success',
    message: responseDataMessage,
    userToInviteId,
    inviteUserNotification
  });
});

export const moderatorWithdrawJoinCommunityInviteForUser = catchAsync (async (
  req: RequestWithCommunityType,
  res: Response,
  next: NextFunction
) => {
  const { userToWithdrawInviteId, inviteType } = req.body;

  if (!userToWithdrawInviteId) {
    next(new AppError(400, 'User ID for withdrwaing invitation is not provided'));
    return;
  }

  if (!inviteType || (inviteType && inviteType !== 'member' && inviteType !== 'moderator')) {
    next(new AppError(400, 'User widthraw invitation type must be either "member" or "moderator"'));
    return;
  }

  const userExist = await User.exists({ _id: userToWithdrawInviteId });
  if (!userExist) {
    next(new AppError(404, `User you are trying to invite as ${inviteType} doesnt exist. Maybe its account was deleted.`));
    return;
  }

  const community = req.community!;

  if (inviteType === 'member') {
    const isUserInPendingMembersList = community.pendingInvitedUsers.find((user: any) => user.toString() === userToWithdrawInviteId.toString());

    if (!isUserInPendingMembersList) {
      next(new AppError(400, 'User in not found in pending invite list. Maybe he / she has declined request in the meantime'));
      return;
    }

    community.pendingInvitedUsers = community.pendingInvitedUsers.filter((user: any) => user.toString() !== userToWithdrawInviteId.toString());
  }

  if (inviteType === 'moderator') {
    const isUserInPendingModeratorsList = community.pendingInvitedModerators.find((user: any) => user.toString() === userToWithdrawInviteId.toString());

    if (!isUserInPendingModeratorsList) {
      next(new AppError(400, 'User in not found in pending invite moderator list. Maybe he / she has declined request in the meantime'));
      return;
    }

    community.pendingInvitedModerators = community.pendingInvitedModerators.filter((user: any) => user.toString() !== userToWithdrawInviteId.toString());
  }

  await community.save();

  return res.status(200).json({
    status: 'success',
    message: `You have successfully withdrew ${inviteType} invite for user`,
    userToWithdrawInviteId
  });
});