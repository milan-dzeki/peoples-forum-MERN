import { Response, NextFunction } from 'express';
import type { RequestWithCommunityType } from 'types/lib';
import type { BannedUserResDataType, RemoveUserBanResDataType } from 'types/controllers/community';
import CommunityService from 'services/communityService';
import catchAsync from 'utils/catchAsync';
import AppError from 'utils/appError';
import User from 'models/userModel';
import Notification from 'models/notificationModel';

export const banUserFromCommunity = catchAsync (async (
  req: RequestWithCommunityType,
  res: Response,
  next: NextFunction
) => {
  const { targetUserId, shouldNotifyUser = false } = req.body;

  // if id is same as logged in user id - almost impossible, but why not check
  if (targetUserId.toString() === req.userId!.toString()) {
    next(new AppError(400, 'You cannot ban yourself'));
    return;
  }

  const community = req.community!;

  const userAlreadyBanned = community.bannedUsers.find((bannerUser: any) => bannerUser.toString() === targetUserId.toString());
  if (userAlreadyBanned) {
    next(new AppError(400, 'You have already banned this user - can not be done twice'));
    return;
  }

  const isUserMember = community.joinedUsers.find((joined: any) => joined.toString() === targetUserId.toString());
  const isUserInPendingMemberList = community.pendingInvitedUsers.find((pending: any) => pending.toString() === targetUserId.toString());
  const isUserInPendingModeratorList = community.pendingInvitedModerators.find((pending: any) => pending.toString() === targetUserId.toString());
  const isUserToBanModerator = community.moderators.find((moderator: any) => moderator.toString() === targetUserId.toString());

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
    
    community.moderators = community.moderators.filter((user: any) => user.toString() !== targetUserId.toString());
  }

  if (isUserMember) {
    community.joinedUsers = community.joinedUsers.filter((user: any) => user.toString() !== targetUserId.toString());
  }

  if (isUserInPendingMemberList) {
    community.pendingInvitedUsers = community.pendingInvitedUsers.filter((user: any) => user.toString() !== targetUserId.toString());
  }

  if (isUserInPendingModeratorList) {
    community.pendingInvitedModerators = community.pendingInvitedModerators.filter((user: any) => user.toString() !== targetUserId.toString());
  }

  community.bannedUsers.push(targetUserId);

  // remove user from community chats
  await CommunityService.removeUserFromAllCommunityChats(community._id, community.availableChats.length, targetUserId, 'Failed to remove banned user from chats');

  const responseData: BannedUserResDataType = {
    status: 'success',
    message: 'You have successfully banned user from community',
    bannedUserId: targetUserId
  };

  if (shouldNotifyUser) {
    const bannedUserNotification = await Notification.create({
      receiver: targetUserId,
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
  const { targetUserId, shouldNotifyUser = false, inviteUserToJoinOrModerate = null } = req.body;

  const community = req.community!;

  const userInBannedList = community.bannedUsers.find((user: any) => user.toString() === targetUserId.toString());
  if (!userInBannedList) {
    next(new AppError(400, 'User you are trying to un-ban is not in banned users list. You cannot un-ban user that is not banned'));
    return;
  }

  community.bannedUsers = community.bannedUsers.filter((user: any) => user.toString() !== targetUserId.toString());

  const responseData: RemoveUserBanResDataType = {
    status: 'success',
    message: 'You have successfully removed ban for user',
    userRemovedBanId: targetUserId 
  };

  if (shouldNotifyUser) {
    const userRemovedBanNotifications = await Notification.create({
      receiver: targetUserId,
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
      receiver: targetUserId,
      notificationType: inviteUserToJoinOrModerate === 'member' ? 'becomeCommunityMemberRequest' : 'becomeCommunityModeratorRequest',
      text: `You have been invited to become ${inviteUserToJoinOrModerate} in "${community.name}" community.`,
      community: community._id
    };

    if (inviteUserToJoinOrModerate === 'member') {
      community.pendingInvitedUsers.push(targetUserId);
    }

    if (inviteUserToJoinOrModerate === 'moderator') {
      community.pendingInvitedModerators.push(targetUserId);
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
  const { targetUserId, inviteType } = req.body;

  if (!inviteType || (inviteType && inviteType !== 'member' && inviteType !== 'moderator')) {
    next(new AppError(400, 'User invitation type must be either "member" or "moderator"'));
    return;
  }

  const community = req.community!;

  const userBanned = community.bannedUsers.find((user: any) => user.toString() === targetUserId.toString());
  if (userBanned) {
    next(new AppError(400, `You are trying to invite BANNED user to join as ${inviteType}. Remove ban first and then proceed.`));
    return;
  }

  const userAlreadyInvitedAsMember = community.pendingInvitedUsers.find((user: any) => user.toString() === targetUserId.toString());
  const userAlreadyInvitedAsModerator = community.pendingInvitedModerators.find((user: any) => user.toString() === targetUserId.toString());

  if (userAlreadyInvitedAsMember) {
    next(new AppError(400, 'You have already invitied this user to join as member. Only 1 invitation is allowed per user.'));
    return;
  }
  if (userAlreadyInvitedAsModerator) {
    next(new AppError(400, 'You have already invitied this user to join as moderator. Only 1 invitation is allowed per user.'));
    return;
  }

  const userAlreadyMember = community.joinedUsers.find((user: any) => user.toString() === targetUserId.toString());
  const userAlreadyModerator = community.moderators.find((user: any) => user.toString() === targetUserId.toString());

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
    community.pendingInvitedModerators.push(targetUserId);

    if (userAlreadyMember) {
      responseDataMessage = 'You have invited joined member to become moderator of this community successfully';
    } else {
      responseDataMessage = 'You have invited user to become moderator of this community successfully';
    }
  } else if(inviteType === 'member') {
    responseDataMessage = 'You have invited user join this community successfully';
    community.pendingInvitedUsers.push(targetUserId);
  }

  await community.save();

  const inviteUserNotification = await Notification.create({
    receiver: targetUserId,
    notificationType: inviteType === 'moderator' ? 'becomeCommunityModeratorRequest' : 'becomeCommunityMemberRequest',
    text: `You have been invited to become ${inviteType} of "${community.name}"${userAlreadyMember ? ' community where you are already a member.' : '.'}`,
    community: community._id
  });

  return res.status(200).json({
    status: 'success',
    message: responseDataMessage,
    targetUserId,
    inviteUserNotification
  });
});

export const moderatorWithdrawJoinCommunityInviteForUser = catchAsync (async (
  req: RequestWithCommunityType,
  res: Response,
  next: NextFunction
) => {
  const { targetUserid, inviteType } = req.body;

  if (!inviteType || (inviteType && inviteType !== 'member' && inviteType !== 'moderator')) {
    next(new AppError(400, 'User widthraw invitation type must be either "member" or "moderator"'));
    return;
  }

  const community = req.community!;

  if (inviteType === 'member') {
    const isUserInPendingMembersList = community.pendingInvitedUsers.find((user: any) => user.toString() === targetUserid.toString());

    if (!isUserInPendingMembersList) {
      next(new AppError(400, 'User in not found in pending invite list. Maybe he / she has declined request in the meantime'));
      return;
    }

    community.pendingInvitedUsers = community.pendingInvitedUsers.filter((user: any) => user.toString() !== targetUserid.toString());
  }

  if (inviteType === 'moderator') {
    const isUserInPendingModeratorsList = community.pendingInvitedModerators.find((user: any) => user.toString() === targetUserid.toString());

    if (!isUserInPendingModeratorsList) {
      next(new AppError(400, 'User in not found in pending invite moderator list. Maybe he / she has declined request in the meantime'));
      return;
    }

    community.pendingInvitedModerators = community.pendingInvitedModerators.filter((user: any) => user.toString() !== targetUserid.toString());
  }

  await community.save();

  return res.status(200).json({
    status: 'success',
    message: `You have successfully withdrew ${inviteType} invite for user`,
    userToWithdrawInviteId: targetUserid
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