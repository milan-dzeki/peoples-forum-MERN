import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import type { RequestWithCommunityType } from 'types/lib';
import type { UserExistInListsType } from 'types/controllers/community';
import { CommunitySchemaType } from 'models/communityModel';
import catchAsync from 'utils/catchAsync';
import AppError from 'utils/appError';
import User from 'models/userModel';
import Notification, { NotificationSchemaType } from 'models/notificationModel';
import CommunitySettings from 'models/settings/communitySettingsModel';
import CommunityService from 'services/communityService';
import { COMMUNITY_PERMISSION_NAMES } from 'configs/community';

export const userRequestCommunityJoin = catchAsync (async (
  req: RequestWithCommunityType,
  res: Response,
  next: NextFunction
) => {
  const userId = req.userId!;
  const community = req.community! as CommunitySchemaType;
  if (userId.toString() === community.creator.toString()) {
    next(new AppError(400, 'You cannot join - you are the creator of this community'));
    return;
  }
  const existInLists = req.existInLists! as UserExistInListsType;

  if (existInLists.userJoinRequests.exists) {
    next(new AppError(400, 'You have already requested to join this community. Cannot request twice'));
    return;
  }

  const existInAnyLists = Object.keys(existInLists).find((list) => existInLists[list as keyof UserExistInListsType].exists && list !== 'userJoinRequests');
  if (existInAnyLists) {
    next(new AppError(400, `You are alredy registered in ${existInLists[existInAnyLists as keyof UserExistInListsType].alias}, so request cannot be sent.`));
    return;
  }

  community.userJoinRequests.push({ user: new Types.ObjectId(userId) });

  const communityModeratorPermissions = await CommunitySettings.findOne({ community: community._id }).select('moderators_settings.moderatorPermissions -_id');
  const communityModeratorPermissionsList = communityModeratorPermissions.moderators_settings.moderatorPermissions.value;

  let moderatorsToGetNotified = [];

  /*
    IF global setting have "accept_join_requests" permission, notifications about 
    user request to join are sent to all moderators + creator
    ELSE only to moderators that have this permission in their custom field
  */
  if (!communityModeratorPermissionsList.includes(COMMUNITY_PERMISSION_NAMES.ACCEPT_JOIN_REQUESTS)) {
    moderatorsToGetNotified = community.moderators
      .filter((moderator) => moderator.customPermissions.includes(COMMUNITY_PERMISSION_NAMES.ACCEPT_JOIN_REQUESTS))
      .map((moderator) => moderator.user);
  } else {
    moderatorsToGetNotified = community.moderators.map((moderator) => moderator.user);
  }

  moderatorsToGetNotified.push(community.creator);

  const user = await User.findById(userId).select('fullName profilePhotoUrl');

  const notificationsToBeSentToModerators: NotificationSchemaType[] = [];
  for (const id of moderatorsToGetNotified) {
    const notification = await Notification.create({
      receiver: id,
      sender: userId,
      notificationType: 'userRequestedToJoinCommunity',
      text: `<sender>${user.fullName}</sender> sent request to join yout "${community.name}" community.`,
      community: community._id
    });

    notificationsToBeSentToModerators.push(notification);
  }

  await community.save();

  return res.status(200).json({
    status: 'success',
    message: `You have succesfully sent request to join "${community.name}" community. Moderators have been notified.`,
    communityRequestedId: community._id,
    notificationsToBeSentToModerators
  });
});

export const userWithdrawRequestToJoinCommunity = catchAsync (async (
  req: RequestWithCommunityType,
  res: Response,
  next: NextFunction
) => {
  const existInLists = req.existInLists! as UserExistInListsType;
  const community = req.community! as CommunitySchemaType;
  const userId = req.userId!.toString();

  if (!existInLists.userJoinRequests.exists) {
    next(new AppError(400, 'You are not in request list. Maybe moderators have approved or declined your request. Try refreshing the page and check whether you are already member of community'));
    return;
  }

  const existInAnyList = Object.keys(existInLists).find((list) => existInLists[list as keyof UserExistInListsType].exists && list !== 'userJoinRequests');
  if (existInAnyList) {
    next(new AppError(400, `You are already in ${existInLists[existInAnyList as keyof UserExistInListsType].alias}. If you dont want to be, remove yourself`));
    return;
  }
  
  CommunityService.removeUserFromLists(
    community,
    ['userJoinRequests'],
    userId
  );
  await community.save();
  // should somehow update / remove notifications sent to moderators

  return res.status(200).json({
    status: 'success',
    message: 'You have succsssfully withdrew request to join community'
  });
});

