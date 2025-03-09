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
exports.shouldNotifyModerator = exports.isModeratorRequestValid = void 0;
const communityModeratorChangeRequestModel_1 = __importDefault(require("models/communityModeratorChangeRequestModel"));
const communitySettingsModel_1 = __importDefault(require("models/settings/communitySettingsModel"));
const userModel_1 = __importDefault(require("models/userModel"));
const communityModeratorChangeRequestsSerivce_1 = __importDefault(require("services/communityModeratorChangeRequestsSerivce"));
const appError_1 = __importDefault(require("utils/appError"));
const isModeratorRequestValid = (req, _, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { requestId } = req.params;
        if (!requestId) {
            next(new appError_1.default(400, 'Request ID was not found. Cannot perform an action.'));
            return;
        }
        const moderatorRequest = yield communityModeratorChangeRequestModel_1.default.findOne({
            _id: requestId,
            community: req.community._id
        });
        if (!moderatorRequest) {
            next(new appError_1.default(404, 'Request was not found. Maybe it was canceled.'));
            return;
        }
        if (!moderatorRequest.moderator) {
            yield communityModeratorChangeRequestsSerivce_1.default.removeRequestPhotoIfItExists(moderatorRequest.photo);
            yield communityModeratorChangeRequestModel_1.default.deleteOne({ _id: requestId });
            next(new appError_1.default(404, 'Request is invalid. Moderator id not found so request is deleted.'));
            return;
        }
        const moderatorExist = yield userModel_1.default.exists({ _id: moderatorRequest.moderator });
        if (!moderatorExist) {
            yield communityModeratorChangeRequestsSerivce_1.default.removeRequestPhotoIfItExists(moderatorRequest.photo);
            yield communityModeratorChangeRequestModel_1.default.deleteOne({ _id: requestId });
            next(new appError_1.default(404, 'Failed to find account of moderator who sent request so request is deleted.'));
            return;
        }
        const isModerator = req.community.moderators.find((moderator) => moderator.user.toString() === moderatorRequest.moderator.toString());
        if (!isModerator) {
            next(new appError_1.default(400, 'User who made request is not moderator. You should remove this request because it is invalid.'));
            return;
        }
        req.moderatorRequest = moderatorRequest;
        next();
    }
    catch (error) {
        next(error);
        return;
    }
});
exports.isModeratorRequestValid = isModeratorRequestValid;
const shouldNotifyModerator = (req, _, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const moderatorSettings = yield communitySettingsModel_1.default
            .findOne({ community: req.community._id })
            .select('moderators_settings.notifyModeratorAboutSettingsChanges');
        if (!moderatorSettings) {
            next(new appError_1.default(400, 'Community settings are not found. Please go to settings page and creat them.'));
            return;
        }
        req.shouldNotifyModerator = moderatorSettings.moderators_settings.notifyModeratorAboutSettingsChanges.value;
        next();
    }
    catch (error) {
        next(error);
        return;
    }
});
exports.shouldNotifyModerator = shouldNotifyModerator;
