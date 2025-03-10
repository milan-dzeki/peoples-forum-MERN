import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import type { RequestWithCommunityType } from 'types/lib';
import type { UserExistInListsType } from 'types/controllers/community';
import catchAsync from 'utils/catchAsync';
import Notification from 'models/notificationModel';
import { CommunitySchemaType } from 'models/communityModel';
import CommunityUserManagerBuilder from 'utils/builders/community/communityUserManagerBuilder';
import { NOTIFICATION_TYPES } from 'configs/notifications';

export const banUserFromCommunity = catchAsync (async (
  req: RequestWithCommunityType,
  res: Response,
  _: NextFunction
) => {
  const existInLists = req.existInLists! as UserExistInListsType;
  const settings = req.communitySettings!;

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

  let communityUpdated = await manageAction
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

  if (shouldNotifyUser) {
    communityUpdated = communityUpdated.setUserNotification({
      receiver: targetUserIdString,
      notificationType: NOTIFICATION_TYPES.BANNED_FROM_COMMUNITY,
      text: `You have been banned from "${community.name}" community.`
    });
  }

  if (!isCreator && settings.notifyCreatorForUserManagementActions!.value) {
    communityUpdated = communityUpdated.setCreatorNotification({
      receiver: community.creator,
      notificationType: NOTIFICATION_TYPES.USERS_MANAGED_BY_MODERATOR,
      text: `*user* (moderator) banned *banned* from your "${community.name}" community`,
      sender: req.userId!,
      community: community._id,
      user: targetUserIdString
    });
  }

  communityUpdated = communityUpdated.setResJson({
    res,
    message: 'You have successfully banned user from community',
    targetUserId: targetUserIdString
  });

  const response = await communityUpdated.execute();

  return response;
  
  // remove user from community chats
  // await CommunityService.removeUserFromAllCommunityChats(community._id.toString(), community.availableChats.length, targetUserIdString, 'Failed to remove banned user from chats');
});

export const undoBanUserFromCommunity = catchAsync (async (
  req: RequestWithCommunityType,
  res: Response,
  _: NextFunction
) => {
  const { targetUserId, shouldNotifyUser = false } = req.body;  
  const targetUserIdString: string = targetUserId.toString();
  const settings = req.communitySettings!;
  const isCreator = req.isCreator!;
  const community = req.community! as CommunitySchemaType;
  const existInLists = req.existInLists! as UserExistInListsType;

  const manageAction = new CommunityUserManagerBuilder(
    community, 
    targetUserIdString,
    req.userId!,
    existInLists
  );

  let communityUpdated = await manageAction
    .throwErrorIfInAnyListExcept(
      ['bannedUsers']
    )
    .throwErrorIfUserNotInList(
      'bannedUsers',
      'User you are trying to un-ban is not in banned users list. You cannot un-ban user that is not banned'
    )
    .removeUserFromLists(['bannedUsers'])
    .saveCommunity();

  if (shouldNotifyUser) {
    communityUpdated = communityUpdated.setUserNotification({
      receiver: targetUserIdString,
      notificationType: NOTIFICATION_TYPES.REMOVED_COMMUNITY_BAN,
      text: `Your ban from community: "${community.name}" has been removed. You can see this communities posts and chats now.`,
      community: community._id
    });
  }

  if (!isCreator && settings.notifyCreatorForUserManagementActions!.value) {
    communityUpdated = communityUpdated.setCreatorNotification({
      receiver: community.creator,
      notificationType: NOTIFICATION_TYPES.USERS_MANAGED_BY_MODERATOR,
      text: `*user* (moderator) removed ban for *banned* for your "${community.name}" community`,
      sender: req.userId!,
      community: community._id,
      user: targetUserIdString
    });
  }

  communityUpdated = communityUpdated.setResJson({
    res,
    message: 'You have successfully un-banned user from community',
    targetUserId: targetUserIdString
  });

  const response = await communityUpdated.execute();

  return response;
});

