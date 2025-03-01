import { Types } from 'mongoose';
import User from 'models/userModel';

interface ComunityInputs {
  pendingInvitedModerators: string[];
  access: string | undefined;
  name: string | undefined;
  description: string | undefined;
  rules: {
    title: string | undefined;
    description: string | undefined
  }[];
  pendingInvitedUsers: string[];
  chatNames: string[];
}

interface ValidationErrors {
  [name: string]: string | null;
}

interface Errors {
  [name: string]: string;
}

interface ReturnError {
  error: string | null;
}

class CommunityValidator {
  public static communityCreatorId = {
    requiredErrorMessage: 'Community creator ID is required'
  };

  public static communityName = {
    requiredErrorMessage: 'Community Name is required',
    minLength: {
      value: 2,
      errorMessage: 'Community Name must be at least 2 characters long'
    },
    maxLength: {
      value: 30,
      errorMessage: 'Community Name must not exceed 30 characters'
    },
  };

  public static description = {
    requiredErrorMessage: 'Community Description is required',
    minLength: {
      value: 10,
      errorMessage: 'Community Description must be at least 10 characters long'
    },
    maxLength: {
      value: 100,
      errorMessage: 'Community Description must not exceed 100 characters'
    },
  };

  public static access = {
    invalidValueMessage: 'Communitys access value can only be "public" or "private"'
  };

  public static rulesTitle = {
    minLength: {
      value: 5,
      errorMessage: 'Community rule title must have at least 5 characters'
    },
    maxLength: {
      value: 20,
      errorMessage: 'Community rule title must not exceed 20 characters'
    },
  };

  public static rulesDescription = {
    minLength: {
      value: 5,
      errorMessage: 'Community rule description must have at least 5 characters'
    },
    maxLength: {
      value: 100,
      errorMessage: 'Community rule description must not exceed 100 characters'
    },
  };

  private static doesExistAsString (value: unknown, errorMessage: string): string | null {
    return !value || (value && typeof value === 'string' && value.trim().length === 0) || (value && typeof value !== 'string')
      ? errorMessage
      : null;
  }

  private static isSmallerThanMinLength (
    value: string, 
    minLength: number, 
    errorMessage: string
  ): string | null {
    return value.trim().length < minLength
      ? errorMessage
      : null;
  }

  private static isHigherThanMaxLength (
    value: string, 
    maxLength: number, 
    errorMessage: string
  ): string | null {
    return value.trim().length > maxLength
      ? errorMessage
      : null;
  }

  private static validateNames = (value: string | undefined, key: 'communityName' | 'description'): ReturnError => {
    const invalidName = this.doesExistAsString(value, this[key].requiredErrorMessage);
    if (invalidName) {
      return { error: invalidName };
    }
    
    const smallerLengthThanRequired = this.isSmallerThanMinLength(
      value!, 
      this[key].minLength.value, 
      this[key].minLength.errorMessage
    );
    if (smallerLengthThanRequired) {
      return { error: smallerLengthThanRequired };
    }

    const higherLengthThanRequired = this.isHigherThanMaxLength(
      value!, 
      this[key].maxLength.value, 
      this[key].maxLength.errorMessage
    );
    if (higherLengthThanRequired) {
      return { error: higherLengthThanRequired };
    }

    return { error: null };
  }

  private static isAccessValid (value: string | undefined): ReturnError {
    return value === 'public' || value === 'private'
      ? { error: null }
      : { error: this.access.invalidValueMessage }
  }

  static async areUsersValid (users: string[] | undefined, list: 'members' | 'moderators') {
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

  static doModeratorsAndUsersOverlap (moderators: string[], users: string[]) {
    for (const moderator of moderators) {
      if (users.includes(moderator)) {
        return 'You should not invite users to join both as regular members and moderators'
      }
    }

    return null;
  }

  static areRulesValid (rules: {
    title: string | undefined;
    description: string | undefined;
  }[]): any {
    if (!rules || (rules && rules.length === 0)) {
      return { error: null };
    }

    const ruleErrors: any[] = [];
    rules.forEach((rule, index) => {
      ruleErrors[index] = {};
      if (
        (!rule.title || (rule.title && rule.title.trim().length === 0)) &&
        (!rule.description || (rule.description && rule.description.trim().length === 0))
      ) {
        ruleErrors[index] = {};
      }

      if (
        (!rule.title || (rule.title && rule.title.trim().length === 0)) &&
        (rule.description && rule.description.trim().length > 0)
      ) {
        ruleErrors[index] = {
          title: 'Cannot have description without title'
        };
      }

      if (rule.title && rule.title.trim().length < this.rulesTitle.minLength.value) {
        const ruleErrorMsg: any = { 
          title: this.rulesTitle.minLength.errorMessage
        };

        if (rule.description && rule.description.length < this.rulesDescription.minLength.value) {
          ruleErrorMsg.description = this.rulesDescription.minLength.errorMessage;
        }

        if (rule.description && rule.description.length > this.rulesDescription.maxLength.value) {
          ruleErrorMsg.description = this.rulesDescription.maxLength.errorMessage;
        } 

        ruleErrors[index] = ruleErrorMsg;
      }

      if (rule.title && rule.title.trim().length > this.rulesTitle.maxLength.value) {
        const ruleErrorMsg: any = { 
          title: this.rulesTitle.maxLength.errorMessage
        };

        if (rule.description && rule.description.length < this.rulesDescription.minLength.value) {
          ruleErrorMsg.description = this.rulesDescription.minLength.errorMessage;
        }

        if (rule.description && rule.description.length > this.rulesDescription.maxLength.value) {
          ruleErrorMsg.description = this.rulesDescription.maxLength.errorMessage;
        } 

        ruleErrors[index] = ruleErrorMsg;
      }
    });

    return ruleErrors;
  }

  static areChatNamesValid (chatNames: string[]) {
    if (!chatNames || (chatNames && chatNames.length === 0)) {
      return null;
    }

    chatNames.forEach((name) => {
      if (name.trim().length < 2) {
        return 'Chat name must be at least 2 characters long';
      }

      if (name.trim() && name.length > 10) {
        return 'Chat name must not exceed 10 characters';
      }
    });

    return null;
  }

  static async validateCommunityInputs (inputs: ComunityInputs) {
    const {
      name,
      rules,
      access,
      chatNames,
      description,
      pendingInvitedModerators,
      pendingInvitedUsers
    } = inputs;

    const errors: Errors = {};

    const validationErrors: ValidationErrors = {
      name: this.validateNames(name, 'communityName').error,
      description: this.validateNames(description, 'description').error,
      rules: this.areRulesValid(rules).error,
      access: this.isAccessValid(access).error,
      pendingInvitedUsers: await this.areUsersValid(pendingInvitedUsers, 'members') || this.doModeratorsAndUsersOverlap(pendingInvitedModerators, pendingInvitedUsers),
      pendingInvitedModerators: await this.areUsersValid(pendingInvitedModerators, 'moderators')
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