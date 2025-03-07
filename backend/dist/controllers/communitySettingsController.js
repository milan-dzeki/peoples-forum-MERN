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
exports.updateAllNonMemberPermissions = exports.updateSingleNonMembersPermission = exports.updateMembersCanViewOtherMembersSetting = exports.updateMembersAllChatsSettings = exports.updateMembersSingleChatsSetting = exports.updateMembersAllPostsSettings = exports.updateMembersSinglePostsSetting = exports.updateModeratorPermissions = exports.updateChangesByModeratorRequireCreatorApproval = exports.updateNotifyModeratorsForSettingChangesSetting = exports.updateCommunityAccess = exports.getCommunitySettings = void 0;
const community_1 = require("configs/community");
const communitySettings_1 = require("configs/communitySettings");
const catchAsync_1 = __importDefault(require("utils/catchAsync"));
const appError_1 = __importDefault(require("utils/appError"));
const communitySettingsService_1 = __importDefault(require("services/communitySettingsService"));
const CommunitySettingsValidator_1 = __importDefault(require("configs/validators/communitySettings/CommunitySettingsValidator"));
const communityActivityLogs_1 = __importDefault(require("models/communityActivityLogs"));
exports.getCommunitySettings = (0, catchAsync_1.default)((req, res, _) => __awaiter(void 0, void 0, void 0, function* () {
    const communitySettings = req.communitySettings;
    const communityWithVirtuals = communitySettings.toJSON({ virtuals: true });
    return res.status(200).json({
        status: 'success',
        communitySettings: communityWithVirtuals
    });
}));
exports.updateCommunityAccess = (0, catchAsync_1.default)((req, res, _) => __awaiter(void 0, void 0, void 0, function* () {
    const { access } = req.body;
    CommunitySettingsValidator_1.default.isCommunityAccessValueValid(access);
    const communitySettings = req.communitySettings;
    communitySettings.access.value = access;
    yield communitySettings.save();
    const additionalReqMessage = communitySettings.access.value
        ? 'Now even non-members will be able to see community content, if other settings allow it.'
        : 'Now non-members will not be able to view community content.';
    yield communitySettingsService_1.default.createCommunitySettingsChangedLog(communitySettings.community, req.userId, `changed community access to "${communitySettings.access.value}"`);
    return res.status(200).json({
        status: 'success',
        message: `Community access changed to "${communitySettings.access.value}". ${additionalReqMessage}`,
        updatedSetting: communitySettings.access.value
    });
}));
exports.updateNotifyModeratorsForSettingChangesSetting = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { data } = req.body;
    if (typeof data !== 'boolean') {
        next(new appError_1.default(422, 'Provided value for updating whether moderator actions require your approval must be either "true" or "false"'));
        return;
    }
    const communitySettings = req.communitySettings;
    communitySettings.moderators_settings.notifyModeratorAboutSettingsChanges.value = data;
    yield communitySettings.save();
    const additionalReqMessage = communitySettings.moderators_settings.notifyModeratorAboutSettingsChanges.value
        ? 'Now moderators will receive notifications for every setting change you make.'
        : 'Moderators will not be notified when settings are changed.';
    yield communitySettingsService_1.default.createCommunitySettingsChangedLog(communitySettings.community, req.userId, `${communitySettings.moderators_settings.notifyModeratorAboutSettingsChanges.value ? 'enabled' : 'disabled'} moderator notifications for settings changes`);
    return res.status(200).json({
        status: 'success',
        message: `Successfully changed setting to "${communitySettings.moderators_settings.notifyModeratorAboutSettingsChanges.value}". ${additionalReqMessage}`,
        updatedSetting: communitySettings.moderators_settings.notifyModeratorAboutSettingsChanges.value
    });
}));
exports.updateChangesByModeratorRequireCreatorApproval = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { data } = req.body;
    if (typeof data !== 'boolean') {
        next(new appError_1.default(422, 'Provided value for updating whether moderator actions require your approval must be either "true" or "false"'));
        return;
    }
    const communitySettings = req.communitySettings;
    communitySettings.moderators_settings.changesByModeratorRequireApproval.value = data;
    yield communitySettings.save();
    const additionalReqMessage = communitySettings.moderators_settings.changesByModeratorRequireApproval.value
        ? 'Now you will receive notificatons when moderators want to do something they have permision for (remove post, ban users etc)'
        : 'Now you will not be notified about moderator actions. However, you will still be able to see them in community settings logs.';
    yield communityActivityLogs_1.default.create({
        community: communitySettings.community,
        user: req.userId,
        logType: 'changedSettings',
        text: `Turned ${communitySettings.moderators_settings.changesByModeratorRequireApproval.value ? 'on' : 'off'} "moderator actions require admin approval" setting`
    });
    return res.status(200).json({
        status: 'success',
        message: `Successfully changed should moderator actions require your approval to "${communitySettings.moderators_settings.changesByModeratorRequireApproval.value}". ${additionalReqMessage}`,
        updatedSetting: communitySettings.moderators_settings.changesByModeratorRequireApproval.value
    });
}));
exports.updateModeratorPermissions = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { updatedPermissions } = req.body;
    if (!updatedPermissions ||
        (updatedPermissions && !Array.isArray(updatedPermissions))) {
        next(new appError_1.default(400, 'Invalid permission data provided. Must be list of permissions'));
        return;
    }
    const communitySettings = req.communitySettings;
    if (updatedPermissions.length === 0) {
        communitySettings.moderators_settings.moderatorPermissions.value = [];
        yield communitySettings.save();
        yield communitySettingsService_1.default.createCommunitySettingsChangedLog(communitySettings.community, req.userId, 'updated modertor permissions. Allowed permissions: none');
        return res.status(200).json({
            status: 'success',
            message: 'You have removed all permissions for moderators successfully. Now they have normal member permissions.',
            updatedPermissions: []
        });
    }
    let invalidPermissions = [];
    const allowedPermissionValues = Object.values(community_1.COMMUNITY_PERMISSION_NAMES).map((value) => value);
    for (const permission of updatedPermissions) {
        if (!allowedPermissionValues.includes(permission)) {
            invalidPermissions.push(permission);
        }
    }
    if (invalidPermissions.length) {
        next(new appError_1.default(422, `Invalid permissions provided: ${invalidPermissions.join(', ')}`));
        return;
    }
    const hasDuplicateValues = updatedPermissions.filter((permission, index) => updatedPermissions.indexOf(permission) !== index);
    if (hasDuplicateValues.length) {
        next(new appError_1.default(422, `Dulicate values not allowed: provided for ${hasDuplicateValues.join(', ')}`));
        return;
    }
    communitySettings.moderators_settings.moderatorPermissions.value = updatedPermissions;
    yield communitySettings.save();
    yield communitySettingsService_1.default.createCommunitySettingsChangedLog(communitySettings.community, req.userId, `updated modertor permissions. Allowed permissions: ${communitySettings.moderators_settings.moderatorPermissions.value.toString()}`);
    return res.status(200).json({
        status: 'success',
        message: 'Moderator permissions updated successfully',
        updatedPermissions: communitySettings.moderators_settings.moderatorPermissions.value
    });
}));
exports.updateMembersSinglePostsSetting = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { settingName, settingValue } = req.body;
    CommunitySettingsValidator_1.default.isSingleSettingReqDataValid(settingName, settingValue, communitySettings_1.ALLOWED_JOINED_MEMBERS_POST_SETTINGS_NAMES);
    const communitySettings = req.communitySettings;
    if (settingName === 'postsDataAllowed') {
        CommunitySettingsValidator_1.default.isAllowedPostsDataSettingValueValid(settingValue);
        communitySettings.joined_members_permissions.posts_settings.postsDataAllowed.value = settingValue;
    }
    else {
        if (typeof settingValue !== 'boolean') {
            next(new appError_1.default(400, 'Invalid data types provided. Setting value can only be "true" or "false"'));
            return;
        }
        if (settingName === 'allowPostComments' && settingValue === false) {
            communitySettingsService_1.default.setAllPostCommentSettingsToFalseIfCommentsAreNotAllowed(communitySettings);
        }
        if (settingName.toLowerCase().includes('comment') &&
            settingName !== 'allowPostComments' &&
            settingValue === true &&
            !communitySettings.joined_members_permissions.posts_settings.allowPostComments.value) {
            next(new appError_1.default(400, `Comments are not allowed and therefore setting "${settingName}" to true will not make any difference. If you want to enable this permission, allow post comments.`));
            return;
        }
        communitySettings.joined_members_permissions.posts_settings[settingName].value = settingValue;
    }
    yield communitySettings.save();
    yield communitySettingsService_1.default.createCommunitySettingsChangedLog(communitySettings.community, req.userId, 'updated members post settings');
    return res.status(200).json({
        status: 'success',
        message: 'Post settings updated successfully',
        updatedSettings: communitySettings.joined_members_permissions.posts_settings
    });
}));
exports.updateMembersAllPostsSettings = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { updatedSettings } = req.body;
    CommunitySettingsValidator_1.default.areAllSettingsReqDataValid(updatedSettings, communitySettings_1.ALLOWED_JOINED_MEMBERS_POST_SETTINGS_NAMES, 'posts');
    const allValuesBoolean = Object.keys(updatedSettings)
        .filter((setting) => setting !== 'postsDataAllowed')
        .every((setting) => typeof updatedSettings[setting] === 'boolean');
    if (!allValuesBoolean) {
        next(new appError_1.default(422, 'Invalid data: all setting values except for "posts data allowed" must be true or false'));
        return;
    }
    CommunitySettingsValidator_1.default.isAllowedPostsDataSettingValueValid(updatedSettings.postsDataAllowed);
    const communitySettings = req.communitySettings;
    const filterSettings = Object.assign({}, updatedSettings);
    if (updatedSettings.allowPostComments === false) {
        communitySettingsService_1.default.setAllPostCommentSettingsToFalseIfCommentsAreNotAllowed(communitySettings);
        Object.keys(updatedSettings).forEach((setting) => {
            if (setting.toLowerCase().includes('comment')) {
                delete filterSettings[setting];
            }
        });
    }
    for (const setting in filterSettings) {
        communitySettings.joined_members_permissions.posts_settings[setting] = { value: updatedSettings[setting] };
    }
    yield communitySettings.save();
    yield communitySettingsService_1.default.createCommunitySettingsChangedLog(communitySettings.community, req.userId, 'updated members post settings');
    return res.status(200).json({
        status: 'success',
        message: 'Community memebrs posts settings updated successfully',
        updatedSettings: communitySettings.joined_members_permissions.posts_settings
    });
}));
exports.updateMembersSingleChatsSetting = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { settingName, settingValue } = req.body;
    CommunitySettingsValidator_1.default.isSingleSettingReqDataValid(settingName, settingValue, communitySettings_1.ALLOWED_JOINED_MEMBERS_CHATS_SETTINGS_NAMES, true);
    const communitySettings = req.communitySettings;
    if (settingName !== 'allowChats' &&
        settingValue === true &&
        !communitySettings.joined_members_permissions.chats_settings.allowChats.value) {
        next(new appError_1.default(400, `Chats are not allowed, so changing "${settingName}" to true will do nothing. If you want this enabled, allow community chats.`));
        return;
    }
    const allowChatsDisabled = settingName === 'allowChats' && settingValue === false;
    if (allowChatsDisabled) {
        communitySettingsService_1.default.setAllChatSettingsToFalseIfChatsAreNotAllowed(communitySettings);
    }
    else {
        communitySettings.joined_members_permissions.chats_settings[settingName].value = settingValue;
    }
    yield communitySettings.save();
    yield communitySettingsService_1.default.createCommunitySettingsChangedLog(communitySettings.community, req.userId, 'updated members chats settings');
    const responseMessage = `
    Chat settings updated successfully. 
    ${allowChatsDisabled ? 'Because you disabled "allow chats" setting, all other chat settings are also disabled.' : ''}
  `;
    return res.status(200).json({
        status: 'success',
        message: responseMessage,
        updatedSettings: communitySettings.joined_members_permissions.chats_settings
    });
}));
exports.updateMembersAllChatsSettings = (0, catchAsync_1.default)((req, res, _) => __awaiter(void 0, void 0, void 0, function* () {
    const { updatedSettings } = req.body;
    CommunitySettingsValidator_1.default.areAllSettingsReqDataValid(updatedSettings, communitySettings_1.ALLOWED_JOINED_MEMBERS_CHATS_SETTINGS_NAMES, 'chats', true);
    const communitySettings = req.communitySettings;
    if (updatedSettings.allowChats === false) {
        communitySettingsService_1.default.setAllChatSettingsToFalseIfChatsAreNotAllowed(communitySettings);
    }
    else {
        for (const setting in updatedSettings) {
            communitySettings.joined_members_permissions.chats_settings[setting].value = updatedSettings[setting];
        }
    }
    yield communitySettings.save();
    yield communitySettingsService_1.default.createCommunitySettingsChangedLog(communitySettings.community, req.userId, 'updated members chats settings');
    const additionalReqMessage = !communitySettings.joined_members_permissions.chats_settings.allowChats.value
        ? 'Since you disabled chats all other chat setting will be ignored, so they are also disabled. If you want any of the other settings turned on, enable chats.'
        : '';
    return res.status(200).json({
        status: 'success',
        message: `Community members chat settings updated successfully. ${additionalReqMessage}`,
        updatedSettings: communitySettings.joined_members_permissions.chats_settings
    });
}));
exports.updateMembersCanViewOtherMembersSetting = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { canViewMembers } = req.body;
    if (typeof canViewMembers !== 'boolean') {
        next(new appError_1.default(422, 'Value for view member permission can only be true of false'));
        return;
    }
    const communitySettings = req.communitySettings;
    communitySettings.joined_members_permissions.can_view_members.value = canViewMembers;
    yield communitySettings.save();
    yield communitySettingsService_1.default.createCommunitySettingsChangedLog(communitySettings.community, req.userId, `${communitySettings.joined_members_permissions.can_view_members.value ? 'enabled' : 'disabled'} viewing of members list by other members`);
    return res.status(200).json({
        status: 'success',
        message: `${canViewMembers === true ? 'Enabled' : 'Disabled'} to see member list`,
        updatedSetting: communitySettings.joined_members_permissions.can_view_members.value
    });
}));
exports.updateSingleNonMembersPermission = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { settingName, settingValue } = req.body;
    CommunitySettingsValidator_1.default.isSingleSettingReqDataValid(settingName, settingValue, communitySettings_1.ALLOWED_NON_MEMBERS_PERMISSION_NAMES, true);
    const communitySettings = req.communitySettings;
    // disable all other settings if canViewPosts === false
    // reason: everyhing in these settings are post /comment relates
    // if user cannot view posts, other settings must be false
    // otherview it doesn't make sense
    if (settingName === 'canViewPosts' && settingValue === false) {
        communitySettingsService_1.default.setAllNonMemberPostSettingsToFalseIfPostsNotAllowed(communitySettings);
    }
    else if (settingName === 'canViewComments' && settingValue === false) {
        communitySettingsService_1.default.setAllNonMemberCommentSettingsToFalseIfCommentsNotAllowed(communitySettings);
    }
    else if (settingName !== 'canViewPosts' &&
        settingValue === true &&
        (settingName.toLowerCase().includes('post') || settingName.toLowerCase().includes('comment')) &&
        !communitySettings.non_members_permissions.canViewPosts.value) {
        next(new appError_1.default(400, `Non-members cannnot see posts so setting "${settingName}" to true will be ignored. If you want to enable this, allow post view for non-members.`));
        return;
    }
    else if (settingName !== 'canViewPosts' &&
        settingName !== 'canViewComments' &&
        settingValue === true &&
        settingName.toLowerCase().includes('comment') &&
        !communitySettings.non_members_permissions.canPostComments.value) {
        next(new appError_1.default(400, `Non-members cannnot see comments so setting "${settingName}" to true will be ignored. If you want to enable this, allow comment view for non-members.`));
        return;
    }
    else {
        communitySettings.non_members_permissions[settingName].value = settingValue;
    }
    yield communitySettings.save();
    yield communitySettingsService_1.default.createCommunitySettingsChangedLog(communitySettings.community, req.userId, 'updated non-member permissions');
    return res.status(200).json({
        status: 'success',
        message: 'Successfully updated non-members settings',
        updatedNonMembersPermissions: communitySettings.non_members_permissions
    });
}));
exports.updateAllNonMemberPermissions = (0, catchAsync_1.default)((req, res, _) => __awaiter(void 0, void 0, void 0, function* () {
    const { updatedSettings } = req.body;
    CommunitySettingsValidator_1.default.areAllSettingsReqDataValid(updatedSettings, communitySettings_1.ALLOWED_NON_MEMBERS_PERMISSION_NAMES, 'non members', true);
    const communitySettings = req.communitySettings;
    const filterSettings = Object.assign({}, updatedSettings);
    // if posts cannot be viewed, all other post / comment related settings are
    // irrelevant, so they are set to false
    if (updatedSettings.canViewPosts === false) {
        communitySettingsService_1.default.setAllNonMemberPostSettingsToFalseIfPostsNotAllowed(communitySettings);
        Object.keys(updatedSettings).forEach((setting) => {
            if (setting.toLowerCase().includes('post') || setting.toLowerCase().includes('comment')) {
                delete filterSettings[setting];
            }
        });
    }
    // if comments cannot be viewed, all other comment related settings are
    // irrelevant, so they are set to false
    if (updatedSettings.canViewPosts === true && updatedSettings.canViewComments === false) {
        communitySettingsService_1.default.setAllNonMemberCommentSettingsToFalseIfCommentsNotAllowed(communitySettings);
        Object.keys(updatedSettings).forEach((setting) => {
            if (setting.toLowerCase().includes('comment')) {
                delete filterSettings[setting];
            }
        });
    }
    for (const setting in filterSettings) {
        communitySettings.non_members_permissions[setting].value = updatedSettings[setting];
    }
    yield communitySettings.save();
    yield communitySettingsService_1.default.createCommunitySettingsChangedLog(communitySettings.community, req.userId, 'updated non-member permissions');
    return res.status(200).json({
        status: 'success',
        message: 'Non-members permissions updated successfully',
        updatedNonMembersPermissions: communitySettings.non_members_permissions
    });
}));
