import { Types } from 'mongoose';
import type { CommunitySchemaType } from 'models/communityModel';
import type { CommunityListType, UserExistInListsType } from 'types/controllers/community';
import AppError from 'utils/appError';
import CommunityService from 'services/communityService';

class CommunityUserManagerBuilder {
  private community: CommunitySchemaType;
  private userId: Types.ObjectId | string;
  private operatorId: Types.ObjectId | string;
  private userExistsInLists: UserExistInListsType;

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
}

export default CommunityUserManagerBuilder;