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
exports.changesByModeratorRequireAdminApproval = exports.isRequestUserAlreadyInLists = exports.isTargetUserAlreadyInLists = exports.isTargetUserLoggedInUser = exports.checkIfTargetUserExist = exports.havePermissionToPerformAction = exports.isUserCommunityCreator = exports.doesCommunityExist = void 0;
const communityModel_1 = __importDefault(require("models/communityModel"));
const appError_1 = __importDefault(require("utils/appError"));
const userModel_1 = __importDefault(require("models/userModel"));
const communitySettingsModel_1 = __importDefault(require("models/settings/communitySettingsModel"));
const doesCommunityExist = (req, _, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { communityId } = req.params;
        if (!communityId) {
            next(new appError_1.default(400, 'Community ID is missing'));
            return;
        }
        const community = yield communityModel_1.default.findById(communityId).select('+profileImagePublicId +bannerImagePublicId');
        if (!community) {
            next(new appError_1.default(404, 'Community not found.'));
            return;
        }
        req.community = community;
        next();
    }
    catch (error) {
        next(error);
        return;
    }
});
exports.doesCommunityExist = doesCommunityExist;
const isUserCommunityCreator = (req, _, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (req.userId.toString() !== req.community.creator.toString()) {
            next(new appError_1.default(403, 'Only community creator is permitted to perform this action.'));
            return;
        }
        next();
    }
    catch (error) {
        next(error);
        return;
    }
});
exports.isUserCommunityCreator = isUserCommunityCreator;
const havePermissionToPerformAction = (permissionName) => {
    return (req, _, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        console.log(req.params, req.originalUrl, req.url.split('/'), req.baseUrl);
        try {
            const community = req.community;
            const isCreator = community.creator.toString() == req.userId.toString();
            // if user is creator go next because creator has all permissions
            if (isCreator) {
                req.isCreator = true;
                next();
                return;
            }
            let allowedToProceed = false;
            if (!permissionName) {
                next(new appError_1.default(400, 'Cannot find permission for this action.'));
                return;
            }
            // if user is not creator or moderator denny access
            const moderators = community.moderators.map((moderator) => moderator.user.toString());
            if (!isCreator && !moderators.includes(req.userId.toString())) {
                next(new appError_1.default(401, 'Only moderators and creator can update community data'));
                return;
            }
            // if fails to find settings throw error
            const communitySettingsModeratorPermissions = yield communitySettingsModel_1.default.findOne({ community: community._id }).select('moderators_settings -_id');
            if (!communitySettingsModeratorPermissions || !((_b = (_a = communitySettingsModeratorPermissions.moderators_settings) === null || _a === void 0 ? void 0 : _a.moderatorPermissions) === null || _b === void 0 ? void 0 : _b.value)) {
                next(new appError_1.default(404, 'Cannot access community settings. Try updating settings and save changes.'));
                return;
            }
            // if permission exists for all moderators in community schema, allow action
            const permissionGratnedForAllModerators = communitySettingsModeratorPermissions.moderators_settings.moderatorPermissions.value.includes(permissionName);
            if (permissionGratnedForAllModerators) {
                allowedToProceed = true;
            }
            // if permission exists for current user / moderator, allow action
            const targetModeratorPermissions = community.moderators.find((moderator) => moderator.user.toString() === req.userId.toString()).customPermissions;
            const permissionGrantedForTargetModerator = targetModeratorPermissions.includes(permissionName);
            if (permissionGrantedForTargetModerator) {
                allowedToProceed = true;
            }
            if (!allowedToProceed) {
                next(new appError_1.default(401, 'You dont have permission to perform this action'));
                return;
            }
            req.communitySettings = communitySettingsModeratorPermissions;
            req.isCreator = isCreator;
            next();
        }
        catch (error) {
            next(error);
            return;
        }
    });
};
exports.havePermissionToPerformAction = havePermissionToPerformAction;
const checkIfTargetUserExist = (req, _, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { targetUserId } = req.body;
        if (!targetUserId) {
            next(new appError_1.default(400, 'User ID is not provided. Cannot proceed without user ID'));
            return;
        }
        const userExists = yield userModel_1.default.exists({ _id: targetUserId });
        if (!userExists) {
            next(new appError_1.default(404, 'User with provided data is not found. Maybe its account was removed from network. Try refreshing the page'));
            return;
        }
        next();
    }
    catch (error) {
        next(error);
        return;
    }
});
exports.checkIfTargetUserExist = checkIfTargetUserExist;
const isTargetUserLoggedInUser = (req, _, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { targetUserId } = req.body;
        if (targetUserId.toString() === req.userId.toString()) {
            next(new appError_1.default(400, 'You cannot manage your community roles for yourself.'));
            return;
        }
        next();
    }
    catch (error) {
        next(error);
        return;
    }
});
exports.isTargetUserLoggedInUser = isTargetUserLoggedInUser;
const getIsInListsInfo = (userId, community) => {
    const listInfo = {
        pendingInvitedModerators: {
            exists: false,
            alias: 'pending invited moderators list'
        },
        moderators: {
            exists: false,
            alias: 'moderator list'
        },
        pendingInvitedUsers: {
            exists: false,
            alias: 'pending invited members list'
        },
        members: {
            exists: false,
            alias: 'members list'
        },
        bannedUsers: {
            exists: false,
            alias: 'banned list'
        },
        userJoinRequests: {
            exists: false,
            alias: 'requested to join list'
        }
    };
    Object.keys(listInfo).forEach((list) => {
        const isInList = community[list].find((user) => user.user.toString() === userId.toString());
        if (isInList) {
            listInfo[list].exists = true;
        }
    });
    return listInfo;
};
/*
  this is for community requests where moderator manage users
  user is got in request body
*/
const isTargetUserAlreadyInLists = (req, _, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const community = req.community;
        const { targetUserId } = req.body;
        const listInfo = getIsInListsInfo(targetUserId, community);
        req.existInLists = listInfo;
        next();
    }
    catch (error) {
        next(error);
        return;
    }
});
exports.isTargetUserAlreadyInLists = isTargetUserAlreadyInLists;
/*
  this is for community requests where logged in users manage actions
  accepting / declining invitations got by communities etc
*/
const isRequestUserAlreadyInLists = (req, _, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const community = req.community;
        const userId = req.userId;
        const listInfo = getIsInListsInfo(userId, community);
        req.existInLists = listInfo;
        next();
    }
    catch (error) {
        next(error);
        return;
    }
});
exports.isRequestUserAlreadyInLists = isRequestUserAlreadyInLists;
const changesByModeratorRequireAdminApproval = (req, _, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const communitySettings = req.communitySettings;
        if (!communitySettings) {
            req.moderatorActionRequirePermission = false;
        }
        else {
            req.moderatorActionRequirePermission = communitySettings.moderators_settings.changesByModeratorRequireApproval.value;
        }
        next();
    }
    catch (error) {
        next(error);
        return;
    }
});
exports.changesByModeratorRequireAdminApproval = changesByModeratorRequireAdminApproval;
