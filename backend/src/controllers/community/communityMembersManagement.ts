import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import type { RequestWithCommunityType } from 'types/lib';
import type { BannedUserResDataType, RemoveUserBanResDataType, UserExistInListsType } from 'types/controllers/community';
import CommunityService from 'services/communityService';
import catchAsync from 'utils/catchAsync';
import Notification from 'models/notificationModel';
import { CommunitySchemaType } from 'models/communityModel';
import CommunityUserManagerBuilder from 'utils/builders/community/communityUserManagerBuilder';

export const banUserFromCommunity = catchAsync (async (
  req: RequestWithCommunityType,
  res: Response,
  _: NextFunction
) => {
  const existInLists = req.existInLists! as UserExistInListsType;

  const community = req.community! as CommunitySchemaType;
  const isCreator = req.isCreator!;

  const { targetUserId, shouldNotifyUser = false } = req.body;
  const targetUserIdString: string = targetUserId.toString();

  const manageAction = new CommunityUserManagerBuilder(
    community, 
    targetUserIdString,
    req.userId!,
    existInLists
  );

  await manageAction
    .throwErrorIfNotInAnyList(
      'User you are trying to ban is not a member of community, nor is he / she in pending lists. Maybe he / she already left'
    )
    .throwErrorIfCreatorActionTriedByNonCreator(
      existInLists.moderators.exists && !isCreator,
      'User you are trying to ban is moderator. Only creator can ban moderators'
    )
    .throwErrorIfCreatorActionTriedByNonCreator(
      existInLists.pendingInvitedModerators.exists && !isCreator,
      'User you are trying to ban is invited to be moderator. Only creator can ban moderators invitations'
    )
    .removeUserFromLists(
      ['members', 'pendingInvitedUsers', 'userJoinRequests', 'bannedUsers', 'pendingInvitedModerators', 'moderators']
    )
    .addUserToList('bannedUsers', { bannedBy: new Types.ObjectId(req.userId!) })
    .saveCommunity()
  
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

  return res.status(200).json(responseData);
});

export const undoBanUserFromCommunity = catchAsync (async (
  req: RequestWithCommunityType,
  res: Response,
  _: NextFunction
) => {
  const { targetUserId, shouldNotifyUser = false } = req.body;  
  const targetUserIdString: string = targetUserId.toString();

  const community = req.community! as CommunitySchemaType;
  const existInLists = req.existInLists! as UserExistInListsType;

  const manageAction = new CommunityUserManagerBuilder(
    community, 
    targetUserIdString,
    req.userId!,
    existInLists
  );

  await manageAction
    .throwErrorIfInAnyListExcept(
      ['bannedUsers']
    )
    .throwErrorIfUserNotInList(
      'bannedUsers',
      'User you are trying to un-ban is not in banned users list. You cannot un-ban user that is not banned'
    )
    .removeUserFromLists(['bannedUsers'])
    .saveCommunity()

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

  return res.status(200).json(responseData);
});

export const inviteUserToJoinAsMember = catchAsync (async (
  req: RequestWithCommunityType,
  res: Response,
  _: NextFunction
) => {
  const existInLists = req.existInLists! as UserExistInListsType;
  const { targetUserId } = req.body;
  const targetUserIdString: string = targetUserId.toString();

  const community = req.community! as CommunitySchemaType;

  const manageAction = new CommunityUserManagerBuilder(
    community, 
    targetUserIdString,
    req.userId!,
    existInLists
  );

  await manageAction
    .throwErrorIfInAnyListExcept([])
    .addUserToList('pendingInvitedUsers', { invitedBy: new Types.ObjectId(req.userId!) })
    .saveCommunity()

  const inviteUserNotification = await CommunityService.createInviteUserNotification(
    targetUserIdString,
    req.userId!,
    community._id.toString(),
    community.name,
    'becomeCommunityMemberRequest'
  );

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
  _: NextFunction
) => {
  const community = req.community! as CommunitySchemaType;
  const { targetUserId } = req.body;
  const targetUserIdString: string = targetUserId.toString();

  const existInLists = req.existInLists! as UserExistInListsType;

  const manageAction = new CommunityUserManagerBuilder(
    community, 
    targetUserIdString,
    req.userId!,
    existInLists
  );

  await manageAction
    .throwErrorIfInAnyListExcept(['members'])
    .addUserToList('pendingInvitedModerators', { invitedBy: new Types.ObjectId(req.userId!) })
    .saveCommunity()

  const inviteUserNotification = await CommunityService.createInviteUserNotification(
    targetUserIdString,
    req.userId!,
    community._id.toString(),
    community.name,
    'becomeCommunityModeratorRequest'
  );

  // await community.save();

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
  _: NextFunction
) => {
  const existInLists = req.existInLists! as UserExistInListsType;
  const { targetUserId } = req.body;
  const targetUserIdString = targetUserId.toString();
  const community = req.community! as CommunitySchemaType;

  const manageAction = new CommunityUserManagerBuilder(
    community, 
    targetUserIdString,
    req.userId!,
    existInLists
  );

  await manageAction
    .throwErrorIfInAnyListExcept(['pendingInvitedUsers'])
    .throwErrorIfUserNotInList(
      'pendingInvitedUsers',
      'User is not in pending list. Maybe request was withdrew or declined before'
    )
    .removeUserFromLists(['pendingInvitedUsers'])
    .saveCommunity()

  return res.status(200).json({
    status: 'success',
    message: 'You have successfully withdrew invite for user',
    userToWithdrawInviteId: targetUserIdString
  });
});

