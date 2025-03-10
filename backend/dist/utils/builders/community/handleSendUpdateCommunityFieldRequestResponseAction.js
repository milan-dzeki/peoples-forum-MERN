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
const communityActivityLogsService_1 = __importDefault(require("services/communityActivityLogsService"));
const notificationModel_1 = __importDefault(require("models/notificationModel"));
const notifications_1 = require("configs/notifications");
const communityService_1 = __importDefault(require("services/communityService"));
class HandleSendUpdateCommunityFieldRequestResponseActionBuilder {
    constructor() {
        this.parameters = {
            responseField: null,
            fieldUpdateHandler: () => __awaiter(this, void 0, void 0, function* () { }),
            communityId: '',
            communityActivityLogData: {
                logType: '',
                moderator: '',
                text: '',
                photoUrl: undefined,
            },
            moderatorsNotificationsData: {
                moderators: [],
                communityCreator: '',
                notificationType: notifications_1.NOTIFICATION_TYPES.COMMUNITY_INFO_UPDATED,
                text: '',
                sender: '',
                doNotIncludeIds: [],
            },
            resJson: {
                res: {},
                message: '',
            },
            approvedRequestModeratorNotification: undefined,
        };
    }
    setResponseField(responseField) {
        this.parameters.responseField = responseField;
        return this;
    }
    setFieldUpdateHandler(fieldUpdateHandler) {
        this.parameters.fieldUpdateHandler = fieldUpdateHandler;
        return this;
    }
    setCommunityId(communityId) {
        this.parameters.communityId = communityId;
        return this;
    }
    setCommunityActivityLogData(communityActivityLogData) {
        this.parameters.communityActivityLogData = communityActivityLogData;
        return this;
    }
    setModeratorsNotificationsData(moderatorsNotificationsData) {
        this.parameters.moderatorsNotificationsData = moderatorsNotificationsData;
        return this;
    }
    setResJson(resJson) {
        this.parameters.resJson = resJson;
        return this;
    }
    setApprovedRequestModeratorNotification(notification) {
        this.parameters.approvedRequestModeratorNotification = notification;
        return this;
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { responseField, fieldUpdateHandler, communityId, communityActivityLogData, moderatorsNotificationsData, resJson, approvedRequestModeratorNotification, } = this.parameters;
                const newValue = yield fieldUpdateHandler();
                yield communityActivityLogsService_1.default.createNewCommunityActivityLog({
                    communityId,
                    logType: communityActivityLogData.logType,
                    text: communityActivityLogData.text,
                    moderator: communityActivityLogData.moderator,
                    photoUrl: communityActivityLogData.photoUrl,
                });
                const moderatorNotifications = yield communityService_1.default.createCreatorAndModeratorNotifications(moderatorsNotificationsData.moderators, moderatorsNotificationsData.communityCreator, {
                    communityId,
                    notificationType: moderatorsNotificationsData.notificationType,
                    sender: moderatorsNotificationsData.sender,
                    text: moderatorsNotificationsData.text,
                }, moderatorsNotificationsData.doNotIncludeIds);
                let moderatorApprovedNotification = null;
                if (approvedRequestModeratorNotification) {
                    moderatorApprovedNotification = yield notificationModel_1.default.create({
                        receiver: approvedRequestModeratorNotification.receiver,
                        notificationType: notifications_1.NOTIFICATION_TYPES.MODERATOR_CHANGE_REQUEST_APPROVED,
                        text: approvedRequestModeratorNotification.text,
                        community: communityId
                    });
                }
                const responseJson = {
                    res: resJson.res,
                    message: resJson.message,
                    moderatorNotifications,
                    approvedRequestModeratorNotification: moderatorApprovedNotification
                };
                if (responseField && newValue) {
                    responseJson[responseField] = newValue;
                }
                return communityService_1.default.createUpdateFieldRequestResponse(responseJson);
            }
            catch (error) {
                throw error;
            }
        });
    }
}
exports.default = HandleSendUpdateCommunityFieldRequestResponseActionBuilder;
