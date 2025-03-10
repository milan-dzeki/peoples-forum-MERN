import { Types } from 'mongoose';
import Chat from 'models/chatModel';
import Community, { CommunitySchemaType } from 'models/communityModel';
import Notification from 'models/notificationModel';
import User from 'models/userModel';
import { 
  CommunityListType, 
  CommunityRuleType, 
  CommunityUpdateRuleType,  
  ModeratorNotificationType, 
  SendUpdateFieldRequestResponseType, 
  UpdateFieldResponseJsonType
} from 'types/controllers/community';
import AppError from 'utils/appError';
import { PreparedNotificationType } from 'types/models/notificationModelTypes';
import CommunityValidator from 'configs/validators/community/communityValidator';
import { CommunityModeratorChangeRequestSchemaType } from 'models/communityModeratorChangeRequestModel';
import cloudinary from 'configs/cloudinary';

class CommunityService {
  static updateFieldHandlers = {
    handleUpdateDescription: async (
      community: CommunitySchemaType, 
      newDescription: any, 
      shouldValidate?: boolean,
      moderatorRequest?: CommunityModeratorChangeRequestSchemaType
    ) => {
      if (shouldValidate) {
        CommunityValidator.validateStringValues(newDescription, 'description', true);
      }

      community.description = newDescription;
      await community.save();

      if (moderatorRequest) {
        moderatorRequest.status = 'approved';
        await moderatorRequest.save();
      }

      return community.description;
    },
    handleUpdateProfilePhoto: async (
      community: CommunitySchemaType, 
      photo: { secure_url: string, public_id: string }, 
      moderatorRequest?: CommunityModeratorChangeRequestSchemaType,
      shouldValidate?: boolean
    ) => {
      if (shouldValidate) {
        if (!photo || (photo && (!photo.secure_url || !photo.public_id))) {
          throw new AppError(404, 'Valid update photo is not found. operation failed');
        }
      }
      const imageToDelete = community.profileImagePublicId;
      if (imageToDelete) {
        await cloudinary.uploader.destroy(imageToDelete);
      }
      community.profileImageUrl = photo.secure_url;
      community.profileImagePublicId = photo.public_id;
      await community.save();

      if (moderatorRequest) {
        moderatorRequest.status = 'approved';
        await moderatorRequest.save();
      }

      return community.profileImageUrl;
    },
    handleUpdateBannerPhoto: async (
      community: CommunitySchemaType, 
      photo: { secure_url: string, public_id: string }, 
      moderatorRequest?: CommunityModeratorChangeRequestSchemaType,
      shouldValidate?: boolean
    ) => {
      if (shouldValidate) {
        if (!photo || (photo && (!photo.secure_url || !photo.public_id))) {
          throw new AppError(404, 'Valid update photo is not found. operation failed');
        }
      }
      const imageToDelete = community.bannerImagePublicId;
      if (imageToDelete) {
        await cloudinary.uploader.destroy(imageToDelete);
      }
      community.bannerImageUrl = photo.secure_url;
      community.bannerImagePublicId = photo.public_id;
      await community.save();

      if (moderatorRequest) {
        moderatorRequest.status = 'approved';
        await moderatorRequest.save();
      }

      return community.bannerImageUrl;
    },
    handleRemoveProfilePhoto: async (
      community: CommunitySchemaType, 
      moderatorRequest: CommunityModeratorChangeRequestSchemaType | null = null, 
      shouldValidate?: boolean
    ) => {
      if (shouldValidate) {
        if (!community.profileImagePublicId) {
          throw new AppError(404, 'Community doesnt have profile image, so there is nothing to remove');
        }
      }

      await cloudinary.uploader.destroy(community.profileImagePublicId as string);

      community.profileImageUrl = null;
      community.profileImagePublicId = null;
      await community.save();

      if (moderatorRequest) {
        moderatorRequest.status = 'approved';
        await moderatorRequest.save();
      }

      return null;
    },
    handleRemoveBannerPhoto: async (
      community: CommunitySchemaType, 
      moderatorRequest: CommunityModeratorChangeRequestSchemaType | null = null, 
      shouldValidate?: boolean
    ) => {
      if (shouldValidate) {
        if (!community.bannerImagePublicId) {
          throw new AppError(404, 'Community doesnt have profile image, so there is nothing to remove');
        }
      }

      await cloudinary.uploader.destroy(community.bannerImagePublicId as string);

      community.bannerImageUrl = null;
      community.bannerImagePublicId = null;
      await community.save();

      if (moderatorRequest) {
        moderatorRequest.status = 'approved';
        await moderatorRequest.save();
      }

      return null;
    },
    handleAddRule: async (
      community: CommunitySchemaType, 
      newRule: CommunityRuleType,
      moderatorRequest?: CommunityModeratorChangeRequestSchemaType, 
      shouldValidate?: boolean
    ) => {
      if (shouldValidate) {
        if (!newRule || (newRule && !newRule.title)) {
          throw new AppError(400, 'Invalid rule provided. Must have title.');
        }

        CommunityValidator.areRulesValid([newRule], true);
      }

      community.rules.push(newRule);
      await community.save();

      if (moderatorRequest) {
        moderatorRequest.status = 'approved';
        await moderatorRequest.save();
      }

      return newRule;
    },
    handleUpdateSingleRule: async (
      community: CommunitySchemaType,
      rule: CommunityUpdateRuleType,
      ruleIndex: number,
      moderatorRequest?: CommunityModeratorChangeRequestSchemaType, 
      shouldValidate?: boolean
    ) => {
      if (shouldValidate) {
        if (!rule || (rule && (!rule._id || !rule.title))) {
          throw new AppError(422, 'Invalid rule data provided');
        }

        if (ruleIndex === -1) {
          throw new AppError(400, 'Rule at provided position is not found');
        }
      }

      community.rules[ruleIndex].title = rule.title;
      community.rules[ruleIndex].description = rule.description || '';

      await community.save();
      if (moderatorRequest) {
        moderatorRequest.status = 'approved';
        await moderatorRequest.save();
      }

      return rule;
    },
    handleUpdateCommunityRules: async (
      community: CommunitySchemaType,
      rules: (CommunityRuleType | CommunityUpdateRuleType)[],
      moderatorRequest?: CommunityModeratorChangeRequestSchemaType, 
      shouldValidate?: boolean
    ) => {
      if (shouldValidate) {
        if (!rules || (rules && rules.length === 0)) {
          throw new AppError(422, 'No rules have been provided');
        }
        CommunityValidator.areRulesValid(rules, true);
      }

      community.set('rules', rules);
      await community.save();

      if (moderatorRequest) {
        moderatorRequest.status = 'approved';
        await moderatorRequest.save();
      }

      return community.rules;
    },
    handleDeleteSingleRule: async (
      community: CommunitySchemaType,
      ruleId: string,
      moderatorRequest?: CommunityModeratorChangeRequestSchemaType, 
      shouldValidate?: boolean
    ) => {
      if(shouldValidate) {
        CommunityService.doesRuleExist(community.rules, ruleId);
      }

      community.rules = community.rules.filter((rule) => rule._id.toString() !== ruleId.toString()) as typeof community.rules;
      await community.save();

      if (moderatorRequest) {
        moderatorRequest.status = 'approved';
        await moderatorRequest.save();
      }

      return null;
    },
    handleDeleteMultipleRules: async (
      community: CommunitySchemaType,
      ruleIds: string[],
      moderatorRequest?: CommunityModeratorChangeRequestSchemaType, 
      shouldValidate?: boolean
    ) => {
      if (shouldValidate) {
        if (!ruleIds || (ruleIds && ruleIds.length === 0)) {
          throw new AppError(422, 'No rule ids are provided');
        }
      }

      community.rules = community.rules.filter((rule) => !ruleIds.includes(rule._id.toString())) as typeof community.rules;
      await community.save();

      if (moderatorRequest) {
        moderatorRequest.status = 'approved';
        await moderatorRequest.save();
      }

      return null;
    },
    handleDeleteAllRules: async (
      community: CommunitySchemaType,
      moderatorRequest?: CommunityModeratorChangeRequestSchemaType, 
    ) => {
      community.set('rules', []);
      await community.save();

      if (moderatorRequest) {
        moderatorRequest.status = 'approved';
        await moderatorRequest.save();
      }

      return null;
    }
  }