// doesnt need internal check if user is creator (only creators can deal with moderators)
// because is done in permission middleware
export const widthrawCommunityModeratorInvite = catchAsync (async (
  req: RequestWithCommunityType,
  res: Response,
  _: NextFunction
) => {
  const community = req.community! as CommunitySchemaType;
  const existInLists = req.existInLists! as UserExistInListsType;

  const { targetUserId } = req.body;
  const targetUserIdString = targetUserId.toString();

  const manageAction = new CommunityUserManagerBuilder(
    community, 
    targetUserIdString,
    req.userId!,
    existInLists
  );

  await manageAction
    .throwErrorIfUserNotInList(
      'pendingInvitedModerators',
      'User not found in moderator invitation list. Maybe it has declined request. Try refreshing the page'
    )
    .throwErrorIfInAnyListExcept(['members', 'pendingInvitedModerators'])
    .removeUserFromLists(['pendingInvitedModerators'])
    .saveCommunity()

  return res.status(200).json({
    status: 'success',
    message: 'Moderator invitation withdrew successfully',
    withdrewUserInviteId: targetUserId
  });
});

export const moderatorAcceptUserJoinRequest = catchAsync (async (
  req: RequestWithCommunityType,
  res: Response,
  _: NextFunction
) => {
  const existInLists = req.existInLists! as UserExistInListsType;
  const { targetUserId } = req.body;
  const targetUserIdString: string = targetUserId.toString();
  const community = req.community! as CommunitySchemaType;

  const manageAction = new CommunityUserManagerBuilder(
    community, 
    targetUserIdString,
    req.userId!,
    existInLists
  );

  await manageAction
    .throwErrorIfInAnyListExcept(['userJoinRequests'])
    .throwErrorIfUserNotInList(
      'userJoinRequests',
      'User is not in request list. Maybe request was removed before'
    )
    .removeUserFromLists(['userJoinRequests'])
    .addUserToList('members')
    .saveCommunity()

  const userNotification = await Notification.create({
    receiver: targetUserId,
    community: community._id,
    text: `Your request to join "${community.name}" community has been approved. You are not a member`,
    notificationType: 'requestToJoinCommunityAccepted'
  });

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
  _: NextFunction
) => {
  const existInLists = req.existInLists! as UserExistInListsType;
  const community = req.community! as CommunitySchemaType;
  const { targetUserId } = req.body;
  const targetUserIdString = targetUserId.toString();

  const manageAction = new CommunityUserManagerBuilder(
    community, 
    targetUserIdString,
    req.userId!,
    existInLists
  );

  await manageAction
    .throwErrorIfUserNotInList(
      'userJoinRequests',
      'User is not in request list. Maybe it has withdrew request'
    )
    .throwErrorIfInAnyListExcept(['userJoinRequests'])
    .removeUserFromLists(['userJoinRequests'])
    .saveCommunity()

  const userNotification = await Notification.create({
    receiver: targetUserId,
    community: community._id,
    text: `Your request to join "${community.name}" community has been declined.`,
    notificationType: 'requestToJoinCommunityDeclined'
  });

  await community.save();

  return res.status(200).json({
    status: 'success',
    message: 'User join request declined successfully',
    declinedUser: targetUserId,
    userNotification
  });
});