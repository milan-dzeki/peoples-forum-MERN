import Chat from 'models/chatModel';
import Community from 'models/communityModel';
import AppError from 'utils/appError';


class CommunityService {
  static async createCommunityChatsUponCommunityCreation (creatorId: string, communityId: string, chatNames: string[]) {
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
      await Chat.deleteMany({ creator: creatorId, communityId });
      await Community.deleteOne({ _id: communityId, creator: creatorId });
      
      throw new AppError(500, 'Failed to create chats for community. Maybe servers are down. Reftesh the page and try again');
    }
  }

  static async removeUserFromAllCommunityChats (communityId: string, communityChatsLength: number, userId: string, actionFailMsg: string) {
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
}

export default CommunityService;