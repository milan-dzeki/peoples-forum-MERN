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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCommunity = exports.deleteAllCommunityRules = exports.deleteMultipleCommunityRules = exports.deleteSingleCommunityRule = exports.updateCommunityRules = exports.updateSingleCommunityRule = exports.addNewCommunityRule = exports.removeCommunityBannerImage = exports.updateCommunityBannerImage = exports.removeCommunityProfileImage = exports.updateCommunityProfileImage = exports.updateCommunityDescription = exports.createCommunity = void 0;
const cloudinary_1 = __importDefault(require("configs/cloudinary"));
const communityModeratorChangeRequests_1 = require("configs/communityModeratorChangeRequests");
const catchAsync_1 = __importDefault(require("utils/catchAsync"));
const communityValidator_1 = __importDefault(require("configs/validators/community/communityValidator"));
const communityService_1 = __importDefault(require("services/communityService"));
const cloudinaryManagementService_1 = __importDefault(require("services/cloudinaryManagementService"));
const appError_1 = __importDefault(require("utils/appError"));
const communityModel_1 = __importDefault(require("models/communityModel"));
const communitySettingsModel_1 = __importDefault(require("models/settings/communitySettingsModel"));
const chatModel_1 = __importDefault(require("models/chatModel"));
const messageModel_1 = __importDefault(require("models/messageModel"));
const communityActivityLogs_1 = __importDefault(require("models/communityActivityLogs"));
const communityActivityLogs_2 = require("configs/communityActivityLogs");
const notifications_1 = require("configs/notifications");
const handleSendModeratorRequestResponseAction_1 = __importDefault(require("utils/builders/community/handleSendModeratorRequestResponseAction"));
const handleSendUpdateCommunityFieldRequestResponseAction_1 = __importDefault(require("utils/builders/community/handleSendUpdateCommunityFieldRequestResponseAction"));
exports.createCommunity = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { pendingInvitedModerators, name, description, rules, pendingInvitedUsers, chatNames } = req.fields;
    const parsedPendingInvitedModerators = pendingInvitedModerators ? JSON.parse(pendingInvitedModerators) : [];
    const parsedRules = rules ? JSON.parse(rules) : [];
    const parsedPendingInvitedUsers = pendingInvitedUsers ? JSON.parse(pendingInvitedUsers) : [];
    const parsedChatNames = chatNames ? JSON.parse(chatNames) : [];
    const { errors } = yield communityValidator_1.default.validateCommunityInputs({
        pendingInvitedModerators: parsedPendingInvitedModerators,
        name,
        description,
        rules: parsedRules,
        pendingInvitedUsers: parsedPendingInvitedUsers,
        chatNames: parsedChatNames
    });
    if (errors) {
        next(new appError_1.default(422, 'Invalid Inputs', errors));
        return;
    }
    const prepareCommunity = {
        creator: req.userId,
        pendingInvitedModerators: parsedPendingInvitedModerators,
        moderators: [],
        name: name,
        description: description,
        rules: parsedRules,
        pendingInvitedUsers: parsedPendingInvitedUsers,
        members: [],
        bannedUsers: [],
        availableChats: []
    };
    if (req.files) {
        if (req.files.profileImage) {
            const uploadedPhotoData = yield cloudinaryManagementService_1.default.uploadSinglePhotoToCloudinary(req.files.profilePhotoImage);
            prepareCommunity.profileImageUrl = uploadedPhotoData.secure_url;
            prepareCommunity.profileImagePublicId = uploadedPhotoData.secure_url;
        }
        if (req.files.bannerImage) {
            const uploadedPhotoData = yield cloudinaryManagementService_1.default.uploadSinglePhotoToCloudinary(req.files.bannerImage);
            prepareCommunity.bannerImageUrl = uploadedPhotoData.secure_url;
            prepareCommunity.bannerImagePublicId = uploadedPhotoData.secure_url;
        }
    }
    const newCommunity = yield communityModel_1.default.create(prepareCommunity);
    const communitySettings = yield communitySettingsModel_1.default.create({ community: newCommunity._id });
    const communitySettingsWithVirtuals = communitySettings.toJSON({ virtuals: true });
    const chatIds = yield communityService_1.default.createCommunityChatsUponCommunityCreation(req.userId, newCommunity._id, parsedChatNames);
    newCommunity.availableChats = chatIds;
    yield newCommunity.save();
    yield communityActivityLogs_1.default.create({
        community: newCommunity._id,
        logType: 'communityCreated',
        text: 'created community',
        user: req.userId
    });
    return res.status(201).json({
        status: 'success',
        message: 'Community created successfully',
        community: newCommunity,
        communitySettings: communitySettingsWithVirtuals
    });
}));
exports.updateCommunityDescription = (0, catchAsync_1.default)((req, res, _) => __awaiter(void 0, void 0, void 0, function* () {
    const { description } = req.body;
    communityValidator_1.default.validateStringValues(description, 'description', true);
    const community = req.community;
    const isCreator = req.isCreator;
    const moderatorActionRequirePermission = req.moderatorActionRequirePermission;
    if (!isCreator && moderatorActionRequirePermission) {
        const prepareModeratorRequestResponse = new handleSendModeratorRequestResponseAction_1.default()
            .setCommons({ communityId: community._id, moderator: req.userId })
            .setModeratorRequestData({
            requestType: communityModeratorChangeRequests_1.COMMUNITY_MODERATOR_REQUEST_TYPES.UPDATE_DESCRIPTION,
            communityCreator: community.creator,
            requestText: `*user* (moderator) wants to change "${community.name}" community description to: "${description}"`,
            updateValues: { newDescriptionValue: description }
        })
            .setCommunityActivityLogData({
            logType: communityActivityLogs_2.COMMUNITY_LOG_TYPE.MODERATOR_MADE_REQUESTS,
            text: `Moderator *user* made request to update community description to "${description}"`
        })
            .setResJson({
            res,
            message: `Request to update community description to "${description}" is sent to admin`
        });
        const moderatorRequestResponse = yield prepareModeratorRequestResponse.execute();
        return moderatorRequestResponse;
    }
    const prepareUpdateResponse = new handleSendUpdateCommunityFieldRequestResponseAction_1.default()
        .setFieldUpdateHandler(communityService_1.default.updateFieldHandlers.handleUpdateDescription.bind(null, community, description))
        .setCommunityId(community._id)
        .setCommunityActivityLogData({
        moderator: req.userId,
        logType: communityActivityLogs_2.COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
        text: `Moderator *user* updated community description to "${description}"`
    })
        .setModeratorsNotificationsData({
        moderators: community.moderators,
        communityCreator: community.creator,
        notificationType: notifications_1.NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
        text: `"${community.name}" community description was changed`,
        sender: req.userId,
        doNotIncludeIds: [req.userId]
    })
        .setResJson({
        res,
        message: 'Community description updated successfully'
    });
    const updateResponse = yield prepareUpdateResponse.execute();
    return updateResponse;
}));
exports.updateCommunityProfileImage = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const reqFiles = req.files;
    if (!reqFiles ||
        (reqFiles && !reqFiles.profileImage) ||
        (reqFiles && reqFiles.profileImage && !reqFiles.profileImage.path)) {
        next(new appError_1.default(400, 'No new photo is provided'));
        return;
    }
    const community = req.community;
    const isCreator = req.isCreator;
    const moderatorActionRequirePermission = req.moderatorActionRequirePermission;
    const uploadedPhotoData = yield cloudinaryManagementService_1.default.uploadSinglePhotoToCloudinary(reqFiles.profileImage);
    if (!isCreator && moderatorActionRequirePermission) {
        const prepareModeratorRequestResponse = new handleSendModeratorRequestResponseAction_1.default()
            .setCommons({ communityId: community._id, moderator: req.userId })
            .setModeratorRequestData({
            requestType: communityModeratorChangeRequests_1.COMMUNITY_MODERATOR_REQUEST_TYPES.UPDATE_PROFILE_PHOTO,
            communityCreator: community.creator,
            requestText: `*user* (moderator) wants to change "${community.name}" community profile image.`,
            updateValues: { photo: {
                    secure_url: uploadedPhotoData.secure_url,
                    public_id: uploadedPhotoData.public_id
                } }
        })
            .setCommunityActivityLogData({
            logType: communityActivityLogs_2.COMMUNITY_LOG_TYPE.MODERATOR_MADE_REQUESTS,
            text: 'Moderator *user* made request to update community profile photo',
            photoUrl: uploadedPhotoData.secure_url
        })
            .setResJson({
            res,
            message: 'Request to update community profile image is sent to admin'
        });
        const moderatorRequestResponse = yield prepareModeratorRequestResponse.execute();
        return moderatorRequestResponse;
    }
    const prepareUpdateResponse = new handleSendUpdateCommunityFieldRequestResponseAction_1.default()
        .setResponseField('newProfilePhoto')
        .setFieldUpdateHandler(communityService_1.default.updateFieldHandlers.handleUpdateProfilePhoto.bind(null, community, { secure_url: uploadedPhotoData.secure_url, public_id: uploadedPhotoData.public_id }))
        .setCommunityId(community._id)
        .setCommunityActivityLogData({
        moderator: req.userId,
        logType: communityActivityLogs_2.COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
        text: 'Moderator *user* updated community profile photo'
    })
        .setModeratorsNotificationsData({
        moderators: community.moderators,
        communityCreator: community.creator,
        notificationType: notifications_1.NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
        text: `"${community.name}" community profile photo was changed`,
        sender: req.userId,
        doNotIncludeIds: [req.userId]
    })
        .setResJson({
        res,
        message: 'Community profile photo updated successfully'
    });
    const updateResponse = yield prepareUpdateResponse.execute();
    return updateResponse;
}));
exports.removeCommunityProfileImage = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const community = req.community;
    const profileImagePublicId = community.profileImagePublicId;
    if (!profileImagePublicId) {
        next(new appError_1.default(404, 'Community doesnt have profile image, so there is nothing to remove'));
        return;
    }
    const isCreator = req.isCreator;
    const moderatorActionRequirePermission = req.moderatorActionRequirePermission;
    if (!isCreator && moderatorActionRequirePermission) {
        const prepareModeratorRequestResponse = new handleSendModeratorRequestResponseAction_1.default()
            .setCommons({ communityId: community._id, moderator: req.userId })
            .setModeratorRequestData({
            requestType: communityModeratorChangeRequests_1.COMMUNITY_MODERATOR_REQUEST_TYPES.REMOVE_PROFILE_PHOTO,
            communityCreator: community.creator,
            requestText: 'Moderator *user* made request to remove community profile photo'
        })
            .setCommunityActivityLogData({
            logType: communityActivityLogs_2.COMMUNITY_LOG_TYPE.MODERATOR_MADE_REQUESTS,
            text: 'Moderator *user* made request to update community profile photo'
        })
            .setResJson({
            res,
            message: 'Request to remove community profile image is sent to admin.'
        });
        const moderatorRequestResponse = yield prepareModeratorRequestResponse.execute();
        return moderatorRequestResponse;
    }
    const prepareUpdateResponse = new handleSendUpdateCommunityFieldRequestResponseAction_1.default()
        .setFieldUpdateHandler(communityService_1.default.updateFieldHandlers.handleRemoveProfilePhoto.bind(null, community))
        .setCommunityId(community._id)
        .setCommunityActivityLogData({
        moderator: req.userId,
        logType: communityActivityLogs_2.COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
        text: 'Moderator *user* removed community profile photo'
    })
        .setModeratorsNotificationsData({
        moderators: community.moderators,
        communityCreator: community.creator,
        notificationType: notifications_1.NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
        text: `"${community.name}" community profile photo was removed`,
        sender: req.userId,
        doNotIncludeIds: [req.userId]
    })
        .setResJson({
        res,
        message: 'Community profile photo removed successfully'
    });
    const updateResponse = yield prepareUpdateResponse.execute();
    return updateResponse;
}));
exports.updateCommunityBannerImage = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const reqFiles = req.files;
    if (!reqFiles ||
        (reqFiles && !reqFiles.bannerImage) ||
        (reqFiles && reqFiles.bannerImage && !reqFiles.bannerImage.path)) {
        next(new appError_1.default(400, 'No new photo is provided'));
        return;
    }
    const community = req.community;
    const isCreator = req.isCreator;
    const moderatorActionRequirePermission = req.moderatorActionRequirePermission;
    const uploadedPhotoData = yield cloudinaryManagementService_1.default.uploadSinglePhotoToCloudinary(reqFiles.bannerImage);
    if (!isCreator && moderatorActionRequirePermission) {
        const prepareModeratorRequestResponse = new handleSendModeratorRequestResponseAction_1.default()
            .setCommons({ communityId: community._id, moderator: req.userId })
            .setModeratorRequestData({
            requestType: communityModeratorChangeRequests_1.COMMUNITY_MODERATOR_REQUEST_TYPES.UPDATE_BANNER_PHOTO,
            communityCreator: community.creator,
            requestText: `*user* (moderator) wants to change "${community.name}" community banner image.`,
            updateValues: { photo: {
                    secure_url: uploadedPhotoData.secure_url,
                    public_id: uploadedPhotoData.public_id
                } }
        })
            .setCommunityActivityLogData({
            logType: communityActivityLogs_2.COMMUNITY_LOG_TYPE.MODERATOR_MADE_REQUESTS,
            text: 'Moderator *user* made request to change community banner photo',
            photoUrl: uploadedPhotoData.secure_url
        })
            .setResJson({
            res,
            message: 'Request to update community banner image is sent to admin'
        });
        const moderatorRequestResponse = yield prepareModeratorRequestResponse.execute();
        return moderatorRequestResponse;
    }
    const prepareUpdateResponse = new handleSendUpdateCommunityFieldRequestResponseAction_1.default()
        .setResponseField('newBannerPhoto')
        .setFieldUpdateHandler(communityService_1.default.updateFieldHandlers.handleUpdateBannerPhoto.bind(null, community, { secure_url: uploadedPhotoData.secure_url, public_id: uploadedPhotoData.public_id }))
        .setCommunityId(community._id)
        .setCommunityActivityLogData({
        moderator: req.userId,
        logType: communityActivityLogs_2.COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
        text: 'Moderator *user* updated community profile photo'
    })
        .setModeratorsNotificationsData({
        moderators: community.moderators,
        communityCreator: community.creator,
        notificationType: notifications_1.NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
        text: `"${community.name}" community profile photo was changed`,
        sender: req.userId,
        doNotIncludeIds: [req.userId]
    })
        .setResJson({
        res,
        message: 'Community profile photo updated successfully'
    });
    const updateResponse = yield prepareUpdateResponse.execute();
    return updateResponse;
}));
exports.removeCommunityBannerImage = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const community = req.community;
    const bannerImagePublicId = community.bannerImagePublicId;
    if (!bannerImagePublicId) {
        next(new appError_1.default(404, 'Community doesnt have banner image so there is nothing to remove'));
        return;
    }
    const isCreator = req.isCreator;
    const moderatorActionRequirePermission = req.moderatorActionRequirePermission;
    if (!isCreator && moderatorActionRequirePermission) {
        const prepareModeratorRequestResponse = new handleSendModeratorRequestResponseAction_1.default()
            .setCommons({ communityId: community._id, moderator: req.userId })
            .setModeratorRequestData({
            requestType: communityModeratorChangeRequests_1.COMMUNITY_MODERATOR_REQUEST_TYPES.REMOVE_BANNER_PHOTO,
            communityCreator: community.creator,
            requestText: `*user* (moderator) wants to remove "${community.name}" community banner image.`
        })
            .setCommunityActivityLogData({
            logType: communityActivityLogs_2.COMMUNITY_LOG_TYPE.MODERATOR_MADE_REQUESTS,
            text: 'Moderator *user* made request to remove community banner photo'
        })
            .setResJson({
            res,
            message: 'Request to remove community banner image is sent to admin'
        });
        const moderatorRequestResponse = yield prepareModeratorRequestResponse.execute();
        return moderatorRequestResponse;
    }
    const prepareUpdateResponse = new handleSendUpdateCommunityFieldRequestResponseAction_1.default()
        .setFieldUpdateHandler(communityService_1.default.updateFieldHandlers.handleRemoveBannerPhoto.bind(null, community))
        .setCommunityId(community._id)
        .setCommunityActivityLogData({
        moderator: req.userId,
        logType: communityActivityLogs_2.COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
        text: 'Moderator *user* removed community banner photo'
    })
        .setModeratorsNotificationsData({
        moderators: community.moderators,
        communityCreator: community.creator,
        notificationType: notifications_1.NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
        text: `"${community.name}" community profile banner was removed`,
        sender: req.userId,
        doNotIncludeIds: [req.userId]
    })
        .setResJson({
        res,
        message: 'Community profile banner removed successfully'
    });
    const updateResponse = yield prepareUpdateResponse.execute();
    return updateResponse;
}));
/* COMMUNITY RULES CRUD --start */
exports.addNewCommunityRule = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { rule } = req.body;
    if (!rule || (rule && !rule.title)) {
        next(new appError_1.default(400, 'Rule to add not provided'));
        return;
    }
    communityValidator_1.default.areRulesValid([rule], true);
    const community = req.community;
    const isCreator = req.isCreator;
    const moderatorActionRequirePermission = req.moderatorActionRequirePermission;
    if (!isCreator && moderatorActionRequirePermission) {
        const prepareModeratorRequestResponse = new handleSendModeratorRequestResponseAction_1.default()
            .setCommons({ communityId: community._id, moderator: req.userId })
            .setModeratorRequestData({
            requestType: communityModeratorChangeRequests_1.COMMUNITY_MODERATOR_REQUEST_TYPES.ADD_RULE,
            communityCreator: community.creator,
            requestText: `*user* (moderator) wants to add new comunity rule for "${community.name}" community.`,
            updateValues: {
                newRules: [rule]
            }
        })
            .setCommunityActivityLogData({
            logType: communityActivityLogs_2.COMMUNITY_LOG_TYPE.MODERATOR_MADE_REQUESTS,
            text: 'Moderator *user* made request to add new community rule'
        })
            .setResJson({
            res,
            message: 'Request to add new community rule is sent to admin.'
        });
        const moderatorRequestResponse = yield prepareModeratorRequestResponse.execute();
        return moderatorRequestResponse;
    }
    const prepareUpdateResponse = new handleSendUpdateCommunityFieldRequestResponseAction_1.default()
        .setResponseField('newRule')
        .setFieldUpdateHandler(communityService_1.default.updateFieldHandlers.handleAddRule.bind(null, community, rule))
        .setCommunityId(community._id)
        .setCommunityActivityLogData({
        moderator: req.userId,
        logType: communityActivityLogs_2.COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
        text: 'Moderator *user* added new community rule'
    })
        .setModeratorsNotificationsData({
        moderators: community.moderators,
        communityCreator: community.creator,
        notificationType: notifications_1.NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
        sender: req.userId,
        text: `"${community.name}" community has new rule added`,
        doNotIncludeIds: [req.userId]
    })
        .setResJson({
        res,
        message: 'New community rule added successfully'
    });
    const updateResponse = yield prepareUpdateResponse.execute();
    return updateResponse;
}));
exports.updateSingleCommunityRule = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const community = req.community;
    const { rule } = req.body;
    if (!rule || (rule && (!rule._id || !rule.title))) {
        next(new appError_1.default(422, 'Invalid rule data provided'));
        return;
    }
    const targetRuleIndex = communityService_1.default.getUpdateRuleIndex(community.rules, rule);
    communityValidator_1.default.areRulesValid([rule], true);
    const isCreator = req.isCreator;
    const moderatorActionRequirePermission = req.moderatorActionRequirePermission;
    if (!isCreator && moderatorActionRequirePermission) {
        const prepareModeratorRequestResponse = new handleSendModeratorRequestResponseAction_1.default()
            .setCommons({ communityId: community._id, moderator: req.userId })
            .setModeratorRequestData({
            requestType: communityModeratorChangeRequests_1.COMMUNITY_MODERATOR_REQUEST_TYPES.UPDATE_SINGLE_RULE,
            communityCreator: community.creator,
            requestText: `*user* (moderator) wants to update comunity rule for "${community.name}" community.`,
            updateValues: {
                newRules: [rule]
            }
        })
            .setCommunityActivityLogData({
            logType: communityActivityLogs_2.COMMUNITY_LOG_TYPE.MODERATOR_MADE_REQUESTS,
            text: 'Moderator *user* made request to update community rule'
        })
            .setResJson({
            res,
            message: 'Request to update community rule is sent to admin.'
        });
        const moderatorRequestResponse = yield prepareModeratorRequestResponse.execute();
        return moderatorRequestResponse;
    }
    const prepareUpdateResponse = new handleSendUpdateCommunityFieldRequestResponseAction_1.default()
        .setResponseField('updatedRule')
        .setFieldUpdateHandler(communityService_1.default.updateFieldHandlers.handleUpdateSingleRule.bind(null, community, rule, targetRuleIndex))
        .setCommunityId(community._id)
        .setCommunityActivityLogData({
        moderator: req.userId,
        logType: communityActivityLogs_2.COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
        text: 'Moderator *user* updated community rule'
    })
        .setModeratorsNotificationsData({
        moderators: community.moderators,
        communityCreator: community.creator,
        notificationType: notifications_1.NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
        sender: req.userId,
        text: `"${community.name}" community has 1 rule updated`,
        doNotIncludeIds: [req.userId]
    })
        .setResJson({
        res,
        message: 'Community rule updated successfully'
    });
    const updateResponse = yield prepareUpdateResponse.execute();
    return updateResponse;
}));
exports.updateCommunityRules = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const community = req.community;
    const { rules } = req.body;
    if (!rules || (rules && rules.length === 0)) {
        next(new appError_1.default(422, 'No rules have been provided'));
        return;
    }
    communityValidator_1.default.areRulesValid(rules, true);
    const isCreator = req.isCreator;
    const moderatorActionRequirePermission = req.moderatorActionRequirePermission;
    if (!isCreator && moderatorActionRequirePermission) {
        const prepareModeratorRequestResponse = new handleSendModeratorRequestResponseAction_1.default()
            .setCommons({ communityId: community._id, moderator: req.userId })
            .setModeratorRequestData({
            requestType: communityModeratorChangeRequests_1.COMMUNITY_MODERATOR_REQUEST_TYPES.UPDATE_RULES,
            communityCreator: community.creator,
            requestText: `*user* (moderator) wants to update comunity rules for "${community.name}" community.`,
            updateValues: {
                newRules: [...rules]
            }
        })
            .setCommunityActivityLogData({
            logType: communityActivityLogs_2.COMMUNITY_LOG_TYPE.MODERATOR_MADE_REQUESTS,
            text: 'Moderator *user* made request to update community rules'
        })
            .setResJson({
            res,
            message: 'Request to update community rules is sent to admin.'
        });
        const moderatorRequestResponse = yield prepareModeratorRequestResponse.execute();
        return moderatorRequestResponse;
    }
    const prepareUpdateResponse = new handleSendUpdateCommunityFieldRequestResponseAction_1.default()
        .setResponseField('updatedRules')
        .setFieldUpdateHandler(communityService_1.default.updateFieldHandlers.handleUpdateCommunityRules.bind(null, community, rules))
        .setCommunityId(community._id)
        .setCommunityActivityLogData({
        moderator: req.userId,
        logType: communityActivityLogs_2.COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
        text: 'Moderator *user* updated community rules'
    })
        .setModeratorsNotificationsData({
        moderators: community.moderators,
        communityCreator: community.creator,
        notificationType: notifications_1.NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
        sender: req.userId,
        text: `"${community.name}" community rules have been updated`,
        doNotIncludeIds: [req.userId]
    })
        .setResJson({
        res,
        message: 'Community rules updated successfully'
    });
    const updateResponse = yield prepareUpdateResponse.execute();
    return updateResponse;
}));
exports.deleteSingleCommunityRule = (0, catchAsync_1.default)((req, res, _) => __awaiter(void 0, void 0, void 0, function* () {
    const community = req.community;
    const { ruleId } = req.params;
    communityService_1.default.doesRuleExist(community.rules, ruleId);
    const isCreator = req.isCreator;
    const moderatorActionRequirePermission = req.moderatorActionRequirePermission;
    if (!isCreator && moderatorActionRequirePermission) {
        const prepareModeratorRequestResponse = new handleSendModeratorRequestResponseAction_1.default()
            .setCommons({ communityId: community._id, moderator: req.userId })
            .setModeratorRequestData({
            requestType: communityModeratorChangeRequests_1.COMMUNITY_MODERATOR_REQUEST_TYPES.DELETE_SINGLE_RULE,
            communityCreator: community.creator,
            requestText: `*user* (moderator) wants to delete comunity rule for "${community.name}" community.`,
            updateValues: {
                deleteRuleIds: [ruleId]
            }
        })
            .setCommunityActivityLogData({
            logType: communityActivityLogs_2.COMMUNITY_LOG_TYPE.MODERATOR_MADE_REQUESTS,
            text: 'Moderator *user* made request to delete community rule'
        })
            .setResJson({
            res,
            message: 'Request to delete community rule is sent to admin.'
        });
        const moderatorRequestResponse = yield prepareModeratorRequestResponse.execute();
        return moderatorRequestResponse;
    }
    const prepareUpdateResponse = new handleSendUpdateCommunityFieldRequestResponseAction_1.default()
        .setFieldUpdateHandler(communityService_1.default.updateFieldHandlers.handleDeleteSingleRule.bind(null, community, ruleId))
        .setCommunityId(community._id)
        .setCommunityActivityLogData({
        moderator: req.userId,
        logType: communityActivityLogs_2.COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
        text: 'Moderator *user* deleted 1 community rule'
    })
        .setModeratorsNotificationsData({
        moderators: community.moderators,
        communityCreator: community.creator,
        notificationType: notifications_1.NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
        sender: req.userId,
        text: `"${community.name}" community rules have been updated`,
        doNotIncludeIds: [req.userId]
    })
        .setResJson({
        res,
        message: 'Community rule deleted successfully'
    });
    const updateResponse = yield prepareUpdateResponse.execute();
    return updateResponse;
}));
exports.deleteMultipleCommunityRules = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const community = req.community;
    const { ruleIds } = req.body;
    if (!ruleIds || (ruleIds && ruleIds.length === 0)) {
        next(new appError_1.default(422, 'No rule ids are provided'));
        return;
    }
    const isCreator = req.isCreator;
    const moderatorActionRequirePermission = req.moderatorActionRequirePermission;
    if (!isCreator && moderatorActionRequirePermission) {
        const prepareModeratorRequestResponse = new handleSendModeratorRequestResponseAction_1.default()
            .setCommons({ communityId: community._id, moderator: req.userId })
            .setModeratorRequestData({
            requestType: communityModeratorChangeRequests_1.COMMUNITY_MODERATOR_REQUEST_TYPES.DELETE_MULTIPLE_RULES,
            communityCreator: community.creator,
            requestText: `*user* (moderator) wants to delete multiple comunity rules for "${community.name}" community.`,
            updateValues: {
                deleteRuleIds: ruleIds
            }
        })
            .setCommunityActivityLogData({
            logType: communityActivityLogs_2.COMMUNITY_LOG_TYPE.MODERATOR_MADE_REQUESTS,
            text: 'Moderator *user* made request to delete multiple community rules'
        })
            .setResJson({
            res,
            message: 'Request to delete multiple community rules is sent to admin.'
        });
        const moderatorRequestResponse = yield prepareModeratorRequestResponse.execute();
        return moderatorRequestResponse;
    }
    const prepareUpdateResponse = new handleSendUpdateCommunityFieldRequestResponseAction_1.default()
        .setFieldUpdateHandler(communityService_1.default.updateFieldHandlers.handleDeleteMultipleRules.bind(null, community, ruleIds))
        .setCommunityId(community._id)
        .setCommunityActivityLogData({
        moderator: req.userId,
        logType: communityActivityLogs_2.COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
        text: 'Moderator *user* deleted multiple community rules'
    })
        .setModeratorsNotificationsData({
        moderators: community.moderators,
        communityCreator: community.creator,
        notificationType: notifications_1.NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
        sender: req.userId,
        text: `"${community.name}" community rules have been updated`,
        doNotIncludeIds: [req.userId]
    })
        .setResJson({
        res,
        message: 'Community rules deleted successfully'
    });
    const updateResponse = yield prepareUpdateResponse.execute();
    return updateResponse;
}));
exports.deleteAllCommunityRules = (0, catchAsync_1.default)((req, res, _) => __awaiter(void 0, void 0, void 0, function* () {
    const community = req.community;
    const isCreator = req.isCreator;
    const moderatorActionRequirePermission = req.moderatorActionRequirePermission;
    if (!isCreator && moderatorActionRequirePermission) {
        const prepareModeratorRequestResponse = new handleSendModeratorRequestResponseAction_1.default()
            .setCommons({ communityId: community._id, moderator: req.userId })
            .setModeratorRequestData({
            requestType: communityModeratorChangeRequests_1.COMMUNITY_MODERATOR_REQUEST_TYPES.DELETE_ALL_RULES,
            communityCreator: community.creator,
            requestText: `*user* (moderator) wants to delete all comunity rules for "${community.name}" community.`
        })
            .setCommunityActivityLogData({
            logType: communityActivityLogs_2.COMMUNITY_LOG_TYPE.MODERATOR_MADE_REQUESTS,
            text: 'Moderator *user* made request to all multiple community rules'
        })
            .setResJson({
            res,
            message: 'Request to delete all community rules is sent to admin.'
        });
        const moderatorRequestResponse = yield prepareModeratorRequestResponse.execute();
        return moderatorRequestResponse;
    }
    const prepareUpdateResponse = new handleSendUpdateCommunityFieldRequestResponseAction_1.default()
        .setFieldUpdateHandler(communityService_1.default.updateFieldHandlers.handleDeleteAllRules.bind(null, community))
        .setCommunityId(community._id)
        .setCommunityActivityLogData({
        moderator: req.userId,
        logType: communityActivityLogs_2.COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
        text: 'Moderator *user* deleted all community rules'
    })
        .setModeratorsNotificationsData({
        moderators: community.moderators,
        communityCreator: community.creator,
        notificationType: notifications_1.NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
        sender: req.userId,
        text: `"${community.name}" community rules have been deleted`,
        doNotIncludeIds: [req.userId]
    })
        .setResJson({
        res,
        message: 'All community rules deleted successfully'
    });
    const updateResponse = yield prepareUpdateResponse.execute();
    return updateResponse;
}));
/* COMMUNITY RULES CRUD --end */
exports.deleteCommunity = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const communityToDelete = req.community;
    if (communityToDelete.creator.toString() !== req.userId.toString()) {
        next(new appError_1.default(401, 'Only creator can remove delete community.'));
        return;
    }
    if (communityToDelete.bannerImagePublicId) {
        yield cloudinary_1.default.uploader.destroy(communityToDelete.bannerImagePublicId);
    }
    if (communityToDelete.profileImagePublicId) {
        yield cloudinary_1.default.uploader.destroy(communityToDelete.profileImagePublicId);
    }
    if (communityToDelete.availableChats) {
        for (const chatId of communityToDelete.availableChats) {
            // should delete chat images
            yield chatModel_1.default.deleteOne({ _id: chatId });
        }
        // should delete message images. videos, files and audios
        yield messageModel_1.default.deleteMany({ communityId: communityToDelete._id });
    }
    yield communityModel_1.default.deleteOne({ _id: communityToDelete._id });
    return res.status(204).json({
        status: 'success',
        message: 'Community deleted successfully together with all associated chats'
    });
}));
