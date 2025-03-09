import { Response } from "express";
import { CommunityModeratorChangeRequestSchemaType } from "models/communityModeratorChangeRequestModel";
import { Types } from "mongoose";
import CommunityActivityLogsService from "services/communityActivityLogsService";
import CommunityModeratorChangeRequestService from "services/communityModeratorChangeRequestsSerivce";
import { HandleSendModeratorRequestResponseActionParameters } from "types/controllers/community";

class HandleSendModeratorRequestResponseActionBuilder {
  private parameters: HandleSendModeratorRequestResponseActionParameters;

  constructor() {
    this.parameters = {
      commons: { communityId: '', moderator: '' },
      moderatorRequestData: { requestType: '', communityCreator: '', requestText: '', updateValues: {} },
      communityActivityLogData: { logType: '', text: '', photoUrl: undefined },
      resJson: { res: {} as Response, message: '' },
    };
  }

  setCommons(commons: HandleSendModeratorRequestResponseActionParameters['commons']): this {
    this.parameters.commons = commons;
    return this;
  }

  setModeratorRequestData(moderatorRequestData: HandleSendModeratorRequestResponseActionParameters['moderatorRequestData']): this {
    this.parameters.moderatorRequestData = moderatorRequestData;
    return this;
  }

  setCommunityActivityLogData(communityActivityLogData: HandleSendModeratorRequestResponseActionParameters['communityActivityLogData']): this {
    this.parameters.communityActivityLogData = communityActivityLogData;
    return this;
  }

  setResJson(resJson: HandleSendModeratorRequestResponseActionParameters['resJson']): this {
    this.parameters.resJson = resJson;
    return this;
  }

  private async createModeratorRequest() {
    const { commons, moderatorRequestData } = this.parameters;
    const { communityId, moderator } = commons;
    const { requestType, communityCreator, requestText, updateValues } = moderatorRequestData;

    return await CommunityModeratorChangeRequestService.createNewModeratorRequest({
      requestType,
      communityId,
      communityCreator,
      moderator,
      requestText,
      updateValues: updateValues || {},
    });
  }

  private async createActivityLog(moderatorRequestId: Types.ObjectId | string) {
    const { commons, communityActivityLogData } = this.parameters;
    const { communityId, moderator } = commons;
    const { logType, text, photoUrl } = communityActivityLogData;

    return await CommunityActivityLogsService.createNewCommunityActivityLog({
      communityId,
      logType,
      moderator,
      text,
      moderatorRequest: moderatorRequestId,
      photoUrl: photoUrl || undefined,
    });
  }

  private sendResponse(moderatorRequest: CommunityModeratorChangeRequestSchemaType) {
    const { resJson } = this.parameters;
    const { res, message } = resJson;

    return CommunityModeratorChangeRequestService.sendModeratorRequestResponse({
      res,
      message,
      moderatorRequest,
    });
  }

  async execute() {
    try {
      const moderatorRequest = await this.createModeratorRequest();
      await this.createActivityLog(moderatorRequest._id);
      return this.sendResponse(moderatorRequest);
    } catch (error: unknown) {
      throw error;
    }
  }
}

export default HandleSendModeratorRequestResponseActionBuilder;