export const userAcceptJoinCommunityInvite = catchAsync (async (
  req: RequestWithCommunityType,
  res: Response,
  next: NextFunction
) => {
  const existInLists = req.existInLists! as UserExistInListsType;
  const { inviteType } = req.params;

  if (!inviteType || (inviteType && inviteType !== 'member' && inviteType !== 'moderator')) {
    next(new AppError(400, 'User invitation type must be either "member" or "moderator"'));
    return;
  }

  const userId = req.userId!;
  const community = req.community! as CommunitySchemaType;

  if (community.creator.toString() === userId.toString()) {
    next(new AppError(400, `You are creator of "${community.name}", so if you have invites for it, we have a bug in application :).`));
    return;
  }

  const existInAnyLists = Object.keys(existInLists)
    .find((list) => existInLists[list as keyof UserExistInListsType].exists && list !== 'pendingInvitedUsers' && list !== 'pendingInvitedModerators' && list !== 'members');

  if (existInAnyLists) {
    next(new AppError(400, `You are already in ${existInLists[existInAnyLists as keyof UserExistInListsType].alias}, so cannot accept request`));
    return;
  }

  if (inviteType === 'member') {
    if (!existInLists.pendingInvitedUsers.exists) {
      next(new AppError(400, 'You are not in request list. Maybe moderators have widthrew request. Try refreshing the page.'));
      return;
    }

    CommunityService.removeUserFromLists(
      community,
      ['pendingInvitedUsers'],
      userId.toString()
    );
    community.members.push({ user: new Types.ObjectId(userId) });
  }

  if (inviteType === 'moderator') {
    if (!existInLists.pendingInvitedModerators.exists) {
      next(new AppError(400, 'You are not in request list. Maybe moderators have widthrew request. Try refreshing the page.'));
      return;
    }
    
    CommunityService.removeUserFromLists(
      community,
      existInLists.members.exists ? ['pendingInvitedModerators', 'members'] : ['pendingInvitedModerators'],
      userId.toString()
    );
    community.moderators.push({ user: userId, customPermissions: [] });
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

  if (inviteType === 'member') {
    (req.community! as CommunitySchemaType).moderators.forEach((moderator) => {
      moderatorNotifictaions.push({
        receiver: moderator.user,
        notificationType: inviteType === 'member' ? 'userAcceptedCommunityMemberInvite' : 'userAcceptedCommunityModeratorInvite',
        text: `${user.fullName} has accepted to join as ${inviteType} "${community.name}" community that you manage`,
        community: community._id,
        sender: user._id
      });
    });
  }

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
  const existInLists = req.existInLists! as UserExistInListsType;

  const { inviteType } = req.params;

  const userId = req.userId!;
  const community = req.community! as CommunitySchemaType;

  if (!inviteType || (inviteType && inviteType !== 'member' && inviteType !== 'moderator')) {
    next(new AppError(400, 'User invitation type must be either "member" or "moderator"'));
    return;
  }

  if (community.creator.toString() === userId.toString()) {
    next(new AppError(400, `You are creator of "${community.name}", so if you have invites for it, we have a bug in application :).`));
    return;
  }

  const existInAnyLists = Object.keys(existInLists)
    .find((list) => existInLists[list as keyof UserExistInListsType].exists && list !== 'pendingInvitedUsers' && list !== 'pendingInvitedModerators' && list !== 'members');

  if (existInAnyLists) {
    next(new AppError(400, `You are already in ${existInLists[existInAnyLists as keyof UserExistInListsType].alias}, so cannot accept request`));
    return;
  }

  if (inviteType === 'member') {
    if (!existInLists.pendingInvitedUsers.exists) {
      next(new AppError(400, `There seems to be missing invitation for joining "${community.name}". Maybe admins have already accepted / declined it. Check whether you are already a member`));
      return;
    }

    CommunityService.removeUserFromLists(
      community,
      ['pendingInvitedUsers'],
      userId.toString()
    );
  }

  if (inviteType === 'moderator') {
    if (!existInLists.pendingInvitedModerators.exists) {
      next(new AppError(400, `There seems to be missing invitation for joining "${community.name}" as moderator. Maybe admins have already accepted / declined it. Check whether you are already a moderator.`));
      return;
    }

    CommunityService.removeUserFromLists(
      community,
      ['pendingInvitedModerators'],
      userId.toString()
    );
  }

  await community.save();

  return res.status(200).json({
    status: 'success',
    message: `Invitation to join "${community.name}" community as ${inviteType} declined successfully.`
  });
});

// still needs some checking
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
  const community = req.community! as CommunitySchemaType;

  if (communityRole === 'member') {
    const isMember = community.members.find((user) => user.toString() === userId.toString());

    if (!isMember) {
      next(new AppError(400, `You seem not to be member of "${community.name}" community. Maybe you have been kicked out already. Try refreshing the page.`));
      return;
    }

    CommunityService.removeUserFromLists(
      community,
      ['members'],
      req.userId!.toString()
    );
  }

  if (communityRole === 'moderator') {
    const isModerator = community.moderators.find((moderator) => moderator.user.toString() === userId.toString())

    if (!isModerator) {
      next(new AppError(400, `You seem not to be moderator of "${community.name}" community. Maybe you have been kicked out already. Try refreshing the page.`));
      return;
    }

    community.moderators = community.moderators.filter((moderator) => moderator.user.toString() !== userId.toString()) as typeof community.moderators;
  }

  // remove user from community chats
  await CommunityService.removeUserFromAllCommunityChats(
    community._id.toString(), 
    community.availableChats.length, 
    userId, 
    'Failed to remove you from communit chats'
  );

  await community.save();

  return res.status(200).json({
    status: 'success',
    message: `You have left "${community.name}" community`
  });
});