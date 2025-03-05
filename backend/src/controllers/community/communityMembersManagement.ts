import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import type { RequestWithCommunityType } from 'types/lib';
import type { BannedUserResDataType, RemoveUserBanResDataType, UserExistInListsType } from 'types/controllers/community';
import CommunityService from 'services/communityService';
import catchAsync from 'utils/catchAsync';
import AppError from 'utils/appError';
import Notification from 'models/notificationModel';
import { CommunitySchemaType } from 'models/communityModel';

export const banUserFromCommunity = catchAsync (async (
  req: RequestWithCommunityType,
  res: Response,
  next: NextFunction
) => {
  const existInLists = req.existInLists! as UserExistInListsType;

  if (existInLists.bannedUsers.exists) {
    next(new AppError(400, 'User is already banned from this community'));
    return;
  }

  const community = req.community! as CommunitySchemaType;
  const isCreator = req.isCreator!;

  const { targetUserId, shouldNotifyUser = false } = req.body;
  const targetUserIdString: string = targetUserId.toString();

  const existInAnyList = Object.keys(existInLists).some((list) => existInLists[list as keyof UserExistInListsType].exists);
  if (!existInAnyList) {
    next(new AppError(400, 'User you are trying to ban is not a member of community, nor is he / she in pending lists. Maybe he / she already left'));
    return;
  }
  
  if (existInLists.moderators.exists) {
    if (!isCreator) {
      next(new AppError(400, 'User you are trying to ban is moderator. Only creator can ban moderators'));
      return;
    }

    CommunityService.removeUserFromLists(
      community,
      ['moderators'],
      targetUserIdString
    );
  }

  if (existInLists.pendingInvitedModerators.exists) {
    if (!isCreator) {
      next(new AppError(400, 'User you are trying to ban is invited to be moderator. Only creator can ban moderators invitations'));
      return;
    }

    CommunityService.removeUserFromLists(
      community,
      ['pendingInvitedModerators'],
      targetUserIdString
    );
  }

  // remove from all lists except moderator lists
  CommunityService.removeUserFromLists(
    community,
    ['joinedUsers', 'pendingInvitedUsers', 'userJoinRequests', 'bannedUsers'],
    targetUserIdString
  );

  // add to banned list
  community.bannedUsers.push(new Types.ObjectId(targetUserIdString));

  // remove user from community chats
  await CommunityService.removeUserFromAllCommunityChats(community._id.toString(), community.availableChats.length, targetUserIdString, 'Failed to remove banned user from chats');

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
  const existInLists = req.existInLists! as UserExistInListsType;

  if (!existInLists.bannedUsers.exists) {
    next(new AppError(400, 'User you are trying to un-ban is not in banned users list. You cannot un-ban user that is not banned'));
    return;
  }

  const isInOtherLists = Object.keys(existInLists).find((list) => existInLists[list as keyof UserExistInListsType].exists && list !== 'bannedUsers');
  if (isInOtherLists) {
    next(new AppError(400, `User you are trying to un-ban is member of ${existInLists[isInOtherLists as keyof UserExistInListsType].alias}. If this was not intended, remove user from this list`));
    return;
  }

  const { targetUserId, shouldNotifyUser = false } = req.body;  
  const targetUserIdString: string = targetUserId.toString();

  const community = req.community! as CommunitySchemaType;

  CommunityService.removeUserFromLists(
    community,
    ['bannedUsers'],
    targetUserIdString
  );

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

    responseData.userRemovedBanNotifications = userRemovedBanNotifications;
  }

  await community.save();

  return res.status(200).json(responseData);
});

