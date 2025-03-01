"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const userModel_1 = __importDefault(require("models/userModel"));
class CommunityValidator {
    static doesExistAsString(value, errorMessage) {
        return !value || (value && typeof value === 'string' && value.trim().length === 0) || (value && typeof value !== 'string')
            ? errorMessage
            : null;
    }
    static isSmallerThanMinLength(value, minLength, errorMessage) {
        return value.trim().length < minLength
            ? errorMessage
            : null;
    }
    static isHigherThanMaxLength(value, maxLength, errorMessage) {
        return value.trim().length > maxLength
            ? errorMessage
            : null;
    }
    static isAccessValid(value) {
        return value === 'public' || value === 'private'
            ? { error: null }
            : { error: this.access.invalidValueMessage };
    }
    static areUsersValid(users, list) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!users) {
                return null;
            }
            for (const [index, userId] of users.entries()) {
                if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                    return `User num "${index + 1}" has invalid id, so cannot be added to ${list}`;
                }
                const exists = yield userModel_1.default.exists({ _id: userId.toString() });
                if (!exists) {
                    return `User num "${index + 1}" doesnt exist in database, and therefore cannot be added to ${list}. Maybe he / she deleted their account`;
                }
            }
            return null;
        });
    }
    static doModeratorsAndUsersOverlap(moderators, users) {
        for (const moderator of moderators) {
            if (users.includes(moderator)) {
                return 'You should not invite users to join both as regular members and moderators';
            }
        }
        return null;
    }
    static areRulesValid(rules) {
        if (!rules || (rules && rules.length === 0)) {
            return { error: null };
        }
        const ruleErrors = [];
        rules.forEach((rule, index) => {
            ruleErrors[index] = {};
            if ((!rule.title || (rule.title && rule.title.trim().length === 0)) &&
                (!rule.description || (rule.description && rule.description.trim().length === 0))) {
                ruleErrors[index] = {};
            }
            if ((!rule.title || (rule.title && rule.title.trim().length === 0)) &&
                (rule.description && rule.description.trim().length > 0)) {
                ruleErrors[index] = {
                    title: 'Cannot have description without title'
                };
            }
            if (rule.title && rule.title.trim().length < this.rulesTitle.minLength.value) {
                const ruleErrorMsg = {
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
                const ruleErrorMsg = {
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
    static areChatNamesValid(chatNames) {
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
    static validateCommunityInputs(inputs) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, rules, access, chatNames, description, pendingInvitedModerators, pendingInvitedUsers } = inputs;
            const errors = {};
            const validationErrors = {
                name: this.validateNames(name, 'communityName').error,
                description: this.validateNames(description, 'description').error,
                rules: this.areRulesValid(rules).error,
                access: this.isAccessValid(access).error,
                pendingInvitedUsers: (yield this.areUsersValid(pendingInvitedUsers, 'members')) || this.doModeratorsAndUsersOverlap(pendingInvitedModerators, pendingInvitedUsers),
                pendingInvitedModerators: yield this.areUsersValid(pendingInvitedModerators, 'moderators')
            };
            Object.keys(validationErrors).forEach((key) => {
                if (validationErrors[key]) {
                    errors[key] = validationErrors[key];
                }
            });
            return Object.keys(errors).length
                ? { errors }
                : { errors: null };
        });
    }
}
_a = CommunityValidator;
CommunityValidator.communityCreatorId = {
    requiredErrorMessage: 'Community creator ID is required'
};
CommunityValidator.communityName = {
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
CommunityValidator.description = {
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
CommunityValidator.access = {
    invalidValueMessage: 'Communitys access value can only be "public" or "private"'
};
CommunityValidator.rulesTitle = {
    minLength: {
        value: 5,
        errorMessage: 'Community rule title must have at least 5 characters'
    },
    maxLength: {
        value: 20,
        errorMessage: 'Community rule title must not exceed 20 characters'
    },
};
CommunityValidator.rulesDescription = {
    minLength: {
        value: 5,
        errorMessage: 'Community rule description must have at least 5 characters'
    },
    maxLength: {
        value: 100,
        errorMessage: 'Community rule description must not exceed 100 characters'
    },
};
CommunityValidator.validateNames = (value, key) => {
    const invalidName = _a.doesExistAsString(value, _a[key].requiredErrorMessage);
    if (invalidName) {
        return { error: invalidName };
    }
    const smallerLengthThanRequired = _a.isSmallerThanMinLength(value, _a[key].minLength.value, _a[key].minLength.errorMessage);
    if (smallerLengthThanRequired) {
        return { error: smallerLengthThanRequired };
    }
    const higherLengthThanRequired = _a.isHigherThanMaxLength(value, _a[key].maxLength.value, _a[key].maxLength.errorMessage);
    if (higherLengthThanRequired) {
        return { error: higherLengthThanRequired };
    }
    return { error: null };
};
exports.default = CommunityValidator;
