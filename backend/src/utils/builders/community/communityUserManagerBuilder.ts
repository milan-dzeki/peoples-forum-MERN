import { Types } from 'mongoose';
import type { CommunitySchemaType } from 'models/communityModel';
import type { CommunityListType, CommunityUserManagementResponseJsonType, CommunityUserManagenentNotificationInputType, UserExistInListsType } from 'types/controllers/community';
import AppError from 'utils/appError';
import CommunityService from 'services/communityService';
import Notification, { NotificationSchemaType } from 'models/notificationModel';
import { Response } from 'express';

class CommunityUserManagerBuilder {
  private community: CommunitySchemaType;
  private userId: Types.ObjectId | string;
  private operatorId: Types.ObjectId | string;
  private userExistsInLists: UserExistInListsType;

  private userNotificationInput: CommunityUserManagenentNotificationInputType | undefined;
  private creatorNotificationInput: CommunityUserManagenentNotificationInputType | undefined;
  private resJson: CommunityUserManagementResponseJsonType;

  constructor (
    community: CommunitySchemaType, 
    userId: Types.ObjectId | string,
    operatorId: Types.ObjectId | string,
    userExistsInLists: UserExistInListsType
  ) {
    this.community = community;
    this.userId = userId;
    this.operatorId = operatorId;
    this.userExistsInLists = userExistsInLists;

    this.userNotificationInput = undefined;
    this.creatorNotificationInput = undefined;
    this.resJson = {
      res: {} as Response,
      message: '',
      targetUserId: ''
    };
  }

  throwErrorIfNotInAnyList (errorMsg: string): this {
    const existInAnyList = Object.keys(this.userExistsInLists)
      .some((list) => this.userExistsInLists[list as keyof UserExistInListsType].exists);
    
    if (!existInAnyList) {
      throw new AppError(400, errorMsg);
    }

    return this;
  }

  throwErrorIfInAnyListExcept (
    exceptListNames: CommunityListType[],
    errorMsg?: string
  ): this {
    const isInOtherLists = Object.keys(this.userExistsInLists)
      .find((list) => this.userExistsInLists[list as keyof UserExistInListsType].exists && !exceptListNames.includes(list as keyof UserExistInListsType));

    if (isInOtherLists) {
      throw new AppError(400, `Action failed. Account registered in ${this.userExistsInLists[isInOtherLists as keyof UserExistInListsType].alias}. ${errorMsg || ''}`);
    }

    return this;
  }

  throwErrorIfUserNotInList (listName: CommunityListType, errorMsg: string): this {
    if (!this.userExistsInLists[listName].exists) {
      throw new AppError(400, errorMsg);
    }

    return this;
  }

  throwErrorIfCreatorActionTriedByNonCreator (throwCondition: boolean, errorMsg: string): this {
    if (throwCondition) {
      throw new AppError(400, errorMsg);
    }

    return this;
  }

  removeUserFromLists (listNames: CommunityListType[]): this {
    CommunityService.removeUserFromLists(this.community, listNames, this.userId.toString());
    return this;
  }

  addUserToList (list: CommunityListType, additionalData?: Record<string, any>): this {
    this.community[list].push({ user: this.userId, ...additionalData });
    return this;
  }

  async saveCommunity (): Promise<this> {
    await this.community.save();
    return this;
  } 

  setUserNotification (input: CommunityUserManagenentNotificationInputType): this {
    this.userNotificationInput = input;
    return this;
  }

  setCreatorNotification (input: CommunityUserManagenentNotificationInputType): this {
    this.creatorNotificationInput = input;
    return this;  
  }

  async createNotification (
    input: CommunityUserManagenentNotificationInputType | undefined
  ): Promise<NotificationSchemaType | null> {
    if (input) {
      const notification = await Notification.create(input);
      return notification;
    }

    return null;
  }

  setResJson (input: CommunityUserManagementResponseJsonType): this {
    this.resJson = input;
    return this;
  }

  async execute () {
    const sendUserNotification = await this.createNotification(this.userNotificationInput);
    const sendCreatorNotification = await this.createNotification(this.creatorNotificationInput)

    if (this.resJson.message.trim().length === 0) {
      throw new AppError(400, 'Invalid response set up. No message found');
    }

    const response = this.resJson;
    
    if (sendUserNotification) {
      response.userNotification = sendUserNotification;
    }

    if (sendCreatorNotification) {
      response.creatorNotification = sendCreatorNotification;
    }

    return CommunityService.createCommunityUserManagementRequestResponse(response);
  }
}

export default CommunityUserManagerBuilder;