export const inviteUserToJoinAsMember = catchAsync (async (
  req: RequestWithCommunityType,
  res: Response,
  _: NextFunction
) => {
  const existInLists = req.existInLists! as UserExistInListsType;
  const { targetUserId } = req.body;
  const targetUserIdString: string = targetUserId.toString();
  const settings = req.communitySettings!;
  const isCreator = req.isCreator!;
  const community = req.community! as CommunitySchemaType;

  const manageAction = new CommunityUserManagerBuilder(
    community, 
    targetUserIdString,
    req.userId!,
    existInLists
  );

  let communitySaved = await manageAction
    .throwErrorIfInAnyListExcept([])
    .addUserToList('pendingInvitedUsers', { invitedBy: new Types.ObjectId(req.userId!) })
    .saveCommunity()

  communitySaved = communitySaved
    .setUserNotification({
      receiver: targetUserIdString,
      notificationType: NOTIFICATION_TYPES.BECOME_COMMUNITY_MEMBER_INVITATION,
      text: `*user* invited you to become member of "${community.name}" community.`,
      community: community._id
    });

  if (!isCreator && settings.notifyCreatorForUserManagementActions!.value) {
    communitySaved = communitySaved.setCreatorNotification({
      receiver: community.creator,
      notificationType: NOTIFICATION_TYPES.USERS_MANAGED_BY_MODERATOR,
      text: `*moderator* (moderator) invited *user* to join your "${community.name}" community`,
      sender: req.userId!,
      community: community._id,
      user: targetUserIdString
    });
  }

  communitySaved = communitySaved.setResJson({
    res,
    message: 'User successfully invited to join',
    targetUserId: targetUserIdString
  });

  const response = await communitySaved.execute();

  return response;
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

  let communitySaved = await manageAction
    .throwErrorIfInAnyListExcept(['members'])
    .addUserToList('pendingInvitedModerators', { invitedBy: new Types.ObjectId(req.userId!) })
    .saveCommunity();

  communitySaved = communitySaved
    .setUserNotification({
      receiver: targetUserIdString,
      notificationType: NOTIFICATION_TYPES.BECOME_COMMUNITY_MODERATOR_INVITATION,
      text: `*user* invited you to become moderator of "${community.name}" community.`,
      community: community._id
    });

  communitySaved = communitySaved.setResJson({
    res,
    message: 'User successfully invited to join as moderator',
    targetUserId: targetUserIdString
  });

  const response = await communitySaved.execute();

  return response;
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
  const isCreator = req.isCreator!;
  const settings = req.communitySettings!;

  const manageAction = new CommunityUserManagerBuilder(
    community, 
    targetUserIdString,
    req.userId!,
    existInLists
  );

  let communitySaved = await manageAction
    .throwErrorIfInAnyListExcept(['pendingInvitedUsers'])
    .throwErrorIfUserNotInList(
      'pendingInvitedUsers',
      'User is not in pending list. Maybe request was withdrew or declined before'
    )
    .removeUserFromLists(['pendingInvitedUsers'])
    .saveCommunity();

  if (!isCreator && settings.notifyCreatorForUserManagementActions!.value) {
    communitySaved = communitySaved.setCreatorNotification({
      receiver: community.creator,
      notificationType: NOTIFICATION_TYPES.USERS_MANAGED_BY_MODERATOR,
      text: `*moderator* (moderator) withdrew member invite for *user* to join your "${community.name}" community`,
      sender: req.userId!,
      community: community._id,
      user: targetUserIdString
    });
  }

  communitySaved = communitySaved
    .setResJson({
      res,
      message: 'You have successfully withdrew invite for user',
      targetUserId: targetUserIdString
    });

  const response = await communitySaved.execute();

  return response;
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

  let communitySaved = await manageAction
    .throwErrorIfUserNotInList(
      'pendingInvitedModerators',
      'User not found in moderator invitation list. Maybe it has declined request. Try refreshing the page'
    )
    .throwErrorIfInAnyListExcept(['members', 'pendingInvitedModerators'])
    .removeUserFromLists(['pendingInvitedModerators'])
    .saveCommunity();

  communitySaved = communitySaved
    .setResJson({
      res,
      message: 'Moderator invitation withdrew successfully',
      targetUserId: targetUserIdString
    });

  const response = await communitySaved.execute();

  return response;
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
  const isCreator = req.isCreator!;
  const settings = req.communitySettings!;

  const manageAction = new CommunityUserManagerBuilder(
    community, 
    targetUserIdString,
    req.userId!,
    existInLists
  );

  let communitySaved = await manageAction
    .throwErrorIfInAnyListExcept(['userJoinRequests'])
    .throwErrorIfUserNotInList(
      'userJoinRequests',
      'User is not in request list. Maybe request was removed before'
    )
    .removeUserFromLists(['userJoinRequests'])
    .addUserToList('members')
    .saveCommunity();

  if (!isCreator && settings.notifyCreatorForUserManagementActions!.value) {
    communitySaved = communitySaved.setCreatorNotification({
      receiver: community.creator,
      notificationType: NOTIFICATION_TYPES.USERS_MANAGED_BY_MODERATOR,
      text: `*moderator* (moderator) accepted member request for *user* to join your "${community.name}" community`,
      sender: req.userId!,
      community: community._id,
      user: targetUserIdString
    });
  }

  communitySaved = communitySaved
    .setUserNotification({
      receiver: targetUserId,
      community: community._id,
      text: `Your request to join "${community.name}" community has been approved. You are now a member`,
      notificationType: NOTIFICATION_TYPES.REQUEST_TO_JOIN_COMMUNITY_AS_MEMBER_ACCEPTED
    })
    .setResJson({
      res,
      message: 'User join request approved successfully',
      targetUserId: targetUserIdString
    });

  const response = await communitySaved.execute();

  return response;
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
  const isCreator = req.isCreator!;
  const settings = req.communitySettings!;

  const manageAction = new CommunityUserManagerBuilder(
    community, 
    targetUserIdString,
    req.userId!,
    existInLists
  );

  let communitySaved = await manageAction
    .throwErrorIfUserNotInList(
      'userJoinRequests',
      'User is not in request list. Maybe it has withdrew request'
    )
    .throwErrorIfInAnyListExcept(['userJoinRequests'])
    .removeUserFromLists(['userJoinRequests'])
    .saveCommunity();

  if (!isCreator && settings.notifyCreatorForUserManagementActions!.value) {
    communitySaved = communitySaved.setCreatorNotification({
      receiver: community.creator,
      notificationType: NOTIFICATION_TYPES.USERS_MANAGED_BY_MODERATOR,
      text: `*moderator* (moderator) declined member request for *user* to join your "${community.name}" community`,
      sender: req.userId!,
      community: community._id,
      user: targetUserIdString
    });
  }

  communitySaved = communitySaved
    .setUserNotification({
      receiver: targetUserId,
      community: community._id,
      text: `Your request to join "${community.name}" community has been declined.`,
      notificationType: NOTIFICATION_TYPES.REQUEST_TO_JOIN_COMMUNITY_AS_MEMBER_DECLINED
    })
    .setResJson({
      res,
      message: 'User join request approved successfully',
      targetUserId: targetUserIdString
    });

  const response = await communitySaved.execute();

  return response;
});