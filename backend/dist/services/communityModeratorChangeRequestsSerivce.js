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
const cloudinary_1 = __importDefault(require("configs/cloudinary"));
const communityActivityLogs_1 = require("configs/communityActivityLogs");
const communityModeratorChangeRequests_1 = require("configs/communityModeratorChangeRequests");
const notifications_1 = require("configs/notifications");
const communityValidator_1 = __importDefault(require("configs/validators/community/communityValidator"));
const communityActivityLogs_2 = __importDefault(require("models/communityActivityLogs"));
const communityModeratorChangeRequestModel_1 = __importDefault(require("models/communityModeratorChangeRequestModel"));
const notificationModel_1 = __importDefault(require("models/notificationModel"));
const appError_1 = __importDefault(require("utils/appError"));
const communityService_1 = __importDefault(require("./communityService"));
const handleSendUpdateCommunityFieldRequestResponseAction_1 = __importDefault(require("utils/builders/community/handleSendUpdateCommunityFieldRequestResponseAction"));
class CommunityModeratorChangeRequestService {
    static updateCommunityPhoto(community, moderatorRequest, photoName, shouldNotifyModerator) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const targetPhoto = moderatorRequest.photo;
                if (!targetPhoto &&
                    (targetPhoto && !targetPhoto.public_id && !targetPhoto.secure_url)) {
                    throw new appError_1.default(400, `Request ${photoName} photo not found`);
                }
                if (community.bannerImagePublicId) {
                    yield cloudinary_1.default.uploader.destroy(community.bannerImagePublicId);
                }
                const targetUrl = photoName === 'profile' ? 'profileImageUrl' : 'bannerImageUrl';
                const targetPublicId = photoName === 'profile' ? 'profileImagePublicId' : 'bannerImagePublicId';
                community[targetUrl] = targetPhoto.secure_url;
                community[targetPublicId] = targetPhoto.public_id;
                yield community.save();
                moderatorRequest.status = 'approved';
                yield moderatorRequest.save();
                yield communityActivityLogs_2.default.create({
                    community: community._id,
                    logType: communityActivityLogs_1.COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
                    moderator: moderatorRequest.moderator,
                    text: `approved request to update community ${photoName} photo made by moderator`,
                    moderatorRequest: moderatorRequest._id,
                    photoUrl: targetPhoto.secure_url
                });
                if (shouldNotifyModerator) {
                    const moderatorNotification = yield notificationModel_1.default.create({
                        receiver: moderatorRequest.moderator,
                        notificationType: notifications_1.NOTIFICATION_TYPES.MODERATOR_CHANGE_REQUEST_APPROVED,
                        text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been approved`,
                        community: community._id
                    });
                    return moderatorNotification;
                }
                return null;
            }
            catch (error) {
                throw error;
            }
        });
    }
    static removeCommunityPhoto(community, moderatorRequest, photoName, shouldNotifyModerator) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const targetUrl = photoName === 'profile' ? 'profileImageUrl' : 'bannerImageUrl';
                const targetPublicId = photoName === 'profile' ? 'profileImagePublicId' : 'bannerImagePublicId';
                if (!community[targetUrl] && !community[targetPublicId]) {
                    throw new appError_1.default(404, 'Community doesnt have profile photo');
                }
                yield cloudinary_1.default.uploader.destroy(community[targetPublicId]);
                community[targetUrl] = null;
                community[targetPublicId] = null;
                yield community.save();
                moderatorRequest.status = 'approved';
                yield moderatorRequest.save();
                yield communityActivityLogs_2.default.create({
                    community: community._id,
                    logType: communityActivityLogs_1.COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
                    moderator: moderatorRequest.moderator,
                    text: `approved request to remove community ${photoName} photo made by moderator`,
                    moderatorRequest: moderatorRequest._id
                });
                if (shouldNotifyModerator) {
                    const moderatorNotification = yield notificationModel_1.default.create({
                        receiver: moderatorRequest.moderator,
                        notificationType: notifications_1.NOTIFICATION_TYPES.MODERATOR_CHANGE_REQUEST_APPROVED,
                        text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been approved`,
                        community: community._id
                    });
                    return moderatorNotification;
                }
                return null;
            }
            catch (error) {
                throw error;
            }
        });
    }
    static removeRequestPhotoIfItExists(photo) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!photo ||
                (photo && !photo.secure_url && !photo.public_id)) {
                return;
            }
            yield cloudinary_1.default.uploader.destroy(photo.public_id);
        });
    }
    static createNewModeratorRequest(parameters) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { requestType, communityId, communityCreator, moderator, requestText, updateValues } = parameters;
                const prepareModeratorRequest = {
                    requestType,
                    community: communityId,
                    communityCreator,
                    moderator,
                    requestText
                };
                if (updateValues) {
                    for (const value in updateValues) {
                        // make sure that value is valid for schema (newDescriptionValue, newRules etc)
                        if (!communityModeratorChangeRequests_1.ALLOWED_MODERATOR_REQUEST_UPDATE_VALUES.includes(value)) {
                            throw new appError_1.default(400, `"${value}" is not valid request value for community info data.`);
                        }
                        prepareModeratorRequest[value] = updateValues[value];
                    }
                }
                const moderatorRequest = yield communityModeratorChangeRequestModel_1.default.create(prepareModeratorRequest);
                return moderatorRequest;
            }
            catch (error) {
                throw error;
            }
        });
    }
    static sendModeratorRequestResponse(parameters) {
        const { res, message, moderatorRequest } = parameters;
        return res.status(200).json({
            status: 'success',
            message,
            moderatorRequest
        });
    }
}
_a = CommunityModeratorChangeRequestService;
CommunityModeratorChangeRequestService.acceptUpdateCommunityField = {
    update_description: (community, moderatorRequest, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const updatedDescription = moderatorRequest.newDescriptionValue;
            const approvedRequestModeratorNotification = yield notificationModel_1.default.create({
                receiver: moderatorRequest.moderator,
                notificationType: notifications_1.NOTIFICATION_TYPES.MODERATOR_CHANGE_REQUEST_APPROVED,
                text: `Your request to ${moderatorRequest.requestType} to "${moderatorRequest.requestType}" for "${community.name}" community has been approved`,
                community: community._id
            });
            const prepareResponse = new handleSendUpdateCommunityFieldRequestResponseAction_1.default()
                .setFieldUpdateHandler(communityService_1.default.updateFieldHandlers.handleUpdateDescription.bind(null, community, updatedDescription, true, moderatorRequest))
                .setCommunityId(community._id)
                .setCommunityActivityLogData({
                moderator: moderatorRequest.moderator,
                logType: communityActivityLogs_1.COMMUNITY_LOG_TYPE.HANDLE_MODERATOR_REQUESTS,
                text: `accepted *user* request to update community description to "${updatedDescription}"`,
            }).
                setApprovedRequestModeratorNotification(approvedRequestModeratorNotification)
                .setModeratorsNotificationsData({
                moderators: community.moderators,
                communityCreator: community.creator,
                notificationType: notifications_1.NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
                text: `"${community.name}" community description was changed`,
                sender: community.creator,
                doNotIncludeIds: [community.creator, moderatorRequest.moderator]
            })
                .setResJson({
                res,
                message: 'Community description updated successfully'
            });
            const response = yield prepareResponse.execute();
            return response;
        }
        catch (error) {
            throw error;
        }
    }),
    update_profile_photo: (community, moderatorRequest, shouldNotifyModerator) => __awaiter(void 0, void 0, void 0, function* () {
        const moderatorNotification = yield _a.updateCommunityPhoto(community, moderatorRequest, 'profile', shouldNotifyModerator);
        return moderatorNotification;
    }),
    remove_profile_photo: (community, moderatorRequest, shouldNotifyModerator) => __awaiter(void 0, void 0, void 0, function* () {
        const moderatorNotification = _a.removeCommunityPhoto(community, moderatorRequest, 'profile', shouldNotifyModerator);
        return moderatorNotification;
    }),
    update_banner_photo: (community, moderatorRequest, shouldNotifyModerator) => __awaiter(void 0, void 0, void 0, function* () {
        const moderatorNotification = yield _a.updateCommunityPhoto(community, moderatorRequest, 'banner', shouldNotifyModerator);
        return moderatorNotification;
    }),
    remove_banner_photo: (community, moderatorRequest, shouldNotifyModerator) => __awaiter(void 0, void 0, void 0, function* () {
        const moderatorNotification = _a.removeCommunityPhoto(community, moderatorRequest, 'banner', shouldNotifyModerator);
        return moderatorNotification;
    }),
    add_rule: (community, moderatorRequest, shouldNotifyModerator) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!moderatorRequest.newRules ||
                (moderatorRequest.newRules && moderatorRequest.newRules.length !== 1)) {
                throw new appError_1.default(400, 'Invalid rule found. Operation failed');
            }
            const newRule = moderatorRequest.newRules[0];
            if (!newRule || (newRule && !newRule.title)) {
                throw new appError_1.default(400, 'Rule to add not provided');
            }
            const ruleInvalidError = communityValidator_1.default.areRulesValid([newRule]);
            if (ruleInvalidError) {
                throw new appError_1.default(422, 'Rule data invalid', { rule: ruleInvalidError });
            }
            community.rules.push(newRule);
            yield community.save();
            moderatorRequest.status = 'approved';
            yield moderatorRequest.save();
            yield communityActivityLogs_2.default.create({
                community: community._id,
                logType: communityActivityLogs_1.COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
                moderator: moderatorRequest.moderator,
                text: `approved request to add community rule by moderator`,
                moderatorRequest: moderatorRequest._id
            });
            if (shouldNotifyModerator) {
                const moderatorNotification = yield notificationModel_1.default.create({
                    receiver: moderatorRequest.moderator,
                    notificationType: notifications_1.NOTIFICATION_TYPES.MODERATOR_CHANGE_REQUEST_APPROVED,
                    text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been approved`,
                    community: community._id
                });
                return moderatorNotification;
            }
            return null;
        }
        catch (error) {
            throw error;
        }
    }),
    update_single_rule: (community, moderatorRequest, shouldNotifyModerator) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!moderatorRequest.newRules ||
                (moderatorRequest.newRules && moderatorRequest.newRules.length !== 1)) {
                throw new appError_1.default(400, 'Invalid rule found. Operation failed');
            }
            const newRule = moderatorRequest.newRules[0];
            console.log(newRule);
            if (!newRule || (newRule && !newRule.title)) {
                throw new appError_1.default(400, 'Rule to add not provided');
            }
            const ruleInvalidError = communityValidator_1.default.areRulesValid([newRule]);
            if (ruleInvalidError) {
                throw new appError_1.default(422, 'Rule data invalid', { rule: ruleInvalidError });
            }
            const targetRuleIndex = community.rules.findIndex((rule) => rule._id.toString() === newRule._id.toString());
            if (targetRuleIndex === -1) {
                throw (new appError_1.default(400, 'Rule at provided position is not found'));
            }
            const updatedRule = community.rules[targetRuleIndex];
            updatedRule.title = newRule.title;
            updatedRule.description = newRule.description;
            yield community.save();
            moderatorRequest.status = 'approved';
            yield moderatorRequest.save();
            yield communityActivityLogs_2.default.create({
                community: community._id,
                logType: communityActivityLogs_1.COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
                moderator: moderatorRequest.moderator,
                text: `approved request to update community rule by moderator`,
                moderatorRequest: moderatorRequest._id
            });
            if (shouldNotifyModerator) {
                const moderatorNotification = yield notificationModel_1.default.create({
                    receiver: moderatorRequest.moderator,
                    notificationType: notifications_1.NOTIFICATION_TYPES.MODERATOR_CHANGE_REQUEST_APPROVED,
                    text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been approved`,
                    community: community._id
                });
                return moderatorNotification;
            }
            return null;
        }
        catch (error) {
            throw error;
        }
    }),
    update_rules: (community, moderatorRequest, shouldNotifyModerator) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!moderatorRequest.newRules ||
                (moderatorRequest.newRules && moderatorRequest.newRules.length === 0)) {
                throw new appError_1.default(400, 'Invalid rules found. Operation failed');
            }
            const ruleInvalidError = communityValidator_1.default.areRulesValid(moderatorRequest.newRules);
            if (ruleInvalidError) {
                throw new appError_1.default(422, 'Rules data invalid', { rule: ruleInvalidError });
            }
            community.rules = moderatorRequest.newRules;
            yield community.save();
            moderatorRequest.status = 'approved';
            yield moderatorRequest.save();
            yield communityActivityLogs_2.default.create({
                community: community._id,
                logType: communityActivityLogs_1.COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
                moderator: moderatorRequest.moderator,
                text: `approved request to update community rules by moderator`,
                moderatorRequest: moderatorRequest._id
            });
            if (shouldNotifyModerator) {
                const moderatorNotification = yield notificationModel_1.default.create({
                    receiver: moderatorRequest.moderator,
                    notificationType: notifications_1.NOTIFICATION_TYPES.MODERATOR_CHANGE_REQUEST_APPROVED,
                    text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been approved`,
                    community: community._id
                });
                return moderatorNotification;
            }
            return null;
        }
        catch (error) {
            throw error;
        }
    }),
    delete_single_rule: (community, moderatorRequest, shouldNotifyModerator) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!moderatorRequest.deleteRuleIds ||
                (moderatorRequest.deleteRuleIds && moderatorRequest.deleteRuleIds.length === 0)) {
                throw new appError_1.default(400, 'No rules provided for deletion');
            }
            const ruleToDelete = moderatorRequest.deleteRuleIds[0];
            community.rules = community.rules.filter((rule) => rule._id.toString() !== ruleToDelete.toString());
            yield community.save();
            moderatorRequest.status = 'approved';
            yield moderatorRequest.save();
            yield communityActivityLogs_2.default.create({
                community: community._id,
                logType: communityActivityLogs_1.COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
                moderator: moderatorRequest.moderator,
                text: `approved request to delete community rule by moderator`,
                moderatorRequest: moderatorRequest._id
            });
            if (shouldNotifyModerator) {
                const moderatorNotification = yield notificationModel_1.default.create({
                    receiver: moderatorRequest.moderator,
                    notificationType: notifications_1.NOTIFICATION_TYPES.MODERATOR_CHANGE_REQUEST_APPROVED,
                    text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been approved`,
                    community: community._id
                });
                return moderatorNotification;
            }
            return null;
        }
        catch (error) {
            throw error;
        }
    }),
    delete_multiple_rules: (community, moderatorRequest, shouldNotifyModerator) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!moderatorRequest.deleteRuleIds ||
                (moderatorRequest.deleteRuleIds && moderatorRequest.deleteRuleIds.length === 0)) {
                throw new appError_1.default(400, 'No rules provided for deletion');
            }
            community.rules = community.rules.filter((rule) => !moderatorRequest.deleteRuleIds.includes(rule._id.toString()));
            yield community.save();
            moderatorRequest.status = 'approved';
            yield moderatorRequest.save();
            yield communityActivityLogs_2.default.create({
                community: community._id,
                logType: communityActivityLogs_1.COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
                moderator: moderatorRequest.moderator,
                text: `approved request to delete multiple community rule by moderator`,
                moderatorRequest: moderatorRequest._id
            });
            if (shouldNotifyModerator) {
                const moderatorNotification = yield notificationModel_1.default.create({
                    receiver: moderatorRequest.moderator,
                    notificationType: notifications_1.NOTIFICATION_TYPES.MODERATOR_CHANGE_REQUEST_APPROVED,
                    text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been approved`,
                    community: community._id
                });
                return moderatorNotification;
            }
            return null;
        }
        catch (error) {
            throw error;
        }
    }),
    delete_all_rules: (community, moderatorRequest, shouldNotifyModerator) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            community.set('rules', []);
            yield community.save();
            moderatorRequest.status = 'approved';
            yield moderatorRequest.save();
            yield communityActivityLogs_2.default.create({
                community: community._id,
                logType: communityActivityLogs_1.COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
                moderator: moderatorRequest.moderator,
                text: `approved request to delete all community rule by moderator`,
                moderatorRequest: moderatorRequest._id
            });
            if (shouldNotifyModerator) {
                const moderatorNotification = yield notificationModel_1.default.create({
                    receiver: moderatorRequest.moderator,
                    notificationType: notifications_1.NOTIFICATION_TYPES.MODERATOR_CHANGE_REQUEST_APPROVED,
                    text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been approved`,
                    community: community._id
                });
                return moderatorNotification;
            }
            return null;
        }
        catch (error) {
            throw error;
        }
    })
};
exports.default = CommunityModeratorChangeRequestService;
