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
exports.isTargetUserAlreadyInLists = exports.isTargetUserLoggedInUser = exports.checkIfTargetUserExist = exports.havePermissionToPerformAction = exports.doesCommunityExist = void 0;
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
const havePermissionToPerformAction = (req, _, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
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
        const permissionNameInBody = req.body.permissionName;
        const permissionNameInFields = (_a = req.fields) === null || _a === void 0 ? void 0 : _a.permissionName;
        const permissionName = permissionNameInBody || permissionNameInFields;
        if (!permissionName) {
            next(new appError_1.default(400, 'Cannot find permission for this action.'));
            return;
        }
        // if user is not creator or moderator denny access
        const moderators = community.moderators.map((moderator) => moderator.user.toString());
        if (!isCreator && !moderators.includes(req.userId.toString())) {
            next(new appError_1.default(401, 'Only moderators and crator can update community data'));
            return;
        }
        // if fails to find settings throw error
        const communitySettingsModeratorPermissions = yield communitySettingsModel_1.default.findOne({ community: community._id }).select('moderators_settings.moderatorPermissions -_id');
        if (!communitySettingsModeratorPermissions || !((_c = (_b = communitySettingsModeratorPermissions.moderators_settings) === null || _b === void 0 ? void 0 : _b.moderatorPermissions) === null || _c === void 0 ? void 0 : _c.value)) {
            next(new appError_1.default(404, 'Cannoot access community settings. Try updating settings and save changes.'));
            return;
        }
        // if permission exists for all moderators in community schema, allow action
        const permissionGratnedForAllModerators = communitySettingsModeratorPermissions.moderators_settings.moderatorPermissions.value.includes(permissionName);
        if (permissionGratnedForAllModerators) {
            allowedToProceed = true;
        }
        // f permission exists for current user / moderator, allow action
        const targetModeratorPermissions = community.moderators.find((moderator) => moderator.user.toString() === req.userId.toString()).customPermissions;
        const permissionGrantedForTargetModerator = targetModeratorPermissions.includes(permissionName);
        console.log('mod', targetModeratorPermissions, permissionGrantedForTargetModerator);
        if (permissionGrantedForTargetModerator) {
            allowedToProceed = true;
        }
        if (!allowedToProceed) {
            next(new appError_1.default(401, 'You dont have permission to perform this action'));
            return;
        }
        req.isCreator = isCreator;
        next();
    }
    catch (error) {
        next(error);
        return;
    }
});
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
const isTargetUserAlreadyInLists = (req, _, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const community = req.community;
        const { targetUserId } = req.body;
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
            joinedUsers: {
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
            if (list !== 'moderators') {
                const isInList = community[list]
                    .find((user) => user.toString() === targetUserId.toString());
                if (isInList) {
                    listInfo[list].exists = true;
                }
            }
        });
        const existsInModeratorList = community.moderators.find((moderator) => moderator.user.toString() === targetUserId.toString());
        if (existsInModeratorList) {
            listInfo.moderators.exists = true;
        }
        req.existInLists = listInfo;
        next();
    }
    catch (error) {
        next(error);
        return;
    }
});
exports.isTargetUserAlreadyInLists = isTargetUserAlreadyInLists;
