import { Response, NextFunction } from 'express';
import type { RequestWithCommunityType } from 'types/lib';
import type { BannedUserResDataType, RemoveUserBanResDataType } from 'types/controllers/community';
import CommunityService from 'services/communityService';
import catchAsync from 'utils/catchAsync';
import AppError from 'utils/appError';
import User from 'models/userModel';
import Chat from 'models/chatModel';
import Notification from 'models/notificationModel';

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

  if (isUserToBanModerator) {
    if (!isBannerCommunityCreator) {
      next(new AppError(400, 'You are trying to ban moderator of this community. Only creator can ban moderators'));
      return;
    }
    
    community.moderators = community.moderators.filter((user: any) => user.toString() !== userToBanId.toString());
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

  // remove user from community chats
  await CommunityService.removeUserFromAllCommunityChats(community._id, community.availableChats.length, userToBanId, 'Failed to remove banned user from chats');

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

  await community.save();

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

export const userAcceptJoinCommunityInvite = catchAsync (async (
  req: RequestWithCommunityType,
  res: Response,
  next: NextFunction
) => {
  const { inviteType } = req.params;

  if (!inviteType || (inviteType && inviteType !== 'member' && inviteType !== 'moderator')) {
    next(new AppError(400, 'User invitation type must be either "member" or "moderator"'));
    return;
  }

  const userId = req.userId!;
  const community = req.community!;

  if (community.creator.toString() === userId.toString()) {
    next(new AppError(400, `You are creator of "${community.name}", so if you have invites for it, we have a bug in application :).`));
    return;
  }

  const isAlreadyMember = community.joinedUsers.find((user: any) => user.toString() === userId.toString());

  if (inviteType === 'member' && isAlreadyMember) {
    next(new AppError(400, `You are already a member of "${community.name}". Try refreshing the page`));
    return;
  }
  
  const isAlreadyModerator = community.moderators.find((user: any) => user.toString() === userId.toString());

  if (isAlreadyModerator) {
    next(new AppError(400, `You are already a moderator of "${community.name}". Try refreshing the page`));
    return;
  }

  const isInPendingMemberList = community.pendingInvitedUsers.find((user: any) => user.toString() === userId.toString());

  if (inviteType === 'member' && !isInPendingMemberList) {
    next(new AppError(400, `There seems to be missing invitation for joining "${community.name}" as member. Maybe admins have withdrew it.`));
    return;
  }

  const isInPendingModeratorList = community.pendingInvitedModerators.find((user: any) => user.toString() === userId.toString());

  if (inviteType === 'moderator' && !isInPendingModeratorList) {
    next(new AppError(400, `There seems to be missing invitation for joining "${community.name}" as moderator. Maybe admins have withdrew it.`));
    return;
  }

  if (inviteType === 'member' && isInPendingMemberList) {
    community.pendingInvitedUsers = community.pendingInvitedUsers.filter((user: any) => user.toString() !== userId.toString());
    community.joinedUsers.push(userId);
  }

  if (inviteType === 'moderator' && isInPendingModeratorList) {
    community.pendingInvitedModerators = community.pendingInvitedModerators.filter((user: any) => user.toString() !== userId.toString());
    community.moderators.push(userId);

    // if user was regular member before
    if (isAlreadyMember) {
      community.joinedUsers = community.joinedUsers.filter((user: any) => user.toString() !== userId.toString());
    }
  }

  const user = await User.findById(userId).select('_id fullName');

  const moderatorNotifictaions = [
    {
      receiver: community.creator,
      notificationType: inviteType === 'member' ? 'userAcceptedCommunityMemberInvite' : 'userAcceptedCommunityModeratorInvite',
      text: `${user.fullName} has accepted to join as ${inviteType} "${community.name}" community that you manage`,
      community: community._id,
      sender: user._id
    }
  ];

  req.community!.moderators.forEach((moderator: any) => {
    moderatorNotifictaions.push({
      receiver: moderator,
      notificationType: inviteType === 'member' ? 'userAcceptedCommunityMemberInvite' : 'userAcceptedCommunityModeratorInvite',
      text: `${user.fullName} has accepted to join as ${inviteType} "${community.name}" community that you manage`,
      community: community._id,
      sender: user._id
    });
  });

  await community.save();

  const notificationsToSendToCommunityModerators = await Notification.insertMany(moderatorNotifictaions);

  return res.status(200).json({
    status: 'success',
    message: `Accepted invite to become ${inviteType} of "${community.name}" community`,
    notificationsToSendToCommunityModerators
  });
});

export const userDeclineJoinCommunityInvite = catchAsync (async (
  req: RequestWithCommunityType,
  res: Response,
  next: NextFunction
) => {
  const { inviteType } = req.params;

  if (!inviteType || (inviteType && inviteType !== 'member' && inviteType !== 'moderator')) {
    next(new AppError(400, 'User invitation type must be either "member" or "moderator"'));
    return;
  }

  const userId = req.userId!;
  const community = req.community!;

  const isInPendingMemberList = community.pendingInvitedUsers.find((user: any) => user.toString() === userId.toString());
  if (inviteType === 'member' && !isInPendingMemberList) {
    next(new AppError(400, `There seems to be missing invitation for joining "${community.name}". Maybe admins have withdrew it.`));
    return;
  }

  const isInPendingModeratorList = community.pendingInvitedModerators.find((user: any) => user.toString() === userId.toString());

  if (inviteType === 'moderator' && !isInPendingModeratorList) {
    next(new AppError(400, `There seems to be missing invitation for joining "${community.name}" as moderator. Maybe admins have withdrew it.`));
    return;
  }

  if (inviteType === 'member') {
    community.pendingInvitedUsers = community.pendingInvitedUsers.filter((user: any) => user.toString() !== userId.toString());
  }

  if (inviteType === 'moderator') {
    community.pendingInvitedModerators = community.pendingInvitedModerators.filter((user: any) => user.toString() !== userId.toString());
  }

  await community.save();

  return res.status(200).json({
    status: 'success',
    message: `Invitation to join "${community.name}" community as ${inviteType} declined successfully.`
  });
});

export const userLeaveCommunity = catchAsync (async (
  req: RequestWithCommunityType,
  res: Response,
  next: NextFunction
) => {
  const { communityRole } = req.params;

  if (!communityRole || (communityRole && communityRole !== 'member' && communityRole !== 'moderator')) {
    next(new AppError(400, 'Invalid community role provided: must be either "member" or "moderator"'));
    return;
  }

  const userId = req.userId!;
  const community = req.community!;

  
  if (communityRole === 'member') {
    const isMember = community.joinedUsers.find((user: any) => user.toString() === userId.toString());

    if (!isMember) {
      next(new AppError(400, `You seem not to be member of "${community.name}" community. Maybe you have been kicked out already. Try refreshing the page.`));
      return;
    }

    community.joinedUsers = community.joinedUsers.filter((user: any) => user.toString() !== userId.toString());
  }

  if (communityRole === 'moderator') {
    const isModerator = community.moderators.find((user: any) => user.toString() === userId.toString())

    if (!isModerator) {
      next(new AppError(400, `You seem not to be moderator of "${community.name}" community. Maybe you have been kicked out already. Try refreshing the page.`));
      return;
    }

    community.moderators = community.moderators.filter((user: any) => user.toString() !== userId.toString());
  }

  // remove user from community chats
  await CommunityService.removeUserFromAllCommunityChats(community._id, community.availableChats.length, userId, 'Failed to remove you from communit chats');

  await community.save();

  return res.status(200).json({
    status: 'success',
    message: `You have left "${community.name}" community`
  });
});