export const inviteUserToJoinAsMember = catchAsync (async (
  req: RequestWithCommunityType,
  res: Response,
  next: NextFunction
) => {
  const existInLists = req.existInLists! as UserExistInListsType;
  const existInAnyLists = Object.keys(existInLists).find((list) => existInLists[list as keyof UserExistInListsType].exists);
  
  if (existInAnyLists) {
    next(new AppError(400, `Invitation failed. User already found in ${existInLists[existInAnyLists as keyof UserExistInListsType].alias}.`));
    return;
  }

  const { targetUserId } = req.body;
  const targetUserIdString: string = targetUserId.toString();

  const community = req.community! as CommunitySchemaType;

  community.pendingInvitedUsers.push(new Types.ObjectId(targetUserIdString));

  const inviteUserNotification = await CommunityService.createInviteUserNotification(
    targetUserIdString,
    req.userId!,
    community._id.toString(),
    community.name,
    'becomeCommunityMemberRequest'
  );

  await community.save();

  return res.status(200).json({
    status: 'success',
    message: 'User successfully invited to join',
    targetUserId,
    inviteUserNotification
  });
});

export const inviteUserToJoinAsModerator = catchAsync (async (
  req: RequestWithCommunityType,
  res: Response,
  next: NextFunction
) => {
  const community = req.community! as CommunitySchemaType;
  const isCreator = community.creator.toString() === req.userId!.toString();
  if (!isCreator) {
    next(new AppError(401, 'Only community creator can invite users to join as moderators'));
    return;
  }

  const existInLists = req.existInLists! as UserExistInListsType;

  // joinedUsers is not checked because creator can invite them to become moderators
  const existInAnyListsExcetJoinedUsers = Object.keys(existInLists).find((list) => existInLists[list as keyof UserExistInListsType].exists && list !== 'joinedUsers');
  if (existInAnyListsExcetJoinedUsers) {
    next(new AppError(400, `Invitation failed. User already found in ${existInLists[existInAnyListsExcetJoinedUsers as keyof UserExistInListsType].alias}.`));
    return;
  }

  const { targetUserId } = req.body;

  // NOTE: if user is already in JoinedUsers, now he will be in 2 lists
  // becuase he can decline moderator role and stay member
  // This need to be handled in user accept invite
  community.pendingInvitedModerators.push(targetUserId);

  const inviteUserNotification = await CommunityService.createInviteUserNotification(
    targetUserId,
    req.userId!,
    community._id.toString(),
    community.name,
    'becomeCommunityModeratorRequest'
  );

  await community.save();

  return res.status(200).json({
    status: 'success',
    message: 'User successfully invited to join as moderator',
    targetUserId,
    inviteUserNotification
  });
});

export const withdrawCommunityInviteForUser = catchAsync (async (
  req: RequestWithCommunityType,
  res: Response,
  next: NextFunction
) => {
  const existInLists = req.existInLists! as UserExistInListsType;

  if (!existInLists.pendingInvitedUsers.exists) {
    next(new AppError(400, 'User in not found in pending invite list. Maybe he / she has declined request in the meantime'));
    return;
  }

  const existInAnyLists = Object.keys(existInLists).find((list) => existInLists[list as keyof UserExistInListsType].exists && list !== 'pendingInvitedUsers');
  if (existInAnyLists) {
    next(new AppError(400, `User also exists in ${existInLists[existInAnyLists as keyof UserExistInListsType]}. If this was not indented, remove user from that list before proceeding.`));
    return;
  }

  const { targetUserId } = req.body;
  const targetUserIdString = targetUserId.toString();
  const community = req.community! as CommunitySchemaType;

  CommunityService.removeUserFromLists(
    community,
    ['pendingInvitedUsers'],
    targetUserIdString
  );

  await community.save();

  return res.status(200).json({
    status: 'success',
    message: 'You have successfully withdrew invite for user',
    userToWithdrawInviteId: targetUserIdString
  });
});

