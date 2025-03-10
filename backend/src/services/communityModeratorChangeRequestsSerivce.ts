import { Response } from 'express';
import cloudinary from 'configs/cloudinary';
import { COMMUNITY_LOG_TYPE } from 'configs/community/communityActivityLogs';
import { ALLOWED_MODERATOR_REQUEST_UPDATE_VALUES } from 'configs/community/communityModeratorChangeRequests';
import { NOTIFICATION_TYPES } from 'configs/notifications';
import { CommunitySchemaType } from 'models/communityModel';
import CommunityModeratorChangeRequest, { CommunityModeratorChangeRequestSchemaType } from 'models/communityModeratorChangeRequestModel';
import { CreateModeratorRequestParameteresType, PrepareNewModeratorRequestType, SendModeratorRequestResponseParametersType } from 'types/controllers/communityModeratorRequests';
import AppError from 'utils/appError';
import CommunityService from './communityService';
import HandleSendUpdateCommunityFieldRequestResponseActionBuilder from 'utils/builders/community/handleSendUpdateCommunityFieldRequestResponseAction';
import { CommunityRuleType, CommunityUpdateRuleType } from 'types/controllers/community';

class CommunityModeratorChangeRequestService {
  static acceptUpdateCommunityField = {
    update_description: async(
      community: CommunitySchemaType,
      moderatorRequest: CommunityModeratorChangeRequestSchemaType,
      res: Response
    ) => {
      try {
        const updatedDescription = moderatorRequest.newDescriptionValue as any;

        const prepareResponse = new HandleSendUpdateCommunityFieldRequestResponseActionBuilder()
          .setResponseField('newDescription')
          .setFieldUpdateHandler(
            CommunityService.updateFieldHandlers.handleUpdateDescription.bind(
              null,
              community,
              updatedDescription,
              true,
              moderatorRequest
            )
          )
          .setCommunityId(community._id)
          .setCommunityActivityLogData({
            moderator: moderatorRequest.moderator,
            logType: COMMUNITY_LOG_TYPE.HANDLE_MODERATOR_REQUESTS,
            text: `accepted *user* request to update community description to "${updatedDescription}"`,
          })
          .setApprovedRequestModeratorNotification({
            receiver: moderatorRequest.moderator,
            text: `Your request to "${moderatorRequest.requestType}" for "${community.name}" community has been approved`
          })
          .setModeratorsNotificationsData({
            moderators: community.moderators,
            communityCreator: community.creator,
            notificationType: NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
            text: `"${community.name}" community description was changed`,
            sender: community.creator,
            doNotIncludeIds: [community.creator, moderatorRequest.moderator]
          })
          .setResJson({
            res,
            message: 'Community description updated successfully'
          });
      
        const response = await prepareResponse.execute();
      
        return response;
      } catch (error: unknown) {
        throw error;
      }
    },
    update_profile_photo: async(
      community: CommunitySchemaType,
      moderatorRequest: CommunityModeratorChangeRequestSchemaType,
      res: Response
    ) => {
      const moderatorRequestPhoto = moderatorRequest.photo;

      const prepareUpdateResponse = new HandleSendUpdateCommunityFieldRequestResponseActionBuilder()
        .setResponseField('newProfilePhoto')
        .setCommunityId(community._id)
        .setFieldUpdateHandler(
          CommunityService.updateFieldHandlers.handleUpdateProfilePhoto.bind(
            null,
            community,
            moderatorRequestPhoto as { secure_url: string, public_id: string },
            moderatorRequest,
            true
          )
        )
        .setCommunityActivityLogData({
          moderator: moderatorRequest.moderator,
          logType: COMMUNITY_LOG_TYPE.HANDLE_MODERATOR_REQUESTS,
          text: 'accepted *user* request to update community profile photo'
        })
        .setApprovedRequestModeratorNotification({
          receiver: moderatorRequest.moderator,
          text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been approved`
        })
        .setModeratorsNotificationsData({
          moderators: community.moderators,
          communityCreator: community.creator,
          notificationType: NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
          text: `"${community.name}" community profile photo was changed`,
          sender: community.creator,
          doNotIncludeIds: [community.creator, moderatorRequest.moderator]
        })
        .setResJson({
          res,
          message: 'Community profile photo updated successfully'
        });
    
      const updateResponse = await prepareUpdateResponse.execute();
    
      return updateResponse;
    },
    remove_profile_photo: async(
      community: CommunitySchemaType,
      moderatorRequest: CommunityModeratorChangeRequestSchemaType,
      res: Response
    ) => {
      const prepareUpdateResponse = new HandleSendUpdateCommunityFieldRequestResponseActionBuilder()
        .setCommunityId(community._id)
        .setFieldUpdateHandler(
          CommunityService.updateFieldHandlers.handleRemoveProfilePhoto.bind(
            null,
            community,
            moderatorRequest,
            true
          )
        )
        .setCommunityActivityLogData({
          moderator: moderatorRequest.moderator,
          logType: COMMUNITY_LOG_TYPE.HANDLE_MODERATOR_REQUESTS,
          text: 'accepted *user* request to remove community profile photo'
        })
        .setApprovedRequestModeratorNotification({
          receiver: moderatorRequest.moderator,
          text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been approved`
        })
        .setModeratorsNotificationsData({
          moderators: community.moderators,
          communityCreator: community.creator,
          notificationType: NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
          text: `"${community.name}" community profile photo was removed`,
          sender: community.creator,
          doNotIncludeIds: [community.creator, moderatorRequest.moderator]
        })
        .setResJson({
          res,
          message: 'Community profile photo removed successfully'
        });
    
      const updateResponse = await prepareUpdateResponse.execute();
    
      return updateResponse;
    },
    update_banner_photo: async (
      community: CommunitySchemaType,
      moderatorRequest: CommunityModeratorChangeRequestSchemaType,
      res: Response
    ) => {
      const moderatorRequestPhoto = moderatorRequest.photo;

      const prepareUpdateResponse = new HandleSendUpdateCommunityFieldRequestResponseActionBuilder()
        .setResponseField('newBannerPhoto')
        .setCommunityId(community._id)
        .setFieldUpdateHandler(
          CommunityService.updateFieldHandlers.handleUpdateBannerPhoto.bind(
            null,
            community,
            moderatorRequestPhoto as { secure_url: string, public_id: string },
            moderatorRequest,
            true
          )
        )
        .setCommunityActivityLogData({
          moderator: moderatorRequest.moderator,
          logType: COMMUNITY_LOG_TYPE.HANDLE_MODERATOR_REQUESTS,
          text: 'accepted *user* request to update community banner photo'
        })
        .setApprovedRequestModeratorNotification({
          receiver: moderatorRequest.moderator,
          text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been approved`
        })
        .setModeratorsNotificationsData({
          moderators: community.moderators,
          communityCreator: community.creator,
          notificationType: NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
          text: `"${community.name}" community banner photo was changed`,
          sender: community.creator,
          doNotIncludeIds: [community.creator, moderatorRequest.moderator]
        })
        .setResJson({
          res,
          message: 'Community banner photo updated successfully'
        });
    
      const updateResponse = await prepareUpdateResponse.execute();
    
      return updateResponse;
    },
    remove_banner_photo: async(
      community: CommunitySchemaType,
      moderatorRequest: CommunityModeratorChangeRequestSchemaType,
      res: Response
    ) => {
      const prepareUpdateResponse = new HandleSendUpdateCommunityFieldRequestResponseActionBuilder()
        .setCommunityId(community._id)
        .setFieldUpdateHandler(
          CommunityService.updateFieldHandlers.handleRemoveBannerPhoto.bind(
            null,
            community,
            moderatorRequest,
            true
          )
        )
        .setCommunityActivityLogData({
          moderator: moderatorRequest.moderator,
          logType: COMMUNITY_LOG_TYPE.HANDLE_MODERATOR_REQUESTS,
          text: 'accepted *user* request to remove community banner photo'
        })
        .setApprovedRequestModeratorNotification({
          receiver: moderatorRequest.moderator,
          text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been approved`
        })
        .setModeratorsNotificationsData({
          moderators: community.moderators,
          communityCreator: community.creator,
          notificationType: NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
          text: `"${community.name}" community banner photo was removed`,
          sender: community.creator,
          doNotIncludeIds: [community.creator, moderatorRequest.moderator]
        })
        .setResJson({
          res,
          message: 'Community banner photo removed successfully'
        });
    
      const updateResponse = await prepareUpdateResponse.execute();
    
      return updateResponse;
    },
    add_rule: async (
      community: CommunitySchemaType,
      moderatorRequest: CommunityModeratorChangeRequestSchemaType,
      res: Response
    ) => {
      const newRule = moderatorRequest.newRules[0] as CommunityRuleType;

      const prepareUpdateResponse = new HandleSendUpdateCommunityFieldRequestResponseActionBuilder()
        .setResponseField('newRule')
        .setFieldUpdateHandler(
          CommunityService.updateFieldHandlers.handleAddRule.bind(
            null,
            community,
            newRule,
            moderatorRequest,
            true
          )
        )
        .setCommunityId(community._id)
        .setCommunityActivityLogData({
          moderator: moderatorRequest.moderator,
          logType: COMMUNITY_LOG_TYPE.HANDLE_MODERATOR_REQUESTS,
          text: 'accepted *user* request to add new community rule'
        })
        .setApprovedRequestModeratorNotification({
          receiver: moderatorRequest.moderator,
          text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been approved`
        })
        .setModeratorsNotificationsData({
          moderators: community.moderators,
          communityCreator: community.creator,
          notificationType: NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
          sender: community.creator,
          text: `"${community.name}" community has new rule added`,
          doNotIncludeIds: [community.creator, moderatorRequest.moderator]
        })
        .setResJson({
          res,
          message: 'New community rule added successfully'
        });

      const updateResponse = await prepareUpdateResponse.execute();

      return updateResponse;
    },
    update_single_rule: async (
      community: CommunitySchemaType,
      moderatorRequest: CommunityModeratorChangeRequestSchemaType,
      res: Response
    ) => {
      const updatedRule = moderatorRequest.newRules[0] as CommunityUpdateRuleType;
      const targetRuleIndex = CommunityService.getUpdateRuleIndex(community.rules, updatedRule);

      const prepareUpdateResponse = new HandleSendUpdateCommunityFieldRequestResponseActionBuilder()
        .setResponseField('updatedRule')
        .setFieldUpdateHandler(
          CommunityService.updateFieldHandlers.handleUpdateSingleRule.bind(
            null,
            community,
            updatedRule,
            targetRuleIndex,
            moderatorRequest,
            true
          )
        )
        .setCommunityId(community._id)
        .setCommunityActivityLogData({
          moderator: moderatorRequest.moderator,
          logType: COMMUNITY_LOG_TYPE.HANDLE_MODERATOR_REQUESTS,
          text: 'accepted *user* request to add update community rule'
        })
        .setApprovedRequestModeratorNotification({
          receiver: moderatorRequest.moderator,
          text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been approved`
        })
        .setModeratorsNotificationsData({
          moderators: community.moderators,
          communityCreator: community.creator,
          notificationType: NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
          sender: community.creator,
          text: `"${community.name}" community has 1 rule updated`,
          doNotIncludeIds: [community.creator, moderatorRequest.moderator]
        })
        .setResJson({
          res,
          message: 'Community rule updated successfully'
        });

      const updateResponse = await prepareUpdateResponse.execute();

      return updateResponse;
    },
    update_rules: async (
      community: CommunitySchemaType,
      moderatorRequest: CommunityModeratorChangeRequestSchemaType,
      res: Response
    ) => {
      const prepareUpdateResponse = new HandleSendUpdateCommunityFieldRequestResponseActionBuilder()
        .setResponseField('updatedRules')
        .setFieldUpdateHandler(
          CommunityService.updateFieldHandlers.handleUpdateCommunityRules.bind(
            null,
            community,
            moderatorRequest.newRules as (CommunityRuleType | CommunityUpdateRuleType)[],
            moderatorRequest,
            true
          )
        )
        .setCommunityId(community._id)
        .setCommunityActivityLogData({
          moderator: moderatorRequest.moderator,
          logType: COMMUNITY_LOG_TYPE.HANDLE_MODERATOR_REQUESTS,
          text: 'accepted *user* request to update community rules'
        })
        .setApprovedRequestModeratorNotification({
          receiver: moderatorRequest.moderator,
          text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been approved`
        })
        .setModeratorsNotificationsData({
          moderators: community.moderators,
          communityCreator: community.creator,
          notificationType: NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
          sender: community.creator,
          text: `"${community.name}" community rules have been updated`,
          doNotIncludeIds: [community.creator, moderatorRequest.moderator]
        })
        .setResJson({
          res,
          message: 'Community rules updated successfully'
        });

      const updateResponse = await prepareUpdateResponse.execute();

      return updateResponse;
    },
    delete_single_rule: async (
      community: CommunitySchemaType,
      moderatorRequest: CommunityModeratorChangeRequestSchemaType,
      res: Response
    ) => {
      const ruleId = moderatorRequest?.deleteRuleIds[0];
      const prepareUpdateResponse = new HandleSendUpdateCommunityFieldRequestResponseActionBuilder()
        .setResponseField('updatedRules')
        .setFieldUpdateHandler(
          CommunityService.updateFieldHandlers.handleDeleteSingleRule.bind(
            null,
            community,
            ruleId,
            moderatorRequest,
            true
          )
        )
        .setCommunityId(community._id)
        .setCommunityActivityLogData({
          moderator: moderatorRequest.moderator,
          logType: COMMUNITY_LOG_TYPE.HANDLE_MODERATOR_REQUESTS,
          text: 'accepted *user* request to delete 1 community rule'
        })
        .setApprovedRequestModeratorNotification({
          receiver: moderatorRequest.moderator,
          text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been approved`
        })
        .setModeratorsNotificationsData({
          moderators: community.moderators,
          communityCreator: community.creator,
          notificationType: NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
          sender: community.creator,
          text: `"${community.name}" community rule have been deleted`,
          doNotIncludeIds: [community.creator, moderatorRequest.moderator]
        })
        .setResJson({
          res,
          message: 'Community rule deleted successfully'
        });

      const updateResponse = await prepareUpdateResponse.execute();

      return updateResponse;
    },
    delete_multiple_rules: async (
      community: CommunitySchemaType,
      moderatorRequest: CommunityModeratorChangeRequestSchemaType,
      res: Response
    ) => {
      const ruleIds = moderatorRequest?.deleteRuleIds;
      const prepareUpdateResponse = new HandleSendUpdateCommunityFieldRequestResponseActionBuilder()
        .setFieldUpdateHandler(
          CommunityService.updateFieldHandlers.handleDeleteMultipleRules.bind(
            null,
            community,
            ruleIds,
            moderatorRequest,
            true
          )
        )
        .setCommunityId(community._id)
        .setCommunityActivityLogData({
          moderator: moderatorRequest.moderator,
          logType: COMMUNITY_LOG_TYPE.HANDLE_MODERATOR_REQUESTS,
          text: 'accepted *user* request to delete multiple community rules'
        })
        .setApprovedRequestModeratorNotification({
          receiver: moderatorRequest.moderator,
          text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been approved`
        })
        .setModeratorsNotificationsData({
          moderators: community.moderators,
          communityCreator: community.creator,
          notificationType: NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
          sender: community.creator,
          text: `"${community.name}" community rules have been updated`,
          doNotIncludeIds: [community.creator, moderatorRequest.moderator]
        })
        .setResJson({
          res,
          message: 'Community rules deleted successfully'
        });

      const updateResponse = await prepareUpdateResponse.execute();

      return updateResponse;
    },
    delete_all_rules: async (
      community: CommunitySchemaType,
      moderatorRequest: CommunityModeratorChangeRequestSchemaType,
      res: Response
    ) => {
      const prepareUpdateResponse = new HandleSendUpdateCommunityFieldRequestResponseActionBuilder()
        .setFieldUpdateHandler(
          CommunityService.updateFieldHandlers.handleDeleteAllRules.bind(
            null,
            community
          )
        )
        .setCommunityId(community._id)
        .setCommunityActivityLogData({
          moderator: moderatorRequest.moderator,
          logType: COMMUNITY_LOG_TYPE.HANDLE_MODERATOR_REQUESTS,
          text: 'accepted *user* request to delete all community rules'
        })
        .setApprovedRequestModeratorNotification({
          receiver: moderatorRequest.moderator,
          text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been approved`
        })
        .setModeratorsNotificationsData({
          moderators: community.moderators,
          communityCreator: community.creator,
          notificationType: NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
          sender: community.creator,
          text: `"${community.name}" community rules have been deleted`,
          doNotIncludeIds: [community.creator, moderatorRequest.moderator]
        })
        .setResJson({
          res,
          message: 'All community rules deleted successfully'
        });

      const updateResponse = await prepareUpdateResponse.execute();

      return updateResponse;
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

  static async createNewModeratorRequest (parameters: CreateModeratorRequestParameteresType): Promise<CommunityModeratorChangeRequestSchemaType> {
    try {
      const {
        requestType,
        communityId,
        communityCreator,
        moderator,
        requestText,
        updateValues,
        forUser
      } = parameters;

      const prepareModeratorRequest: PrepareNewModeratorRequestType = {
        requestType,
        community: communityId,
        communityCreator,
        moderator,
        requestText,
        forUser 
      };

      if (updateValues) {
        for (const value in updateValues) {
          // make sure that value is valid for schema (newDescriptionValue, newRules etc)
          if (!ALLOWED_MODERATOR_REQUEST_UPDATE_VALUES.includes(value)) {
            throw new AppError(400, `"${value}" is not valid request value for community info data.`);
          }
          prepareModeratorRequest[value as keyof typeof prepareModeratorRequest] = updateValues[value as keyof typeof updateValues]! as never;
        }
      }
      const moderatorRequest = await CommunityModeratorChangeRequest.create(prepareModeratorRequest);

      return moderatorRequest;
    } catch (error: unknown) {
      throw error;
    }
  }

  static sendModeratorRequestResponse (parameters: SendModeratorRequestResponseParametersType) {
    const {
      res,
      message,
      moderatorRequest
    } = parameters;

    return res.status(200).json({
      status: 'success',
      message,
      moderatorRequest
    });
  }
}

export default CommunityModeratorChangeRequestService;