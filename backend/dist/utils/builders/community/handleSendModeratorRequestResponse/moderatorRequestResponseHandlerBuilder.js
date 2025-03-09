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
const communityModeratorChangeRequestsSerivce_1 = __importDefault(require("services/communityModeratorChangeRequestsSerivce"));
// class HandleSendModeratorRequestResponseActionBuilder {
//   private parameters: HandleSendModeratorRequestResponseActionParameters;
//   constructor(parameters: HandleSendModeratorRequestResponseActionParameters) {
//     this.parameters = parameters;
//   }
//   async createModeratorRequest() {
//     const { commons, moderatorRequestData } = this.parameters;
//     const { communityId, moderator } = commons;
//     const { requestType, communityCreator, requestText, updateValues } = moderatorRequestData;
//     return await CommunityModeratorChangeRequestService.createNewModeratorRequest({
//       requestType,
//       communityId,
//       communityCreator,
//       moderator,
//       requestText,
//       updateValues: updateValues || {},
//     });
//   }
//   async createActivityLog(moderatorRequestId: Types.ObjectId | string) {
//     const { commons, communityActivityLogData } = this.parameters;
//     const { communityId, moderator } = commons;
//     const { logType, text, photoUrl } = communityActivityLogData;
//     return await CommunityActivityLogsService.createNewCommunityActivityLog({
//       communityId,
//       logType,
//       moderator,
//       text,
//       moderatorRequest: moderatorRequestId,
//       photoUrl: photoUrl || undefined,
//     });
//   }
//   sendResponse(moderatorRequest: CommunityModeratorChangeRequestSchemaType) {
//     const { resJson } = this.parameters;
//     const { res, message } = resJson;
//     return CommunityModeratorChangeRequestService.sendModeratorRequestResponse({
//       res,
//       message,
//       moderatorRequest,
//     });
//   }
//   async execute() {
//     try {
//       const moderatorRequest = await this.createModeratorRequest();
//       await this.createActivityLog(moderatorRequest._id);
//       return this.sendResponse(moderatorRequest);
//     } catch (error: unknown) {
//       throw error;
//     }
//   }
// }
class HandleSendModeratorRequestResponseActionBuilder {
    constructor() {
        this.parameters = {
            commons: { communityId: '', moderator: '' },
            moderatorRequestData: { requestType: '', communityCreator: '', requestText: '', updateValues: {} },
            communityActivityLogData: { logType: '', text: '', photoUrl: undefined },
            resJson: { res: {}, message: '' },
        };
    }
    setCommons(commons) {
        this.parameters.commons = commons;
        return this;
    }
    setModeratorRequestData(moderatorRequestData) {
        this.parameters.moderatorRequestData = moderatorRequestData;
        return this;
    }
    setCommunityActivityLogData(communityActivityLogData) {
        this.parameters.communityActivityLogData = communityActivityLogData;
        return this;
    }
    setResJson(resJson) {
        this.parameters.resJson = resJson;
        return this;
    }
    createModeratorRequest() {
        return __awaiter(this, void 0, void 0, function* () {
            const { commons, moderatorRequestData } = this.parameters;
            const { communityId, moderator } = commons;
            const { requestType, communityCreator, requestText, updateValues } = moderatorRequestData;
            return yield communityModeratorChangeRequestsSerivce_1.default.createNewModeratorRequest({
                requestType,
                communityId,
                communityCreator,
                moderator,
                requestText,
                updateValues: updateValues || {},
            });
        });
    }
    createActivityLog(moderatorRequestId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { commons, communityActivityLogData } = this.parameters;
            const { communityId, moderator } = commons;
            const { logType, text, photoUrl } = communityActivityLogData;
            return yield communityActivityLogsService_1.default.createNewCommunityActivityLog({
                communityId,
                logType,
                moderator,
                text,
                moderatorRequest: moderatorRequestId,
                photoUrl: photoUrl || undefined,
            });
        });
    }
    sendResponse(moderatorRequest) {
        const { resJson } = this.parameters;
        const { res, message } = resJson;
        return communityModeratorChangeRequestsSerivce_1.default.sendModeratorRequestResponse({
            res,
            message,
            moderatorRequest,
        });
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const moderatorRequest = yield this.createModeratorRequest();
                yield this.createActivityLog(moderatorRequest._id);
                return this.sendResponse(moderatorRequest);
            }
            catch (error) {
                throw error;
            }
        });
    }
}
exports.default = HandleSendModeratorRequestResponseActionBuilder;
