import { Types } from 'mongoose';
import User from 'models/userModel';
import type { ComunityInputs, CommunityRuleType, CommunityRulesErrorsType, CommunityValidationErrors, CommunityErrorsType } from 'types/validators/communityValidatorTypes';
import communityInputRules from './communityInputRules';
import ParentValidator from 'configs/validators/parentValidator';
import AppError from 'utils/appError';

class CommunityValidator extends ParentValidator {
  static validateStringValues = (value: string | undefined, key: 'name' | 'description', shouldThrowError?: boolean): string | null => {
    const invalidName = this.isValidNonEmptyString(value, communityInputRules[key].requiredErrorMessage);
    if (invalidName) {
      if (shouldThrowError) {
        throw new AppError(422, invalidName);
      }
      return invalidName;
    }
    
    const smallerLengthThanRequired = this.isSmallerThanMinLength(
      value!, 
      communityInputRules[key].minLength.value, 
      communityInputRules[key].minLength.errorMessage
    );
    if (smallerLengthThanRequired) {
      if (shouldThrowError) {
        throw new AppError(422, smallerLengthThanRequired);
      }
      return smallerLengthThanRequired;
    }

    const higherLengthThanRequired = this.isHigherThanMaxLength(
      value!, 
      communityInputRules[key].maxLength.value, 
      communityInputRules[key].maxLength.errorMessage
    );
    if (higherLengthThanRequired) {
      if (shouldThrowError) {
        throw new AppError(422, higherLengthThanRequired);
      }
      return higherLengthThanRequired;
    }

    return null;
  }

  static async areUsersValid (users: string[] | undefined, list: 'members' | 'moderators'): Promise<string | null> {
    if (!users) {
      return null;
    }

    for (const [index, userId] of users.entries()) {
      if (!Types.ObjectId.isValid(userId)) {
        return `User num "${index + 1}" has invalid id, so cannot be added to ${list}`;
      }
      const exists = await User.exists({ _id: userId.toString() });

      if (!exists) {
        return `User num "${index + 1}" doesnt exist in database, and therefore cannot be added to ${list}. Maybe he / she deleted their account`; 
      }
    }

    return null;
  }

  static doModeratorsAndUsersOverlap (moderators: string[], users: string[]): string | null {
    for (const moderator of moderators) {
      if (users.includes(moderator)) {
        return 'You should not invite users to join both as regular members and moderators';
      }
    }

    return null;
  }

  static areRulesValid (rules: CommunityRuleType[]): CommunityRulesErrorsType[] | null {
    if (!rules || (rules && rules.length === 0)) {
      return null;
    }

    const ruleErrors: CommunityRulesErrorsType[] = [];

    rules.forEach((rule, index) => {
      if (
        (!rule.title || (rule.title && rule.title.trim().length === 0)) &&
        (!rule.description || (rule.description && rule.description.trim().length === 0))
      ) {
        ruleErrors[index] = {};
      }

      // has valid rule title but invalid descripton
      if (
        rule.title && 
        rule.title.trim().length >= communityInputRules.rulesTitle.minLength.value &&
        rule.title.trim().length <= communityInputRules.rulesTitle.maxLength.value
      ) {
        if (
          rule.description && 
          rule.description.trim().length > 0 &&
          rule.description.trim().length < communityInputRules.rulesDescription.minLength.value
        ) {
          ruleErrors[index] = {
            description: communityInputRules.rulesDescription.minLength.errorMessage
          };
        }

        if (
          rule.description && 
          rule.description.trim().length > 0 &&
          rule.description.trim().length > communityInputRules.rulesDescription.maxLength.value
        ) {
          ruleErrors[index] = {
            description: communityInputRules.rulesDescription.maxLength.errorMessage
          };
        }
      }

      if (
        (!rule.title || (rule.title && rule.title.trim().length === 0)) &&
        (rule.description && rule.description.trim().length > 0)
      ) {
        ruleErrors[index] = {
          title: 'Cannot have description without title'
        };
      }

      if (rule.title && rule.title.trim().length < communityInputRules.rulesTitle.minLength.value) {
        const ruleErrorMsg: CommunityRulesErrorsType = { 
          title: communityInputRules.rulesTitle.minLength.errorMessage
        };

        if (rule.description && rule.description.length < communityInputRules.rulesDescription.minLength.value) {
          ruleErrorMsg.description = communityInputRules.rulesDescription.minLength.errorMessage;
        }

        if (rule.description && rule.description.length > communityInputRules.rulesDescription.maxLength.value) {
          ruleErrorMsg.description = communityInputRules.rulesDescription.maxLength.errorMessage;
        } 

        ruleErrors[index] = ruleErrorMsg;
      }

      if (rule.title && rule.title.trim().length > communityInputRules.rulesTitle.maxLength.value) {
        const ruleErrorMsg: any = { 
          title: communityInputRules.rulesTitle.maxLength.errorMessage
        };

        if (rule.description && rule.description.length < communityInputRules.rulesDescription.minLength.value) {
          ruleErrorMsg.description = communityInputRules.rulesDescription.minLength.errorMessage;
        }

        if (rule.description && rule.description.length > communityInputRules.rulesDescription.maxLength.value) {
          ruleErrorMsg.description = communityInputRules.rulesDescription.maxLength.errorMessage;
        } 

        ruleErrors[index] = ruleErrorMsg;
      }
    });

    const sentErrors = ruleErrors.length === 0 || ruleErrors.every((rule) => !rule || Object.keys(rule).length === 0) ? null : ruleErrors;
    /*
      in order to display rule errors on frontend inputs, rule error index is important
      some may have null value - if there are 2 rules, 1st is valid and second is invalid, error value of first will be null;
      but error value of second will be adequeate error object
    */
    return sentErrors;
  }

  static areChatNamesValid (chatNames: string[]): string | null {
    if (!chatNames || (chatNames && chatNames.length === 0)) {
      return null;
    }

    for (const chat of chatNames) {
      if (chat.trim().length < 2) {
        return 'Chat name must be at least 2 characters long';
      }

      if (chat.trim().length > 10) {
        return 'Chat name must not exceed 10 characters';
      }
    }

    return null;
  }

  static async validateCommunityInputs (inputs: ComunityInputs) {
    const {
      name,
      rules,
      chatNames,
      description,
      pendingInvitedModerators,
      pendingInvitedUsers
    } = inputs;

    const errors: CommunityErrorsType = {};

    const membersInvalidError = await this.areUsersValid(pendingInvitedUsers, 'members');
    const moderatorsInvalidError = await this.areUsersValid(pendingInvitedModerators, 'moderators')

    const validationErrors: CommunityValidationErrors = {
      name: this.validateStringValues(name, 'name'),
      description: this.validateStringValues(description, 'description'),
      rules: this.areRulesValid(rules),
      pendingInvitedUsers: membersInvalidError || this.doModeratorsAndUsersOverlap(pendingInvitedModerators, pendingInvitedUsers),
      pendingInvitedModerators: moderatorsInvalidError,
      chatNames: this.areChatNamesValid(chatNames)
    };

    Object.keys(validationErrors).forEach((key) => {
      if (validationErrors[key]) {
        errors[key] = validationErrors[key];
      }
    });

    return Object.keys(errors).length
      ? { errors }
      : { errors: null };
  }
}

export default CommunityValidator;