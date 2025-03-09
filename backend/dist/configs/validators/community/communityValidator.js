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
const communityInputRules_1 = __importDefault(require("./communityInputRules"));
const parentValidator_1 = __importDefault(require("configs/validators/parentValidator"));
const appError_1 = __importDefault(require("utils/appError"));
class CommunityValidator extends parentValidator_1.default {
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
            return null;
        }
        const ruleErrors = [];
        rules.forEach((rule, index) => {
            if ((!rule.title || (rule.title && rule.title.trim().length === 0)) &&
                (!rule.description || (rule.description && rule.description.trim().length === 0))) {
                ruleErrors[index] = {};
            }
            // has valid rule title but invalid descripton
            if (rule.title &&
                rule.title.trim().length >= communityInputRules_1.default.rulesTitle.minLength.value &&
                rule.title.trim().length <= communityInputRules_1.default.rulesTitle.maxLength.value) {
                if (rule.description &&
                    rule.description.trim().length > 0 &&
                    rule.description.trim().length < communityInputRules_1.default.rulesDescription.minLength.value) {
                    ruleErrors[index] = {
                        description: communityInputRules_1.default.rulesDescription.minLength.errorMessage
                    };
                }
                if (rule.description &&
                    rule.description.trim().length > 0 &&
                    rule.description.trim().length > communityInputRules_1.default.rulesDescription.maxLength.value) {
                    ruleErrors[index] = {
                        description: communityInputRules_1.default.rulesDescription.maxLength.errorMessage
                    };
                }
            }
            if ((!rule.title || (rule.title && rule.title.trim().length === 0)) &&
                (rule.description && rule.description.trim().length > 0)) {
                ruleErrors[index] = {
                    title: 'Cannot have description without title'
                };
            }
            if (rule.title && rule.title.trim().length < communityInputRules_1.default.rulesTitle.minLength.value) {
                const ruleErrorMsg = {
                    title: communityInputRules_1.default.rulesTitle.minLength.errorMessage
                };
                if (rule.description && rule.description.length < communityInputRules_1.default.rulesDescription.minLength.value) {
                    ruleErrorMsg.description = communityInputRules_1.default.rulesDescription.minLength.errorMessage;
                }
                if (rule.description && rule.description.length > communityInputRules_1.default.rulesDescription.maxLength.value) {
                    ruleErrorMsg.description = communityInputRules_1.default.rulesDescription.maxLength.errorMessage;
                }
                ruleErrors[index] = ruleErrorMsg;
            }
            if (rule.title && rule.title.trim().length > communityInputRules_1.default.rulesTitle.maxLength.value) {
                const ruleErrorMsg = {
                    title: communityInputRules_1.default.rulesTitle.maxLength.errorMessage
                };
                if (rule.description && rule.description.length < communityInputRules_1.default.rulesDescription.minLength.value) {
                    ruleErrorMsg.description = communityInputRules_1.default.rulesDescription.minLength.errorMessage;
                }
                if (rule.description && rule.description.length > communityInputRules_1.default.rulesDescription.maxLength.value) {
                    ruleErrorMsg.description = communityInputRules_1.default.rulesDescription.maxLength.errorMessage;
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
    static areChatNamesValid(chatNames) {
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
    static validateCommunityInputs(inputs) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, rules, chatNames, description, pendingInvitedModerators, pendingInvitedUsers } = inputs;
            const errors = {};
            const membersInvalidError = yield this.areUsersValid(pendingInvitedUsers, 'members');
            const moderatorsInvalidError = yield this.areUsersValid(pendingInvitedModerators, 'moderators');
            const validationErrors = {
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
        });
    }
}
_a = CommunityValidator;
CommunityValidator.validateStringValues = (value, key, shouldThrowError) => {
    const invalidName = _a.isValidNonEmptyString(value, communityInputRules_1.default[key].requiredErrorMessage);
    if (invalidName) {
        if (shouldThrowError) {
            throw new appError_1.default(422, invalidName);
        }
        return invalidName;
    }
    const smallerLengthThanRequired = _a.isSmallerThanMinLength(value, communityInputRules_1.default[key].minLength.value, communityInputRules_1.default[key].minLength.errorMessage);
    if (smallerLengthThanRequired) {
        if (shouldThrowError) {
            throw new appError_1.default(422, smallerLengthThanRequired);
        }
        return smallerLengthThanRequired;
    }
    const higherLengthThanRequired = _a.isHigherThanMaxLength(value, communityInputRules_1.default[key].maxLength.value, communityInputRules_1.default[key].maxLength.errorMessage);
    if (higherLengthThanRequired) {
        if (shouldThrowError) {
            throw new appError_1.default(422, higherLengthThanRequired);
        }
        return higherLengthThanRequired;
    }
    return null;
};
exports.default = CommunityValidator;
