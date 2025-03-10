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
const chatModel_1 = __importDefault(require("models/chatModel"));
const communityModel_1 = __importDefault(require("models/communityModel"));
const notificationModel_1 = __importDefault(require("models/notificationModel"));
const appError_1 = __importDefault(require("utils/appError"));
const communityValidator_1 = __importDefault(require("configs/validators/community/communityValidator"));
const cloudinary_1 = __importDefault(require("configs/cloudinary"));
class CommunityService {
    static getUpdateRuleIndex(communityRules, rule) {
        const targetRuleIndex = communityRules.findIndex((oldRule) => oldRule._id.toString() === rule._id.toString());
        if (targetRuleIndex === -1) {
            throw new appError_1.default(400, 'Rule at provided position is not found');
        }
        return targetRuleIndex;
    }
    static doesRuleExist(communityRules, ruleId) {
        if (!ruleId) {
            throw new appError_1.default(400, 'Rule id not provided');
            return;
        }
        const ruleExist = communityRules.find((rule) => rule._id.toString() === ruleId.toString());
        if (!ruleExist) {
            throw new appError_1.default(404, 'Rule for provided id is not found');
        }
    }
    static createCommunityChatsUponCommunityCreation(creatorId, communityId, chatNames) {
        return __awaiter(this, void 0, void 0, function* () {
            if (chatNames.length === 0) {
                return;
            }
            try {
                const createdChatIds = [];
                for (const name of chatNames) {
                    const newChat = yield chatModel_1.default.create({
                        creator: creatorId,
                        name,
                        members: [creatorId],
                        admins: [creatorId],
                        communityId,
                        bannedUsers: []
                    });
                    if (newChat) {
                        createdChatIds.push(newChat._id);
                    }
                }
                return createdChatIds;
            }
            catch (error) {
                // remove chats and community if something fails
                yield chatModel_1.default.deleteMany({ creator: creatorId, communityId });
                yield communityModel_1.default.deleteOne({ _id: communityId, creator: creatorId });
                throw new appError_1.default(500, 'Failed to create chats for community. Maybe servers are down. Reftesh the page and try again');
            }
        });
    }
    static removeUserFromAllCommunityChats(communityId, communityChatsLength, userId, actionFailMsg) {
        return __awaiter(this, void 0, void 0, function* () {
            if (communityChatsLength === 0) {
                return;
            }
            try {
                yield chatModel_1.default.updateMany({
                    communityId,
                    members: { $in: [userId] }
                }, { $pull: { members: userId } });
            }
            catch (error) {
                throw new appError_1.default(500, actionFailMsg);
            }
        });
    }
    static removeUserFromLists(community, listNames, userId) {
        console.log(community, listNames, userId);
        for (const list of listNames) {
            console.log(community[list]);
            community[list].pull({ user: userId });
        }
    }
    static extractCreatorAndModeratorIds(moderators, communityCreatorId, doNotIncludeIds) {
        let ids = [...moderators.map((moderator) => moderator.user), communityCreatorId];
        if (doNotIncludeIds) {
            const doNotIncludeIdsString = doNotIncludeIds.map((user) => user.toString());
            ids = ids.filter((user) => !doNotIncludeIdsString.includes(user.toString()));
        }
        return ids;
    }
    static createCreatorAndModeratorNotifications(moderators, communityCreatorId, notificationInput, doNotIncludeIds) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const moderatorIds = this.extractCreatorAndModeratorIds(moderators, communityCreatorId, doNotIncludeIds);
                const { notificationType, text, sender, communityId } = notificationInput;
                const preparedNotifications = [];
                for (const moderatorId of moderatorIds) {
                    preparedNotifications.push({
                        receiver: moderatorId,
                        notificationType,
                        text,
                        sender,
                        communityId
                    });
                }
                const notifications = yield notificationModel_1.default.insertMany(preparedNotifications);
                return notifications;
            }
            catch (error) {
                throw error;
            }
        });
    }
    static createUpdateFieldRequestResponse(parameters) {
        const { res, message, moderatorNotifications, approvedRequestModeratorNotification, newDescription, newProfilePhoto, newBannerPhoto, newRule, updatedRule, updatedRules } = parameters;
        const responseJson = {
            status: 'success',
            message,
            moderatorNotifications
        };
        if (approvedRequestModeratorNotification) {
            responseJson.approvedRequestModeratorNotification = approvedRequestModeratorNotification;
        }
        if (newDescription) {
            responseJson.newDescription = newDescription;
        }
        if (newProfilePhoto) {
            responseJson.newProfilePhoto = newProfilePhoto;
        }
        if (newBannerPhoto) {
            responseJson.newBannerPhoto = newBannerPhoto;
        }
        if (newRule) {
            responseJson.newRule = newRule;
        }
        if (updatedRule) {
            responseJson.updatedRule = updatedRule;
        }
        if (updatedRules) {
            responseJson.updatedRules = updatedRules;
        }
        return res.status(200).json(responseJson);
    }
    static createCommunityUserManagementRequestResponse(resData) {
        const { res, message, targetUserId, userNotification, creatorNotification } = resData;
        const responseJson = {
            status: 'success',
            message: message,
            targetUserId: targetUserId
        };
        if (resData.userNotification) {
            responseJson.userNotification = userNotification;
        }
        if (resData.creatorNotification) {
            responseJson.creatorNotification = creatorNotification;
        }
        return res.status(200).json(responseJson);
    }
}
_a = CommunityService;
CommunityService.updateFieldHandlers = {
    handleUpdateDescription: (community, newDescription, shouldValidate, moderatorRequest) => __awaiter(void 0, void 0, void 0, function* () {
        if (shouldValidate) {
            communityValidator_1.default.validateStringValues(newDescription, 'description', true);
        }
        community.description = newDescription;
        yield community.save();
        if (moderatorRequest) {
            moderatorRequest.status = 'approved';
            yield moderatorRequest.save();
        }
        return community.description;
    }),
    handleUpdateProfilePhoto: (community, photo, moderatorRequest, shouldValidate) => __awaiter(void 0, void 0, void 0, function* () {
        if (shouldValidate) {
            if (!photo || (photo && (!photo.secure_url || !photo.public_id))) {
                throw new appError_1.default(404, 'Valid update photo is not found. operation failed');
            }
        }
        const imageToDelete = community.profileImagePublicId;
        if (imageToDelete) {
            yield cloudinary_1.default.uploader.destroy(imageToDelete);
        }
        community.profileImageUrl = photo.secure_url;
        community.profileImagePublicId = photo.public_id;
        yield community.save();
        if (moderatorRequest) {
            moderatorRequest.status = 'approved';
            yield moderatorRequest.save();
        }
        return community.profileImageUrl;
    }),
    handleUpdateBannerPhoto: (community, photo, moderatorRequest, shouldValidate) => __awaiter(void 0, void 0, void 0, function* () {
        if (shouldValidate) {
            if (!photo || (photo && (!photo.secure_url || !photo.public_id))) {
                throw new appError_1.default(404, 'Valid update photo is not found. operation failed');
            }
        }
        const imageToDelete = community.bannerImagePublicId;
        if (imageToDelete) {
            yield cloudinary_1.default.uploader.destroy(imageToDelete);
        }
        community.bannerImageUrl = photo.secure_url;
        community.bannerImagePublicId = photo.public_id;
        yield community.save();
        if (moderatorRequest) {
            moderatorRequest.status = 'approved';
            yield moderatorRequest.save();
        }
        return community.bannerImageUrl;
    }),
    handleRemoveProfilePhoto: (community_1, ...args_1) => __awaiter(void 0, [community_1, ...args_1], void 0, function* (community, moderatorRequest = null, shouldValidate) {
        if (shouldValidate) {
            if (!community.profileImagePublicId) {
                throw new appError_1.default(404, 'Community doesnt have profile image, so there is nothing to remove');
            }
        }
        yield cloudinary_1.default.uploader.destroy(community.profileImagePublicId);
        community.profileImageUrl = null;
        community.profileImagePublicId = null;
        yield community.save();
        if (moderatorRequest) {
            moderatorRequest.status = 'approved';
            yield moderatorRequest.save();
        }
        return null;
    }),
    handleRemoveBannerPhoto: (community_1, ...args_1) => __awaiter(void 0, [community_1, ...args_1], void 0, function* (community, moderatorRequest = null, shouldValidate) {
        if (shouldValidate) {
            if (!community.bannerImagePublicId) {
                throw new appError_1.default(404, 'Community doesnt have profile image, so there is nothing to remove');
            }
        }
        yield cloudinary_1.default.uploader.destroy(community.bannerImagePublicId);
        community.bannerImageUrl = null;
        community.bannerImagePublicId = null;
        yield community.save();
        if (moderatorRequest) {
            moderatorRequest.status = 'approved';
            yield moderatorRequest.save();
        }
        return null;
    }),
    handleAddRule: (community, newRule, moderatorRequest, shouldValidate) => __awaiter(void 0, void 0, void 0, function* () {
        if (shouldValidate) {
            if (!newRule || (newRule && !newRule.title)) {
                throw new appError_1.default(400, 'Invalid rule provided. Must have title.');
            }
            communityValidator_1.default.areRulesValid([newRule], true);
        }
        community.rules.push(newRule);
        yield community.save();
        if (moderatorRequest) {
            moderatorRequest.status = 'approved';
            yield moderatorRequest.save();
        }
        return newRule;
    }),
    handleUpdateSingleRule: (community, rule, ruleIndex, moderatorRequest, shouldValidate) => __awaiter(void 0, void 0, void 0, function* () {
        if (shouldValidate) {
            if (!rule || (rule && (!rule._id || !rule.title))) {
                throw new appError_1.default(422, 'Invalid rule data provided');
            }
            if (ruleIndex === -1) {
                throw new appError_1.default(400, 'Rule at provided position is not found');
            }
        }
        community.rules[ruleIndex].title = rule.title;
        community.rules[ruleIndex].description = rule.description || '';
        yield community.save();
        if (moderatorRequest) {
            moderatorRequest.status = 'approved';
            yield moderatorRequest.save();
        }
        return rule;
    }),
    handleUpdateCommunityRules: (community, rules, moderatorRequest, shouldValidate) => __awaiter(void 0, void 0, void 0, function* () {
        if (shouldValidate) {
            if (!rules || (rules && rules.length === 0)) {
                throw new appError_1.default(422, 'No rules have been provided');
            }
            communityValidator_1.default.areRulesValid(rules, true);
        }
        community.set('rules', rules);
        yield community.save();
        if (moderatorRequest) {
            moderatorRequest.status = 'approved';
            yield moderatorRequest.save();
        }
        return community.rules;
    }),
    handleDeleteSingleRule: (community, ruleId, moderatorRequest, shouldValidate) => __awaiter(void 0, void 0, void 0, function* () {
        if (shouldValidate) {
            _a.doesRuleExist(community.rules, ruleId);
        }
        community.rules = community.rules.filter((rule) => rule._id.toString() !== ruleId.toString());
        yield community.save();
        if (moderatorRequest) {
            moderatorRequest.status = 'approved';
            yield moderatorRequest.save();
        }
        return null;
    }),
    handleDeleteMultipleRules: (community, ruleIds, moderatorRequest, shouldValidate) => __awaiter(void 0, void 0, void 0, function* () {
        if (shouldValidate) {
            if (!ruleIds || (ruleIds && ruleIds.length === 0)) {
                throw new appError_1.default(422, 'No rule ids are provided');
            }
        }
        community.rules = community.rules.filter((rule) => !ruleIds.includes(rule._id.toString()));
        yield community.save();
        if (moderatorRequest) {
            moderatorRequest.status = 'approved';
            yield moderatorRequest.save();
        }
        return null;
    }),
    handleDeleteAllRules: (community, moderatorRequest) => __awaiter(void 0, void 0, void 0, function* () {
        community.set('rules', []);
        yield community.save();
        if (moderatorRequest) {
            moderatorRequest.status = 'approved';
            yield moderatorRequest.save();
        }
        return null;
    })
};
exports.default = CommunityService;