export const widthrawCommunityModeratorInvite = catchAsync (async (
  req: RequestWithCommunityType,
  res: Response,
  next: NextFunction
) => {
  const community = req.community! as CommunitySchemaType;
  const isCreator = community.creator.toString() === req.userId!.toString();
  const existInLists = req.existInLists! as UserExistInListsType;

  if (!isCreator) {
    next(new AppError(401, 'Only community creator can withdraw moderator invitation'));
    return;
  }

  const { targetUserId } = req.body;
  const targetUserIdString = targetUserId.toString();

  if (!existInLists.pendingInvitedModerators.exists) {
    next(new AppError(404, 'User not found in moderator invitation list. Maybe it has declined request. Try refreshing the page'));
    return;
  }

  // user can be regular member while being invited as moderator
  const existInAnyLists = Object.keys(existInLists)
    .find((list) => existInLists[list as keyof UserExistInListsType].exists && list !== 'pendingInvitedModerators' && list !== 'joinedUsers');
  if (existInAnyLists) {
    next(new AppError(400, `User also exists in ${existInLists[existInAnyLists as keyof UserExistInListsType]}. If this was not indented, remove user from that list before proceeding.`));
    return;
  }

  CommunityService.removeUserFromLists(
    community,
    ['pendingInvitedModerators'],
    targetUserIdString
  );

  await community.save();

  return res.status(200).json({
    status: 'success',
    message: 'Moderator invitation withdrew successfully',
    withdrewUserInviteId: targetUserId
  });
});

export const moderatorAcceptUserJoinRequest = catchAsync (async (
  req: RequestWithCommunityType,
  res: Response,
  next: NextFunction
) => {
  const existInLists = req.existInLists! as UserExistInListsType;

  if (!existInLists.userJoinRequests.exists) {
    next(new AppError(400, 'User is not in request list. Maybe it has withdrew request'));
    return;
  }

  const existInAnyLists = Object.keys(existInLists).find((list) => existInLists[list as keyof UserExistInListsType].exists && list !== 'userJoinRequests');
  if (existInAnyLists) {
    next(new AppError(400, `User also exists in ${existInLists[existInAnyLists as keyof UserExistInListsType]}. If this was not indented, remove user from that list before proceeding.`));
    return;
  }

  const { targetUserId } = req.body;
  const targetUserIdString: string = targetUserId.toString();
  const community = req.community! as CommunitySchemaType;

  CommunityService.removeUserFromLists(
    community,
    ['userJoinRequests'],
    targetUserIdString
  );

  community.joinedUsers.push(new Types.ObjectId(targetUserIdString));

  const userNotification = await Notification.create({
    receiver: targetUserId,
    community: community._id,
    text: `Your request to join "${community.name}" community has been approved. You are not a member`,
    notificationType: 'requestToJoinCommunityAccepted'
  });

  await community.save();

  return res.status(200).json({
    status: 'success',
    message: 'User join request approved successfully',
    joinedUserId: targetUserId,
    userNotification
  });
});

export const moderatorDeclineUserJoinRequest = catchAsync (async (
  req: RequestWithCommunityType,
  res: Response,
  next: NextFunction
) => {
  const existInLists = req.existInLists! as UserExistInListsType;

  if (!existInLists.userJoinRequests.exists) {
    next(new AppError(400, 'User is not in request list. Maybe it has withdrew request'));
    return;
  }

  const existInAnyLists = Object.keys(existInLists).find((list) => existInLists[list as keyof UserExistInListsType].exists && list !== 'userJoinRequests');
  if (existInAnyLists) {
    next(new AppError(400, `User also exists in ${existInLists[existInAnyLists as keyof UserExistInListsType]}. If this was not indented, remove user from that list before proceeding.`));
    return;
  }

  const community = req.community! as CommunitySchemaType;
  const { targetUserId } = req.body;
  const targetUserIdString = targetUserId.toString();

  CommunityService.removeUserFromLists(
    community,
    ['userJoinRequests'],
    targetUserIdString
  );

  const userNotification = await Notification.create({
    receiver: targetUserId,
    community: community._id,
    text: `Your request to join "${community.name}" community has been declined.`,
    notificationType: 'requestToJoinCommunityDeclined'
  });

  await community.save();

  return res.status(200).json({
    status: 'success',
    message: 'User join request approved successfully',
    declinedUser: targetUserId,
    userNotification
  });
});