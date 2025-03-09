import cloudinary from 'configs/cloudinary';
import { COMMUNITY_LOG_TYPE } from 'configs/communityActivityLogs';
import { NOTIFICATION_TYPES } from 'configs/notifications';
import CommunityValidator from 'configs/validators/community/communityValidator';
import CommunityActivityLog from 'models/communityActivityLogs';
import { CommunitySchemaType } from 'models/communityModel';
import CommunityModeratorChangeRequest, { CommunityModeratorChangeRequestSchemaType } from 'models/communityModeratorChangeRequestModel';
import Notification from 'models/notificationModel';
import { Types } from 'mongoose';
import { ModeratorRequestType } from 'types/controllers/communityModeratorRequests';
import AppError from 'utils/appError';


class CommunityModeratorChangeRequestService {
  static acceptUpdateCommunityField = {
    update_description: async(
      community: CommunitySchemaType,
      moderatorRequest: CommunityModeratorChangeRequestSchemaType,
      shouldNotifyModerator?: boolean
    ) => {
      try {
        const updatedDescription = moderatorRequest.newDescriptionValue as any;
        const descriptionError = CommunityValidator.validateStringValues(updatedDescription, 'description');
        if (descriptionError) {
          throw new AppError(422, descriptionError);
        }

        community.description = updatedDescription;
        await community.save();

        moderatorRequest.status = 'approved';
        await moderatorRequest.save();

        await CommunityActivityLog.create({
          community: community._id,
          logType: COMMUNITY_LOG_TYPE.HANDLE_MODERATOR_REQUESTS,
          moderator: moderatorRequest.moderator,
          text: `approved request to update community description to "${community.description}" made by moderator`,
          moderatorRequest: moderatorRequest._id
        });

        if (shouldNotifyModerator) {
          const moderatorNotification = await Notification.create({
            receiver: moderatorRequest.moderator,
            notificationType: NOTIFICATION_TYPES.MODERATOR_CHANGE_REQUEST_APPROVED,
            text: `Your request to ${moderatorRequest.requestType} to "${moderatorRequest.requestType}" for "${community.name}" community has been approved`,
            community: community._id
          });

          return moderatorNotification;
        }

        return null;
      } catch (error: unknown) {
        throw error;
      }
    },
    update_profile_photo: async(
      community: CommunitySchemaType,
      moderatorRequest: CommunityModeratorChangeRequestSchemaType,
      shouldNotifyModerator?: boolean
    ) => {
      const moderatorNotification = await this.updateCommunityPhoto(
        community,
        moderatorRequest,
        'profile',
        shouldNotifyModerator
      );

      return moderatorNotification;
    },
    remove_profile_photo: async(
      community: CommunitySchemaType,
      moderatorRequest: CommunityModeratorChangeRequestSchemaType,
      shouldNotifyModerator?: boolean
    ) => {
      const moderatorNotification = this.removeCommunityPhoto(
        community,
        moderatorRequest,
        'profile',
        shouldNotifyModerator
      );

      return moderatorNotification;
    },
    update_banner_photo: async (
      community: CommunitySchemaType,
      moderatorRequest: CommunityModeratorChangeRequestSchemaType,
      shouldNotifyModerator?: boolean
    ) => {
      const moderatorNotification = await this.updateCommunityPhoto(
        community,
        moderatorRequest,
        'banner',
        shouldNotifyModerator
      );

      return moderatorNotification;
    },
    remove_banner_photo: async(
      community: CommunitySchemaType,
      moderatorRequest: CommunityModeratorChangeRequestSchemaType,
      shouldNotifyModerator?: boolean
    ) => {
      const moderatorNotification = this.removeCommunityPhoto(
        community,
        moderatorRequest,
        'banner',
        shouldNotifyModerator
      );

      return moderatorNotification;
    },
    add_rule: async (
      community: CommunitySchemaType,
      moderatorRequest: CommunityModeratorChangeRequestSchemaType,
      shouldNotifyModerator?: boolean
    ) => {
      try {
        if (
          !moderatorRequest.newRules ||
          (moderatorRequest.newRules && moderatorRequest.newRules.length !== 1) 
        ) {
          throw new AppError(400, 'Invalid rule found. Operation failed');
        }
        const newRule = moderatorRequest.newRules[0];

        if (!newRule || (newRule && !newRule.title)) {
          throw new AppError(400, 'Rule to add not provided');
        }

        const ruleInvalidError = CommunityValidator.areRulesValid([newRule] as Array<{ title: string, description: string }>);
        if (ruleInvalidError) {
          throw new AppError(422, 'Rule data invalid', { rule: ruleInvalidError });
        }

        community.rules.push(newRule);
        await community.save();

        moderatorRequest.status = 'approved';
        await moderatorRequest.save();

        await CommunityActivityLog.create({
          community: community._id,
          logType: COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
          moderator: moderatorRequest.moderator,
          text: `approved request to add community rule by moderator`,
          moderatorRequest: moderatorRequest._id
        });

        if (shouldNotifyModerator) {
          const moderatorNotification = await Notification.create({
            receiver: moderatorRequest.moderator,
            notificationType: NOTIFICATION_TYPES.MODERATOR_CHANGE_REQUEST_APPROVED,
            text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been approved`,
            community: community._id
          });

          return moderatorNotification;
        }

        return null;
      } catch (error: unknown) {
        throw error;
      }
    },
    update_single_rule: async (
      community: CommunitySchemaType,
      moderatorRequest: CommunityModeratorChangeRequestSchemaType,
      shouldNotifyModerator?: boolean
    ) => {
      try {
        if (
          !moderatorRequest.newRules ||
          (moderatorRequest.newRules && moderatorRequest.newRules.length !== 1) 
        ) {
          throw new AppError(400, 'Invalid rule found. Operation failed');
        }
        const newRule = moderatorRequest.newRules[0];
        console.log(newRule)

        if (!newRule || (newRule && !newRule.title)) {
          throw new AppError(400, 'Rule to add not provided');
        }

        const ruleInvalidError = CommunityValidator.areRulesValid([newRule] as Array<{ id: string, title: string, description: string }>);
        if (ruleInvalidError) {
          throw new AppError(422, 'Rule data invalid', { rule: ruleInvalidError });
        }

        const targetRuleIndex = community.rules.findIndex((rule) => rule._id.toString() === newRule!._id!.toString());
        if (targetRuleIndex === -1) {
          throw (new AppError(400, 'Rule at provided position is not found'));
        }
      
        const updatedRule = community.rules[targetRuleIndex];
        updatedRule.title = newRule.title;
        updatedRule.description = newRule.description;
      
        await community.save();

        moderatorRequest.status = 'approved';
        await moderatorRequest.save();

        await CommunityActivityLog.create({
          community: community._id,
          logType: COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
          moderator: moderatorRequest.moderator,
          text: `approved request to update community rule by moderator`,
          moderatorRequest: moderatorRequest._id
        });

        if (shouldNotifyModerator) {
          const moderatorNotification = await Notification.create({
            receiver: moderatorRequest.moderator,
            notificationType: NOTIFICATION_TYPES.MODERATOR_CHANGE_REQUEST_APPROVED,
            text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been approved`,
            community: community._id
          });

          return moderatorNotification;
        }

        return null;
      } catch (error) {
        throw error;
      }
    },
    update_rules: async (
      community: CommunitySchemaType,
      moderatorRequest: CommunityModeratorChangeRequestSchemaType,
      shouldNotifyModerator?: boolean
    ) => {
      try {
        if (
          !moderatorRequest.newRules ||
          (moderatorRequest.newRules && moderatorRequest.newRules.length === 0) 
        ) {
          throw new AppError(400, 'Invalid rules found. Operation failed');
        }

        const ruleInvalidError = CommunityValidator.areRulesValid(moderatorRequest.newRules as Array<{ _id: Types.ObjectId, title: string, description: string }>);
        if (ruleInvalidError) {
          throw new AppError(422, 'Rules data invalid', { rule: ruleInvalidError });
        }
      
        community.rules = moderatorRequest.newRules as typeof community.rules;
        await community.save();

        moderatorRequest.status = 'approved';
        await moderatorRequest.save();

        await CommunityActivityLog.create({
          community: community._id,
          logType: COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
          moderator: moderatorRequest.moderator,
          text: `approved request to update community rules by moderator`,
          moderatorRequest: moderatorRequest._id
        });

        if (shouldNotifyModerator) {
          const moderatorNotification = await Notification.create({
            receiver: moderatorRequest.moderator,
            notificationType: NOTIFICATION_TYPES.MODERATOR_CHANGE_REQUEST_APPROVED,
            text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been approved`,
            community: community._id
          });

          return moderatorNotification;
        }

        return null;
      } catch (error) {
        throw error;
      }
    },
    delete_single_rule: async (
      community: CommunitySchemaType,
      moderatorRequest: CommunityModeratorChangeRequestSchemaType,
      shouldNotifyModerator?: boolean
    ) => {
      try {
        if (
          !moderatorRequest.deleteRuleIds ||
          (moderatorRequest.deleteRuleIds && moderatorRequest.deleteRuleIds.length === 0) 
        ) {
          throw new AppError(400, 'No rules provided for deletion');
        }

        const ruleToDelete = moderatorRequest.deleteRuleIds[0];
        community.rules = community.rules.filter((rule) => rule._id.toString() !== ruleToDelete.toString()) as typeof community.rules;
        await community.save();

        moderatorRequest.status = 'approved';
        await moderatorRequest.save();

        await CommunityActivityLog.create({
          community: community._id,
          logType: COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
          moderator: moderatorRequest.moderator,
          text: `approved request to delete community rule by moderator`,
          moderatorRequest: moderatorRequest._id
        });

        if (shouldNotifyModerator) {
          const moderatorNotification = await Notification.create({
            receiver: moderatorRequest.moderator,
            notificationType: NOTIFICATION_TYPES.MODERATOR_CHANGE_REQUEST_APPROVED,
            text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been approved`,
            community: community._id
          });

          return moderatorNotification;
        }

        return null;
      } catch (error) {
        throw error;
      }
    },
    delete_multiple_rules: async (
      community: CommunitySchemaType,
      moderatorRequest: CommunityModeratorChangeRequestSchemaType,
      shouldNotifyModerator?: boolean
    ) => {
      try {
        if (
          !moderatorRequest.deleteRuleIds ||
          (moderatorRequest.deleteRuleIds && moderatorRequest.deleteRuleIds.length === 0) 
        ) {
          throw new AppError(400, 'No rules provided for deletion');
        }

        community.rules = community.rules.filter((rule) => !moderatorRequest.deleteRuleIds.includes(rule._id.toString())) as typeof community.rules;
        await community.save();

        moderatorRequest.status = 'approved';
        await moderatorRequest.save();

        await CommunityActivityLog.create({
          community: community._id,
          logType: COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
          moderator: moderatorRequest.moderator,
          text: `approved request to delete multiple community rule by moderator`,
          moderatorRequest: moderatorRequest._id
        });

        if (shouldNotifyModerator) {
          const moderatorNotification = await Notification.create({
            receiver: moderatorRequest.moderator,
            notificationType: NOTIFICATION_TYPES.MODERATOR_CHANGE_REQUEST_APPROVED,
            text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been approved`,
            community: community._id
          });

          return moderatorNotification;
        }

        return null;
      } catch (error) {
        throw error;
      }
    },
    delete_all_rules: async (
      community: CommunitySchemaType,
      moderatorRequest: CommunityModeratorChangeRequestSchemaType,
      shouldNotifyModerator?: boolean
    ) => {
      try {
        community.set('rules', []);
        await community.save();

        moderatorRequest.status = 'approved';
        await moderatorRequest.save();

        await CommunityActivityLog.create({
          community: community._id,
          logType: COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
          moderator: moderatorRequest.moderator,
          text: `approved request to delete all community rule by moderator`,
          moderatorRequest: moderatorRequest._id
        });

        if (shouldNotifyModerator) {
          const moderatorNotification = await Notification.create({
            receiver: moderatorRequest.moderator,
            notificationType: NOTIFICATION_TYPES.MODERATOR_CHANGE_REQUEST_APPROVED,
            text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been approved`,
            community: community._id
          });

          return moderatorNotification;
        }

        return null;
      } catch (error) {
        throw error;
      }
    }
  }

