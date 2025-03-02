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
exports.undoBanUserFromCommunity = exports.banUserFromCommunity = exports.removeCommunityBannerImage = exports.updateCommunityBannerImage = exports.removeCommunityProfileImage = exports.updateCommunityProfileImage = exports.deleteCommunity = exports.updateCommunityDescription = exports.createCommunity = void 0;
const catchAsync_1 = __importDefault(require("utils/catchAsync"));
const cloudinary_1 = __importDefault(require("configs/cloudinary"));
const communityValidator_1 = __importDefault(require("configs/validators/community/communityValidator"));
const appError_1 = __importDefault(require("utils/appError"));
const userModel_1 = __importDefault(require("models/userModel"));
const communityModel_1 = __importDefault(require("models/communityModel"));
const chatModel_1 = __importDefault(require("models/chatModel"));
const communityService_1 = __importDefault(require("services/communityService"));
const cloudinaryManagementService_1 = __importDefault(require("services/cloudinaryManagementService"));
const messageModel_1 = __importDefault(require("models/messageModel"));
const notificationModel_1 = __importDefault(require("models/notificationModel"));
exports.createCommunity = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { pendingInvitedModerators, access, name, description, rules, pendingInvitedUsers, chatNames } = req.fields;
    const parsedPendingInvitedModerators = pendingInvitedModerators ? JSON.parse(pendingInvitedModerators) : [];
    const parsedRules = rules ? JSON.parse(rules) : [];
    const parsedPendingInvitedUsers = pendingInvitedUsers ? JSON.parse(pendingInvitedUsers) : [];
    const parsedChatNames = chatNames ? JSON.parse(chatNames) : [];
    const { errors } = yield communityValidator_1.default.validateCommunityInputs({
        pendingInvitedModerators: parsedPendingInvitedModerators,
        access,
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
        access: access,
        name: name,
        description: description,
        rules: parsedRules,
        pendingInvitedUsers: parsedPendingInvitedUsers,
        joinedUsers: [],
        bannedUsers: []
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
    const chatIds = yield communityService_1.default.createCommunityChatsUponCommunityCreation(req.userId, newCommunity._id, parsedChatNames);
    newCommunity.availableChats = chatIds;
    yield newCommunity.save();
    return res.status(201).json({
        status: 'success',
        message: 'Community created successfully',
        community: newCommunity
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
exports.deleteCommunity = (0, catchAsync_1.default)((req, res, _) => __awaiter(void 0, void 0, void 0, function* () {
    const communityToDelete = req.community;
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
exports.removeCommunityProfileImage = (0, catchAsync_1.default)((req, res, _) => __awaiter(void 0, void 0, void 0, function* () {
    const community = req.community;
    const profileImagePublicId = community.profileImagePublicId;
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
exports.removeCommunityBannerImage = (0, catchAsync_1.default)((req, res, _) => __awaiter(void 0, void 0, void 0, function* () {
    const community = req.community;
    const bannerImagePublicId = community.bannerImagePublicId;
    community.bannerImageUrl = null;
    community.bannerImagePublicId = null;
    yield community.save();
    yield cloudinary_1.default.uploader.destroy(bannerImagePublicId);
    return res.status(200).json({
        status: 'success',
        message: 'Community banner image removed successfully'
    });
}));
exports.banUserFromCommunity = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { userToBanId, shouldNotifyUser = false } = req.body;
    if (!userToBanId) {
        next(new appError_1.default(400, 'User to ban ID is not provided'));
        return;
    }
    const userExist = yield userModel_1.default.exists({ _id: userToBanId });
    if (!userExist) {
        next(new appError_1.default(404, 'User you are trying to ban cannot be found. Maybe its account no longer exist'));
        return;
    }
    // if id is same as logged in user id - almost impossible, but why not check
    if (userToBanId.toString() === req.userId.toString()) {
        next(new appError_1.default(400, 'You cannot ban yourself'));
        return;
    }
    const community = req.community;
    const userAlreadyBanned = community.bannedUsers.find((bannerUser) => bannerUser.toString() === userToBanId.toString());
    if (userAlreadyBanned) {
        next(new appError_1.default(400, 'You have already banned this user - can not be done twice'));
        return;
    }
    const isUserMember = community.joinedUsers.find((joined) => joined.toString() === userToBanId.toString());
    const isUserInPendingMemberList = community.pendingInvitedUsers.find((pending) => pending.toString() === userToBanId.toString());
    const isUserInPendingModeratorList = community.pendingInvitedModerators.find((pending) => pending.toString() === userToBanId.toString());
    const isUserToBanModerator = community.moderators.find((moderator) => moderator.toString() === userToBanId.toString());
    if (!isUserMember && !isUserInPendingMemberList && !isUserInPendingModeratorList && !isUserToBanModerator) {
        next(new appError_1.default(400, 'User you are trying to ban is not a member of community, nor is he / she in pending lists. Maybe he / she already left'));
        return;
    }
    const isBannerCommunityCreator = community.creator.toString() === req.userId.toString();
    if (!isBannerCommunityCreator && isUserToBanModerator) {
        next(new appError_1.default(400, 'You are trying to ban moderator of this community. Only creator can ban moderators'));
        return;
    }
    if (isUserMember) {
        community.joinedUsers = community.joinedUsers.filter((user) => user.toString() !== userToBanId.toString());
    }
    if (isUserInPendingMemberList) {
        community.pendingInvitedUsers = community.pendingInvitedUsers.filter((user) => user.toString() !== userToBanId.toString());
    }
    if (isUserInPendingModeratorList) {
        community.pendingInvitedModerators = community.pendingInvitedModerators.filter((user) => user.toString() !== userToBanId.toString());
    }
    community.bannedUsers.push(userToBanId);
    yield community.save();
    // remove user from community chats
    if (community.availableChats && community.availableChats.length > 0) {
        yield chatModel_1.default.updateMany({
            communityId: community._id,
            members: { $in: [userToBanId] }
        }, { $pull: { members: userToBanId } });
    }
    const responseData = {
        status: 'success',
        message: 'You have successfully banned user from community',
        bannedUserId: userToBanId
    };
    if (shouldNotifyUser) {
        const bannedUserNotification = yield notificationModel_1.default.create({
            receiver: userToBanId,
            notificationType: 'bannedFromCommunity',
            text: `You have been banned from community: "${community.name}". You can no longer see this comuunity posts and chats unless admins remove ban`
        });
        responseData.bannedUserNotification = bannedUserNotification;
    }
    return res.status(200).json(responseData);
}));
exports.undoBanUserFromCommunity = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { userToRemoveBanId, shouldNotifyUser = false, inviteUserToJoinOrModerate = null } = req.body;
    if (!userToRemoveBanId) {
        next(new appError_1.default(400, 'User id is not provided.'));
        return;
    }
    const userExist = yield userModel_1.default.exists({ _id: userToRemoveBanId });
    if (!userExist) {
        next(new appError_1.default(404, 'User you are trying to un-ban cannot be found. Maybe its account no longer exist'));
        return;
    }
    const community = req.community;
    const userInBannedList = community.bannedUsers.find((user) => user.toString() === userToRemoveBanId.toString());
    if (!userInBannedList) {
        next(new appError_1.default(400, 'User you are trying to un-ban is not in banned users list. You cannot un-ban user that is not banned'));
        return;
    }
    community.bannedUsers = community.bannedUsers.filter((user) => user.toString() !== userToRemoveBanId.toString());
    const responseData = {
        status: 'success',
        message: 'You have successfully removed ban for user',
        userRemovedBanId: userToRemoveBanId
    };
    if (shouldNotifyUser) {
        const userRemovedBanNotifications = yield notificationModel_1.default.create({
            receiver: userToRemoveBanId,
            notificationType: 'removeCommunityBan',
            text: `Your ban from community: "${community.name}" has been removed. You can see this communities posts and chats now.`,
            community: community._id
        });
        responseData.userRemovedBanNotifications = [userRemovedBanNotifications];
    }
    if (inviteUserToJoinOrModerate &&
        (inviteUserToJoinOrModerate === 'member' || inviteUserToJoinOrModerate === 'moderator')) {
        let notificationData = {
            receiver: userToRemoveBanId,
            notificationType: inviteUserToJoinOrModerate === 'member' ? 'becomeCommunityMemberRequest' : 'becomeCommunityModeratorRequest',
            text: `You have been invited to become ${inviteUserToJoinOrModerate} in "${community.name}" community.`,
            community: community._id
        };
        if (inviteUserToJoinOrModerate === 'member') {
            community.pendingInvitedUsers.push(userToRemoveBanId);
        }
        if (inviteUserToJoinOrModerate === 'moderator') {
            community.pendingInvitedModerators.push(userToRemoveBanId);
        }
        const inviteNotification = yield notificationModel_1.default.create(notificationData);
        if (responseData.userRemovedBanNotifications) {
            responseData.userRemovedBanNotifications.push(inviteNotification);
        }
        else {
            responseData.userRemovedBanNotifications = [inviteNotification];
        }
    }
    yield community.save();
    return res.status(200).json(responseData);
}));
