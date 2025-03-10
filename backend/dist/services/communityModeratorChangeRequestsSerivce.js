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
const communityActivityLogs_1 = require("configs/community/communityActivityLogs");
const communityModeratorChangeRequests_1 = require("configs/community/communityModeratorChangeRequests");
const notifications_1 = require("configs/notifications");
const communityModeratorChangeRequestModel_1 = __importDefault(require("models/communityModeratorChangeRequestModel"));
const appError_1 = __importDefault(require("utils/appError"));
const communityService_1 = __importDefault(require("./communityService"));
const handleSendUpdateCommunityFieldRequestResponseAction_1 = __importDefault(require("utils/builders/community/handleSendUpdateCommunityFieldRequestResponseAction"));
class CommunityModeratorChangeRequestService {
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
            const prepareResponse = new handleSendUpdateCommunityFieldRequestResponseAction_1.default()
                .setResponseField('newDescription')
                .setFieldUpdateHandler(communityService_1.default.updateFieldHandlers.handleUpdateDescription.bind(null, community, updatedDescription, true, moderatorRequest))
                .setCommunityId(community._id)
                .setCommunityActivityLogData({
                moderator: moderatorRequest.moderator,
                logType: communityActivityLogs_1.COMMUNITY_LOG_TYPE.HANDLE_MODERATOR_REQUESTS,
                text: `accepted *user* request to update community description to "${updatedDescription}"`,
            })
                .setApprovedRequestModeratorNotification({
                receiver: moderatorRequest.moderator,
                text: `Your request to "${moderatorRequest.requestType}" for "${community.name}" community has been approved`
            })
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
    update_profile_photo: (community, moderatorRequest, res) => __awaiter(void 0, void 0, void 0, function* () {
        const moderatorRequestPhoto = moderatorRequest.photo;
        const prepareUpdateResponse = new handleSendUpdateCommunityFieldRequestResponseAction_1.default()
            .setResponseField('newProfilePhoto')
            .setCommunityId(community._id)
            .setFieldUpdateHandler(communityService_1.default.updateFieldHandlers.handleUpdateProfilePhoto.bind(null, community, moderatorRequestPhoto, moderatorRequest, true))
            .setCommunityActivityLogData({
            moderator: moderatorRequest.moderator,
            logType: communityActivityLogs_1.COMMUNITY_LOG_TYPE.HANDLE_MODERATOR_REQUESTS,
            text: 'accepted *user* request to update community profile photo'
        })
            .setApprovedRequestModeratorNotification({
            receiver: moderatorRequest.moderator,
            text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been approved`
        })
            .setModeratorsNotificationsData({
            moderators: community.moderators,
            communityCreator: community.creator,
            notificationType: notifications_1.NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
            text: `"${community.name}" community profile photo was changed`,
            sender: community.creator,
            doNotIncludeIds: [community.creator, moderatorRequest.moderator]
        })
            .setResJson({
            res,
            message: 'Community profile photo updated successfully'
        });
        const updateResponse = yield prepareUpdateResponse.execute();
        return updateResponse;
    }),
    remove_profile_photo: (community, moderatorRequest, res) => __awaiter(void 0, void 0, void 0, function* () {
        const prepareUpdateResponse = new handleSendUpdateCommunityFieldRequestResponseAction_1.default()
            .setCommunityId(community._id)
            .setFieldUpdateHandler(communityService_1.default.updateFieldHandlers.handleRemoveProfilePhoto.bind(null, community, moderatorRequest, true))
            .setCommunityActivityLogData({
            moderator: moderatorRequest.moderator,
            logType: communityActivityLogs_1.COMMUNITY_LOG_TYPE.HANDLE_MODERATOR_REQUESTS,
            text: 'accepted *user* request to remove community profile photo'
        })
            .setApprovedRequestModeratorNotification({
            receiver: moderatorRequest.moderator,
            text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been approved`
        })
            .setModeratorsNotificationsData({
            moderators: community.moderators,
            communityCreator: community.creator,
            notificationType: notifications_1.NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
            text: `"${community.name}" community profile photo was removed`,
            sender: community.creator,
            doNotIncludeIds: [community.creator, moderatorRequest.moderator]
        })
            .setResJson({
            res,
            message: 'Community profile photo removed successfully'
        });
        const updateResponse = yield prepareUpdateResponse.execute();
        return updateResponse;
    }),
    update_banner_photo: (community, moderatorRequest, res) => __awaiter(void 0, void 0, void 0, function* () {
        const moderatorRequestPhoto = moderatorRequest.photo;
        const prepareUpdateResponse = new handleSendUpdateCommunityFieldRequestResponseAction_1.default()
            .setResponseField('newBannerPhoto')
            .setCommunityId(community._id)
            .setFieldUpdateHandler(communityService_1.default.updateFieldHandlers.handleUpdateBannerPhoto.bind(null, community, moderatorRequestPhoto, moderatorRequest, true))
            .setCommunityActivityLogData({
            moderator: moderatorRequest.moderator,
            logType: communityActivityLogs_1.COMMUNITY_LOG_TYPE.HANDLE_MODERATOR_REQUESTS,
            text: 'accepted *user* request to update community banner photo'
        })
            .setApprovedRequestModeratorNotification({
            receiver: moderatorRequest.moderator,
            text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been approved`
        })
            .setModeratorsNotificationsData({
            moderators: community.moderators,
            communityCreator: community.creator,
            notificationType: notifications_1.NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
            text: `"${community.name}" community banner photo was changed`,
            sender: community.creator,
            doNotIncludeIds: [community.creator, moderatorRequest.moderator]
        })
            .setResJson({
            res,
            message: 'Community banner photo updated successfully'
        });
        const updateResponse = yield prepareUpdateResponse.execute();
        return updateResponse;
    }),
    remove_banner_photo: (community, moderatorRequest, res) => __awaiter(void 0, void 0, void 0, function* () {
        const prepareUpdateResponse = new handleSendUpdateCommunityFieldRequestResponseAction_1.default()
            .setCommunityId(community._id)
            .setFieldUpdateHandler(communityService_1.default.updateFieldHandlers.handleRemoveBannerPhoto.bind(null, community, moderatorRequest, true))
            .setCommunityActivityLogData({
            moderator: moderatorRequest.moderator,
            logType: communityActivityLogs_1.COMMUNITY_LOG_TYPE.HANDLE_MODERATOR_REQUESTS,
            text: 'accepted *user* request to remove community banner photo'
        })
            .setApprovedRequestModeratorNotification({
            receiver: moderatorRequest.moderator,
            text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been approved`
        })
            .setModeratorsNotificationsData({
            moderators: community.moderators,
            communityCreator: community.creator,
            notificationType: notifications_1.NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
            text: `"${community.name}" community banner photo was removed`,
            sender: community.creator,
            doNotIncludeIds: [community.creator, moderatorRequest.moderator]
        })
            .setResJson({
            res,
            message: 'Community banner photo removed successfully'
        });
        const updateResponse = yield prepareUpdateResponse.execute();
        return updateResponse;
    }),
    add_rule: (community, moderatorRequest, res) => __awaiter(void 0, void 0, void 0, function* () {
        const newRule = moderatorRequest.newRules[0];
        const prepareUpdateResponse = new handleSendUpdateCommunityFieldRequestResponseAction_1.default()
            .setResponseField('newRule')
            .setFieldUpdateHandler(communityService_1.default.updateFieldHandlers.handleAddRule.bind(null, community, newRule, moderatorRequest, true))
            .setCommunityId(community._id)
            .setCommunityActivityLogData({
            moderator: moderatorRequest.moderator,
            logType: communityActivityLogs_1.COMMUNITY_LOG_TYPE.HANDLE_MODERATOR_REQUESTS,
            text: 'accepted *user* request to add new community rule'
        })
            .setApprovedRequestModeratorNotification({
            receiver: moderatorRequest.moderator,
            text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been approved`
        })
            .setModeratorsNotificationsData({
            moderators: community.moderators,
            communityCreator: community.creator,
            notificationType: notifications_1.NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
            sender: community.creator,
            text: `"${community.name}" community has new rule added`,
            doNotIncludeIds: [community.creator, moderatorRequest.moderator]
        })
            .setResJson({
            res,
            message: 'New community rule added successfully'
        });
        const updateResponse = yield prepareUpdateResponse.execute();
        return updateResponse;
    }),
    update_single_rule: (community, moderatorRequest, res) => __awaiter(void 0, void 0, void 0, function* () {
        const updatedRule = moderatorRequest.newRules[0];
        const targetRuleIndex = communityService_1.default.getUpdateRuleIndex(community.rules, updatedRule);
        const prepareUpdateResponse = new handleSendUpdateCommunityFieldRequestResponseAction_1.default()
            .setResponseField('updatedRule')
            .setFieldUpdateHandler(communityService_1.default.updateFieldHandlers.handleUpdateSingleRule.bind(null, community, updatedRule, targetRuleIndex, moderatorRequest, true))
            .setCommunityId(community._id)
            .setCommunityActivityLogData({
            moderator: moderatorRequest.moderator,
            logType: communityActivityLogs_1.COMMUNITY_LOG_TYPE.HANDLE_MODERATOR_REQUESTS,
            text: 'accepted *user* request to add update community rule'
        })
            .setApprovedRequestModeratorNotification({
            receiver: moderatorRequest.moderator,
            text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been approved`
        })
            .setModeratorsNotificationsData({
            moderators: community.moderators,
            communityCreator: community.creator,
            notificationType: notifications_1.NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
            sender: community.creator,
            text: `"${community.name}" community has 1 rule updated`,
            doNotIncludeIds: [community.creator, moderatorRequest.moderator]
        })
            .setResJson({
            res,
            message: 'Community rule updated successfully'
        });
        const updateResponse = yield prepareUpdateResponse.execute();
        return updateResponse;
    }),
    update_rules: (community, moderatorRequest, res) => __awaiter(void 0, void 0, void 0, function* () {
        const prepareUpdateResponse = new handleSendUpdateCommunityFieldRequestResponseAction_1.default()
            .setResponseField('updatedRules')
            .setFieldUpdateHandler(communityService_1.default.updateFieldHandlers.handleUpdateCommunityRules.bind(null, community, moderatorRequest.newRules, moderatorRequest, true))
            .setCommunityId(community._id)
            .setCommunityActivityLogData({
            moderator: moderatorRequest.moderator,
            logType: communityActivityLogs_1.COMMUNITY_LOG_TYPE.HANDLE_MODERATOR_REQUESTS,
            text: 'accepted *user* request to update community rules'
        })
            .setApprovedRequestModeratorNotification({
            receiver: moderatorRequest.moderator,
            text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been approved`
        })
            .setModeratorsNotificationsData({
            moderators: community.moderators,
            communityCreator: community.creator,
            notificationType: notifications_1.NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
            sender: community.creator,
            text: `"${community.name}" community rules have been updated`,
            doNotIncludeIds: [community.creator, moderatorRequest.moderator]
        })
            .setResJson({
            res,
            message: 'Community rules updated successfully'
        });
        const updateResponse = yield prepareUpdateResponse.execute();
        return updateResponse;
    }),
    delete_single_rule: (community, moderatorRequest, res) => __awaiter(void 0, void 0, void 0, function* () {
        const ruleId = moderatorRequest === null || moderatorRequest === void 0 ? void 0 : moderatorRequest.deleteRuleIds[0];
        const prepareUpdateResponse = new handleSendUpdateCommunityFieldRequestResponseAction_1.default()
            .setResponseField('updatedRules')
            .setFieldUpdateHandler(communityService_1.default.updateFieldHandlers.handleDeleteSingleRule.bind(null, community, ruleId, moderatorRequest, true))
            .setCommunityId(community._id)
            .setCommunityActivityLogData({
            moderator: moderatorRequest.moderator,
            logType: communityActivityLogs_1.COMMUNITY_LOG_TYPE.HANDLE_MODERATOR_REQUESTS,
            text: 'accepted *user* request to delete 1 community rule'
        })
            .setApprovedRequestModeratorNotification({
            receiver: moderatorRequest.moderator,
            text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been approved`
        })
            .setModeratorsNotificationsData({
            moderators: community.moderators,
            communityCreator: community.creator,
            notificationType: notifications_1.NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
            sender: community.creator,
            text: `"${community.name}" community rule have been deleted`,
            doNotIncludeIds: [community.creator, moderatorRequest.moderator]
        })
            .setResJson({
            res,
            message: 'Community rule deleted successfully'
        });
        const updateResponse = yield prepareUpdateResponse.execute();
        return updateResponse;
    }),
    delete_multiple_rules: (community, moderatorRequest, res) => __awaiter(void 0, void 0, void 0, function* () {
        const ruleIds = moderatorRequest === null || moderatorRequest === void 0 ? void 0 : moderatorRequest.deleteRuleIds;
        const prepareUpdateResponse = new handleSendUpdateCommunityFieldRequestResponseAction_1.default()
            .setFieldUpdateHandler(communityService_1.default.updateFieldHandlers.handleDeleteMultipleRules.bind(null, community, ruleIds, moderatorRequest, true))
            .setCommunityId(community._id)
            .setCommunityActivityLogData({
            moderator: moderatorRequest.moderator,
            logType: communityActivityLogs_1.COMMUNITY_LOG_TYPE.HANDLE_MODERATOR_REQUESTS,
            text: 'accepted *user* request to delete multiple community rules'
        })
            .setApprovedRequestModeratorNotification({
            receiver: moderatorRequest.moderator,
            text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been approved`
        })
            .setModeratorsNotificationsData({
            moderators: community.moderators,
            communityCreator: community.creator,
            notificationType: notifications_1.NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
            sender: community.creator,
            text: `"${community.name}" community rules have been updated`,
            doNotIncludeIds: [community.creator, moderatorRequest.moderator]
        })
            .setResJson({
            res,
            message: 'Community rules deleted successfully'
        });
        const updateResponse = yield prepareUpdateResponse.execute();
        return updateResponse;
    }),
    delete_all_rules: (community, moderatorRequest, res) => __awaiter(void 0, void 0, void 0, function* () {
        const prepareUpdateResponse = new handleSendUpdateCommunityFieldRequestResponseAction_1.default()
            .setFieldUpdateHandler(communityService_1.default.updateFieldHandlers.handleDeleteAllRules.bind(null, community))
            .setCommunityId(community._id)
            .setCommunityActivityLogData({
            moderator: moderatorRequest.moderator,
            logType: communityActivityLogs_1.COMMUNITY_LOG_TYPE.HANDLE_MODERATOR_REQUESTS,
            text: 'accepted *user* request to delete all community rules'
        })
            .setApprovedRequestModeratorNotification({
            receiver: moderatorRequest.moderator,
            text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been approved`
        })
            .setModeratorsNotificationsData({
            moderators: community.moderators,
            communityCreator: community.creator,
            notificationType: notifications_1.NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
            sender: community.creator,
            text: `"${community.name}" community rules have been deleted`,
            doNotIncludeIds: [community.creator, moderatorRequest.moderator]
        })
            .setResJson({
            res,
            message: 'All community rules deleted successfully'
        });
        const updateResponse = yield prepareUpdateResponse.execute();
        return updateResponse;
    })
};
exports.default = CommunityModeratorChangeRequestService;