  static async updateCommunityPhoto (
    community: CommunitySchemaType,
    moderatorRequest: CommunityModeratorChangeRequestSchemaType,
    photoName: 'profile' | 'banner',
    shouldNotifyModerator?: boolean
  ) {
    try {
      const targetPhoto = moderatorRequest.photo as any;
      if (
        !targetPhoto &&
        (targetPhoto && !targetPhoto.public_id && !targetPhoto.secure_url)
      ) {
        throw new AppError(400, `Request ${photoName} photo not found`);
      }

      if (community.bannerImagePublicId) {
        await cloudinary.uploader.destroy(community.bannerImagePublicId);
      }
      const targetUrl = photoName === 'profile' ? 'profileImageUrl' : 'bannerImageUrl';
      const targetPublicId = photoName === 'profile' ? 'profileImagePublicId' : 'bannerImagePublicId';

      community[targetUrl] = targetPhoto.secure_url;
      community[targetPublicId] = targetPhoto.public_id;
      await community.save();

      moderatorRequest.status = 'approved';
      await moderatorRequest.save();

      await CommunityActivityLog.create({
        community: community._id,
        logType: COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
        moderator: moderatorRequest.moderator,
        text: `approved request to update community ${photoName} photo made by moderator`,
        moderatorRequest: moderatorRequest._id,
        photoUrl: targetPhoto.secure_url
      });

      if (shouldNotifyModerator) {
        const moderatorNotification = await Notification.create({
          receiver: moderatorRequest.moderator,
          notificationType: NOTIFICATION_TYPES.MODERATOR_CHANGE_REQUEST_APPROVED,
          text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been approved`,
          community: community._id
        });

        return moderatorNotification;
      }

      return null;
    } catch (error: unknown) {
      throw error;
    }
  }

  static async removeCommunityPhoto (
    community: CommunitySchemaType,
    moderatorRequest: CommunityModeratorChangeRequestSchemaType,
    photoName: 'profile' | 'banner',
    shouldNotifyModerator?: boolean
  ) {
    try {
      const targetUrl = photoName === 'profile' ? 'profileImageUrl' : 'bannerImageUrl';
      const targetPublicId = photoName === 'profile' ? 'profileImagePublicId' : 'bannerImagePublicId';

      if (!community[targetUrl] && !community[targetPublicId]) {
        throw new AppError(404, 'Community doesnt have profile photo');
      }

      await cloudinary.uploader.destroy(community[targetPublicId]!);

      community[targetUrl] = null;
      community[targetPublicId] = null;
      await community.save();

      moderatorRequest.status = 'approved';
      await moderatorRequest.save();

      await CommunityActivityLog.create({
        community: community._id,
        logType: COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
        moderator: moderatorRequest.moderator,
        text: `approved request to remove community ${photoName} photo made by moderator`,
        moderatorRequest: moderatorRequest._id
      });

      if (shouldNotifyModerator) {
        const moderatorNotification = await Notification.create({
          receiver: moderatorRequest.moderator,
          notificationType: NOTIFICATION_TYPES.MODERATOR_CHANGE_REQUEST_APPROVED,
          text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been approved`,
          community: community._id
        });

        return moderatorNotification;
      }

      return null;
    } catch (error: unknown) {
      throw error;
    }
  }

  static async removeRequestPhotoIfItExists (photo: any) {
    if (
      !photo || 
      (photo && !photo.secure_url && !photo.public_id)
    ) {
      return;
    }

    await cloudinary.uploader.destroy(photo.public_id);
  }

  static async createNewModeratorRequest (
    requestType: ModeratorRequestType,
    communityId: Types.ObjectId,
    communityCreator: Types.ObjectId,
    moderator: Types.ObjectId,
    requestText: string,
  ): Promise<CommunityModeratorChangeRequestSchemaType> {
    try {
      const moderatorRequest = await CommunityModeratorChangeRequest.create({
        requestType,
        community: communityId,
        communityCreator,
        moderator,
        requestText
      });

      return moderatorRequest;
    } catch (error: unknown) {
      throw error;
    }
  }
}

export default CommunityModeratorChangeRequestService;