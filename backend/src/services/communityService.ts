import { Types } from 'mongoose';
import Chat from 'models/chatModel';
import Community, { CommunitySchemaType } from 'models/communityModel';
import Notification from 'models/notificationModel';
import User from 'models/userModel';
import { CommunityListType, HandleSendModeratorRequestResponseActionParameters, ModeratorNotificationType } from 'types/controllers/community';
import AppError from 'utils/appError';
import CommunityModeratorChangeRequestService from './communityModeratorChangeRequestsSerivce';
import CommunityActivityLogsService from './communityActivityLogsService';
import { PreparedNotificationType } from 'types/models/notificationModelTypes';

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

  static removeUserFromLists (community: CommunitySchemaType, listNames: CommunityListType[], userId: string): void {
    for (const list of listNames) {
      community[list].pull({ user: userId });
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

  static extractCreatorAndModeratorIds (
    moderators: CommunitySchemaType['moderators'],
    communityCreatorId: Types.ObjectId | string,
    doNotIncludeId: Types.ObjectId | string
  ): (Types.ObjectId | string)[] {
    const ids = [...moderators.map((moderator) => moderator.user), communityCreatorId].filter((user) => user.toString() !== doNotIncludeId.toString());
    return ids;
  }

  static async createCreatorAndModeratorNotifications (
    moderators: CommunitySchemaType['moderators'],
    communityCreatorId: Types.ObjectId | string,
    doNotIncludeId: Types.ObjectId | string,
    notificationInput: ModeratorNotificationType
  ) {
    try {
      const moderatorIds = this.extractCreatorAndModeratorIds(moderators, communityCreatorId, doNotIncludeId);

      const {
        notificationType,
        text,
        sender,
        communityId
      } = notificationInput;

      const preparedNotifications: PreparedNotificationType[] = [];

      for (const moderatorId of moderatorIds) {
        preparedNotifications.push({
          receiver: moderatorId,
          notificationType,
          text,
          sender,
          communityId
        });
      }

      const notifications = await Notification.insertMany(preparedNotifications);
      
      return notifications;
    } catch (error: unknown) {
      throw error;
    }
  }

  static async handleSendModeratorRequestResponseAction (parameters: HandleSendModeratorRequestResponseActionParameters) {
    try {
      const {
        commons: {
          communityId,
          moderator
        },
        moderatorRequestData: {
          requestType,
          communityCreator,
          requestText,
          updateValues
        },
        communityActivityLogData: {
          logType,
          text,
          photoUrl
        },
        resJson: {
          res, 
          message
        }
      } = parameters;

      const moderatorRequest = await CommunityModeratorChangeRequestService.createNewModeratorRequest({
        requestType,
        communityId,
        communityCreator,
        moderator,
        requestText,
        updateValues: updateValues || {}
      });

      await CommunityActivityLogsService.createNewCommunityActivityLog({
        communityId,
        logType,
        moderator,
        text,
        moderatorRequest: moderatorRequest._id,
        photoUrl: photoUrl || undefined
      });

      return CommunityModeratorChangeRequestService.sendModeratorRequestResponse({
        res,
        message,
        moderatorRequest
      });
    } catch (error: unknown) {
      throw error;
    }
  }
}

export default CommunityService;