  static getUpdateRuleIndex (
    communityRules: CommunitySchemaType['rules'],
    rule: CommunityUpdateRuleType
  ) {
    const targetRuleIndex = communityRules.findIndex((oldRule) => oldRule._id.toString() === rule._id.toString());
    if (targetRuleIndex === -1) {
      throw new AppError(400, 'Rule at provided position is not found');
    }

    return targetRuleIndex;
  }

  static doesRuleExist (communityRules: CommunitySchemaType['rules'], ruleId: string) {
    if (!ruleId) {
      throw new AppError(400, 'Rule id not provided');
      return;
    }

    const ruleExist = communityRules.find((rule) => rule._id.toString() === ruleId.toString());
    if (!ruleExist) {
      throw new AppError(404, 'Rule for provided id is not found');
    }
  }

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
    console.log(community, listNames, userId)
    for (const list of listNames) {
      console.log(community[list])
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
    doNotIncludeIds?: (Types.ObjectId | string)[]
  ): (Types.ObjectId | string)[] {
    let ids = [...moderators.map((moderator) => moderator.user), communityCreatorId];

    if (doNotIncludeIds) {
      const doNotIncludeIdsString = doNotIncludeIds.map((user) => user.toString());
      ids = ids.filter((user) => !doNotIncludeIdsString.includes(user.toString()))
    }
    return ids;
  }

  static async createCreatorAndModeratorNotifications (
    moderators: CommunitySchemaType['moderators'],
    communityCreatorId: Types.ObjectId | string,
    notificationInput: ModeratorNotificationType,
    doNotIncludeIds?: (Types.ObjectId | string)[],
  ) {
    try {
      const moderatorIds = this.extractCreatorAndModeratorIds(moderators, communityCreatorId, doNotIncludeIds);

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

  static createUpdateFieldRequestResponse (parameters: SendUpdateFieldRequestResponseType) {
    const {
      res,
      message,
      moderatorNotifications,
      approvedRequestModeratorNotification,
      newDescription,
      newProfilePhoto,
      newBannerPhoto,
      newRule,
      updatedRule,
      updatedRules
    } = parameters;

    const responseJson: UpdateFieldResponseJsonType = {
      status: 'success',
      message,
      moderatorNotifications
    };

    if (approvedRequestModeratorNotification) {
      responseJson.approvedRequestModeratorNotification = approvedRequestModeratorNotification;
    }

    if (newDescription) {
      responseJson.newDescription = newDescription;
    }

    if (newProfilePhoto) {
      responseJson.newProfilePhoto = newProfilePhoto;
    }

    if (newBannerPhoto) {
      responseJson.newBannerPhoto = newBannerPhoto;
    }

    if (newRule) {
      responseJson.newRule = newRule;
    }

    if (updatedRule) {
      responseJson.updatedRule = updatedRule;
    }

    if (updatedRules) {
      responseJson.updatedRules = updatedRules;
    }

    return res.status(200).json(responseJson);
  }
}

export default CommunityService;