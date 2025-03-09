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
exports.acceptModeratorRequest = exports.declineModeratorRequest = void 0;
const catchAsync_1 = __importDefault(require("utils/catchAsync"));
const appError_1 = __importDefault(require("utils/appError"));
const notifications_1 = require("configs/notifications");
const communityModeratorChangeRequestsSerivce_1 = __importDefault(require("services/communityModeratorChangeRequestsSerivce"));
const notificationModel_1 = __importDefault(require("models/notificationModel"));
const communityActivityLogs_1 = __importDefault(require("models/communityActivityLogs"));
const communityActivityLogs_2 = require("configs/communityActivityLogs");
exports.declineModeratorRequest = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // CommunityService.updateCommunityField.update_description(req.community!);
    const moderatorRequest = req.moderatorRequest;
    if (moderatorRequest.status === 'declined') {
        next(new appError_1.default(400, 'You have already declined this request in the past.'));
        return;
    }
    if (moderatorRequest.status === 'approved') {
        next(new appError_1.default(400, 'You have already approved this request in the past. If you wnat to revert changes doen tby it, do it manually.'));
        return;
    }
    yield communityModeratorChangeRequestsSerivce_1.default.removeRequestPhotoIfItExists(moderatorRequest.photo);
    moderatorRequest.status = 'declined';
    const community = req.community;
    const shouldNotifyModerator = req.shouldNotifyModerator;
    const responseJson = {
        status: 'success',
        message: 'Request declined successfully'
    };
    if (shouldNotifyModerator) {
        const moderatorNotification = yield notificationModel_1.default.create({
            receiver: moderatorRequest.moderator,
            notificationType: notifications_1.NOTIFICATION_TYPES.MODERATOR_CHANGE_REQUEST_DECLINED,
            text: `Your request to ${moderatorRequest.requestType} for "${community.name}" community has been declined`,
            community: community._id
        });
        responseJson.moderatorNotification = moderatorNotification;
    }
    yield communityActivityLogs_1.default.create({
        community: community._id,
        logType: communityActivityLogs_2.COMMUNITY_LOG_TYPE.HANDLE_MODERATOR_REQUESTS,
        moderator: moderatorRequest.moderator,
        text: `declined request to ${moderatorRequest.requestType} made by moderator *user*`,
        moderatorRequest: moderatorRequest._id
    });
    yield moderatorRequest.save();
    return res.status(200).json(responseJson);
}));
exports.acceptModeratorRequest = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const community = req.community;
    const moderatorRequest = req.moderatorRequest;
    if (moderatorRequest.status === 'declined') {
        next(new appError_1.default(400, 'You have already declined this request in the past.'));
        return;
    }
    if (moderatorRequest.status === 'approved') {
        next(new appError_1.default(400, 'You have already approved this request in the past. If you wnat to revert changes doen tby it, do it manually.'));
        return;
    }
    const response = yield communityModeratorChangeRequestsSerivce_1.default
        .acceptUpdateCommunityField[moderatorRequest.requestType](community, moderatorRequest, res);
    return response;
}));
