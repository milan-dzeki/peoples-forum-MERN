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
exports.removeCommunityBannerImage = exports.updateCommunityBannerImage = exports.removeCommunityProfileImage = exports.updateCommunityProfileImage = exports.deleteCommunity = exports.updateCommunityDescription = exports.createCommunity = void 0;
const cloudinary_1 = __importDefault(require("configs/cloudinary"));
const catchAsync_1 = __importDefault(require("utils/catchAsync"));
const communityValidator_1 = __importDefault(require("configs/validators/community/communityValidator"));
const communityService_1 = __importDefault(require("services/communityService"));
const cloudinaryManagementService_1 = __importDefault(require("services/cloudinaryManagementService"));
const appError_1 = __importDefault(require("utils/appError"));
const communityModel_1 = __importDefault(require("models/communityModel"));
const communitySettingsModel_1 = __importDefault(require("models/settings/communitySettingsModel"));
const chatModel_1 = __importDefault(require("models/chatModel"));
const messageModel_1 = __importDefault(require("models/messageModel"));
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
        joinedUsers: [],
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
    return res.status(201).json({
        status: 'success',
        message: 'Community created successfully',
        community: newCommunity,
        communitySettings: communitySettingsWithVirtuals
    });
}));
exports.updateCommunityDescription = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { description } = req.body;
    const descriptionInvalidError = communityValidator_1.default.validateStringValues(description, 'description');
    if (descriptionInvalidError) {
        next(new appError_1.default(422, descriptionInvalidError));
        return;
    }
    const community = req.community;
    community.description = description;
    yield community.save();
    return res.status(200).json({
        status: 'success',
        message: 'Community description updated successfully',
        newDescription: community.description
    });
}));
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
exports.updateCommunityProfileImage = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const reqFiles = req.files;
    if (!reqFiles ||
        (reqFiles && !reqFiles.profileImage) ||
        (reqFiles && reqFiles.profileImage && !reqFiles.profileImage.path)) {
        next(new appError_1.default(400, 'No new photo is provided'));
        return;
    }
    const community = req.community;
    if (community.profileImageUrl && community.profileImagePublicId) {
        yield cloudinary_1.default.uploader.destroy(community.profileImagePublicId);
    }
    const uploadedPhotoData = yield cloudinaryManagementService_1.default.uploadSinglePhotoToCloudinary(reqFiles.profileImage);
    community.profileImageUrl = uploadedPhotoData.secure_url;
    community.profileImagePublicId = uploadedPhotoData.public_id;
    yield community.save();
    return res.status(200).json({
        status: 'success',
        message: 'Community profile image updated successfully',
        newProfileImage: community.profileImageUrl
    });
}));
exports.removeCommunityProfileImage = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const community = req.community;
    const profileImagePublicId = community.profileImagePublicId;
    if (!profileImagePublicId) {
        next(new appError_1.default(404, 'Community doesnt have profile image, so there is nothing to remove'));
        return;
    }
    community.profileImageUrl = null;
    community.profileImagePublicId = null;
    yield community.save();
    yield cloudinary_1.default.uploader.destroy(profileImagePublicId);
    return res.status(200).json({
        status: 'success',
        message: 'Community profile image removed successfully'
    });
}));
exports.updateCommunityBannerImage = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const community = req.community;
    const reqFiles = req.files;
    if (!reqFiles ||
        (reqFiles && !reqFiles.bannerImage) ||
        (reqFiles && reqFiles.bannerImage && !reqFiles.bannerImage.path)) {
        next(new appError_1.default(400, 'No new photo is provided'));
        return;
    }
    if (community.bannerImageUrl && community.bannerImagePublicId) {
        yield cloudinary_1.default.uploader.destroy(community.bannerImagePublicId);
    }
    const uploadedPhotoData = yield cloudinaryManagementService_1.default.uploadSinglePhotoToCloudinary(reqFiles.bannerImage);
    community.bannerImageUrl = uploadedPhotoData.secure_url;
    community.bannerImagePublicId = uploadedPhotoData.public_id;
    yield community.save();
    return res.status(200).json({
        status: 'success',
        message: 'Community banner image updated successfully',
        newProfileImage: community.bannerImageUrl
    });
}));
exports.removeCommunityBannerImage = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const community = req.community;
    const bannerImagePublicId = community.bannerImagePublicId;
    if (!bannerImagePublicId) {
        next(new appError_1.default(404, 'Community doesnt have banner image so there is nothing to remove'));
        return;
    }
    community.bannerImageUrl = null;
    community.bannerImagePublicId = null;
    yield community.save();
    yield cloudinary_1.default.uploader.destroy(bannerImagePublicId);
    return res.status(200).json({
        status: 'success',
        message: 'Community banner image removed successfully'
    });
}));
