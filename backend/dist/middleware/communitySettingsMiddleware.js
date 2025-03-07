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
exports.doesCommunitySettingExist = exports.doesCommunityExistAndIsUserCreator = void 0;
const appError_1 = __importDefault(require("utils/appError"));
const communityModel_1 = __importDefault(require("models/communityModel"));
const communitySettingsModel_1 = __importDefault(require("models/settings/communitySettingsModel"));
const doesCommunityExistAndIsUserCreator = (req, _, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { communityId } = req.params;
        if (!communityId) {
            next(new appError_1.default(400, 'Community ID is missing'));
            return;
        }
        const community = yield communityModel_1.default.findById(communityId).select('name creator moderators');
        if (!community) {
            next(new appError_1.default(404, 'Community not found.'));
            return;
        }
        if (community.creator.toString() !== req.userId.toString()) {
            next(new appError_1.default(403, 'You have no access to community settings'));
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
exports.doesCommunityExistAndIsUserCreator = doesCommunityExistAndIsUserCreator;
const doesCommunitySettingExist = (req, _, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const communityId = req.community._id;
        const communitySettings = yield communitySettingsModel_1.default.findOne({ community: communityId });
        if (!communitySettings) {
            next(new appError_1.default(404, 'Community setting not found. You should create one'));
            return;
        }
        req.communitySettings = communitySettings;
        next();
    }
    catch (error) {
        next(error);
        return;
    }
});
exports.doesCommunitySettingExist = doesCommunitySettingExist;
