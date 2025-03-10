import { Response } from "express";
import { Types } from "mongoose";
import CommunityActivityLogsService from "services/communityActivityLogsService";
import Notification, { NotificationSchemaType } from "models/notificationModel";
import { HandleSendUpdateCommunityFieldRequestResponseActionType, SendUpdateFieldRequestResponseType, UpdateFieldResponseJsonType } from "types/controllers/community";
import { CommunitySchemaType } from "models/communityModel";
import { CommunityModeratorChangeRequestSchemaType } from "models/communityModeratorChangeRequestModel";
import { NOTIFICATION_TYPES } from "configs/notifications";
import CommunityService from "services/communityService";

class HandleSendUpdateCommunityFieldRequestResponseActionBuilder {
  private parameters: HandleSendUpdateCommunityFieldRequestResponseActionType;

  constructor () {
    this.parameters = {
      responseField: null,
      fieldUpdateHandler: async () => {},
      communityId: '',
      communityActivityLogData: {
        logType: '',
        moderator: '',
        text: '',
        photoUrl: undefined,
      },
      moderatorsNotificationsData: {
        moderators: [] as any,
        communityCreator: '',
        notificationType: NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
        text: '',
        sender: '',
        doNotIncludeIds: [],
      },
      resJson: {
        res: {} as Response,
        message: '',
      },
      approvedRequestModeratorNotification: undefined,
    };
  }

  setResponseField (responseField: string | null) {
    this.parameters.responseField = responseField;
    return this;
  }

  setFieldUpdateHandler(fieldUpdateHandler: HandleSendUpdateCommunityFieldRequestResponseActionType['fieldUpdateHandler']): this {
    this.parameters.fieldUpdateHandler = fieldUpdateHandler;
    return this;
  }

  setCommunityId(communityId: Types.ObjectId | string): this {
    this.parameters.communityId = communityId;
    return this;
  }

  setCommunityActivityLogData(
    communityActivityLogData: HandleSendUpdateCommunityFieldRequestResponseActionType['communityActivityLogData']
  ): this {
    this.parameters.communityActivityLogData = communityActivityLogData;
    return this;
  }

  setModeratorsNotificationsData(
    moderatorsNotificationsData: HandleSendUpdateCommunityFieldRequestResponseActionType['moderatorsNotificationsData']
  ): this {
    this.parameters.moderatorsNotificationsData = moderatorsNotificationsData;
    return this;
  }

  setResJson(
    resJson: HandleSendUpdateCommunityFieldRequestResponseActionType['resJson']
  ): this {
    this.parameters.resJson = resJson;
    return this;
  }

  setApprovedRequestModeratorNotification(
    notification: HandleSendUpdateCommunityFieldRequestResponseActionType['approvedRequestModeratorNotification']
  ): this {
    this.parameters.approvedRequestModeratorNotification = notification;
    return this;
  }

  async execute() {
    try {
      const {
        responseField,
        fieldUpdateHandler,
        communityId,
        communityActivityLogData,
        moderatorsNotificationsData,
        resJson,
        approvedRequestModeratorNotification,
      } = this.parameters;

      const newValue = await fieldUpdateHandler();

      await CommunityActivityLogsService.createNewCommunityActivityLog({
        communityId,
        logType: communityActivityLogData.logType,
        text: communityActivityLogData.text,
        moderator: communityActivityLogData.moderator,
        photoUrl: communityActivityLogData.photoUrl,
      });

      const moderatorNotifications = await CommunityService.createCreatorAndModeratorNotifications(
        moderatorsNotificationsData.moderators,
        moderatorsNotificationsData.communityCreator,
        {
          communityId,
          notificationType: moderatorsNotificationsData.notificationType,
          sender: moderatorsNotificationsData.sender,
          text: moderatorsNotificationsData.text,
        },
        moderatorsNotificationsData.doNotIncludeIds
      );

      let moderatorApprovedNotification: NotificationSchemaType | null = null;

      if (approvedRequestModeratorNotification) {
        moderatorApprovedNotification = await Notification.create({
          receiver: approvedRequestModeratorNotification.receiver,
          notificationType: NOTIFICATION_TYPES.MODERATOR_CHANGE_REQUEST_APPROVED,
          text: approvedRequestModeratorNotification.text,
          community: communityId
        });
      }

      const responseJson: SendUpdateFieldRequestResponseType = {
        res: resJson.res,
        message: resJson.message,
        moderatorNotifications,
        approvedRequestModeratorNotification: moderatorApprovedNotification
      };

      if (responseField && newValue) {
        responseJson[responseField as keyof typeof responseJson] = newValue;
      }

      return CommunityService.createUpdateFieldRequestResponse(responseJson);
    } catch (error: unknown) {
      throw error;
    }
  }
}

export default HandleSendUpdateCommunityFieldRequestResponseActionBuilder;