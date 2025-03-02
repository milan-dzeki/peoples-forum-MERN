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
exports.checkIfTargetUserExist = exports.isLoggedUserCommunityCreatorOrModerator = exports.doesCommunityExist = void 0;
const communityModel_1 = __importDefault(require("models/communityModel"));
const appError_1 = __importDefault(require("utils/appError"));
const userModel_1 = __importDefault(require("models/userModel"));
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
const isLoggedUserCommunityCreatorOrModerator = (req, _, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const community = req.community;
        const moderators = community.moderators.map((moderator) => moderator.toString());
        if (community.creator.toString() !== req.userId.toString() && !moderators.includes(req.userId.toString())) {
            next(new appError_1.default(401, 'Only moderators and crator can update community data'));
            return;
        }
        next();
    }
    catch (error) {
        next(error);
        return;
    }
});
exports.isLoggedUserCommunityCreatorOrModerator = isLoggedUserCommunityCreatorOrModerator;
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
