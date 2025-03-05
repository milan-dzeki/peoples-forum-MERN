import Chat from 'models/chatModel';
import Community, { CommunitySchemaType } from 'models/communityModel';
import Notification from 'models/notificationModel';
import User from 'models/userModel';
import { CommunityListType } from 'types/controllers/community';
import AppError from 'utils/appError';

class CommunityService {
  static async createCommunityChatsUponCommunityCreation (
    creatorId: string, 
    communityId: string, 
    chatNames: string[]
  ) {
    if (chatNames.length === 0) {
      return;
    }

    try {
      const createdChatIds = [];

      for (const name of chatNames) {
        const newChat = await Chat.create({
          creator: creatorId,
          name,
          members: [creatorId],
          admins: [creatorId],
          communityId,
          bannedUsers: []
        });

        if (newChat) {
          createdChatIds.push(newChat._id);
        }
      }

      return createdChatIds;
    } catch (error) {
      // remove chats and community if something fails
      await Chat.deleteMany({ creator: creatorId, communityId });
      await Community.deleteOne({ _id: communityId, creator: creatorId });
      
      throw new AppError(500, 'Failed to create chats for community. Maybe servers are down. Reftesh the page and try again');
    }
  }

  static async removeUserFromAllCommunityChats (
    communityId: string, 
    communityChatsLength: number, 
    userId: string, 
    actionFailMsg: string
  ): Promise<void> {
    if (communityChatsLength === 0) {
      return;
    }
    try {
      await Chat.updateMany(
        {
          communityId,
          members: { $in: [userId] }
        },
        { $pull: { members: userId } }
      );
    } catch (error: unknown) {
      throw new AppError(500, actionFailMsg);
    }
  }

  /*
    - runs before sending join invite
    - doesn't check if user is member for moderator invite because member can be invited to become moderator
  */
  static checkUserExistsInListsBeforeInvite (targetUserId: string, community: CommunitySchemaType) {
    const userBanned = community.bannedUsers.find((user) => user.toString() === targetUserId);
    if (userBanned) {
      throw new AppError(400, 'You are trying to invite BANNED user to join. Remove ban first and then proceed.');
    }

    const userAlreadyInvitedAsMember = community.pendingInvitedUsers.find((user) => user.toString() === targetUserId);
    if (userAlreadyInvitedAsMember) {
      throw new AppError(400, 'You have already invitied this user to join as member. Only 1 invitation is allowed per user.');
    }
    
    const userAlreadyInvitedAsModerator = community.pendingInvitedModerators.find((user) => user.toString() === targetUserId);
    if (userAlreadyInvitedAsModerator) {
      throw new AppError(400, 'You have already invitied this user to join as moderator. Only 1 invitation is allowed per user.');
    }

    const userAlreadyModerator = community.moderators.find((user) => user.toString() === targetUserId);
    if (userAlreadyModerator) {
      throw new AppError(400, 'This user is already a moderator of this community.');
    }
  }

  static isUserInLists (community: CommunitySchemaType, listNames: CommunityListType[], userId: string): { [list: string]: boolean } {
    const existInLists: { [list: string]: boolean } = {};
    for (const list of listNames) {
      const isInList = community[list].find((user) => user.toString() === userId);
      if (isInList) {
        existInLists[list] = true;
      }
    }

    return existInLists;
  }

  static removeUserFromLists (community: CommunitySchemaType, listNames: CommunityListType[], userId: string): void {
    for (const list of listNames) {
      if (list !== 'moderators') {
        community[list] = community[list].filter((user) => user.toString() !== userId);
      } else {
        community.moderators = community.moderators
          .filter((moderator) => moderator.user.toString() !== userId) as typeof community.moderators;
      }
    }
  }

  static async createInviteUserNotification (
    targetUserId: string,
    invitatorId: string,
    communityId: string,
    communityName: string,
    notificationType: 'becomeCommunityMemberRequest' | 'becomeCommunityModeratorRequest'
  ) {
    try {
      const invitator = await User.findById(invitatorId).select('fullName profilePhotoUrl');

      const inviteUserNotification = await Notification.create({
        receiver: targetUserId,
        sender: invitatorId,
        notificationType: notificationType,
        text: `<sender>${invitator.fullName}</sender> have invited you to join "${communityName}" community ${notificationType === 'becomeCommunityModeratorRequest' ? 'as moderator' : ''}.`,
        community: communityId
      });

      const populatedInviteNotification = await inviteUserNotification.populate({ path: 'sender', select: 'fullName profilePhotoUrl' });

      return populatedInviteNotification;
    } catch (error: unknown) {
      throw error;
    }
  }
}

export default CommunityService;