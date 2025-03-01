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
exports.createRequiredCollectionsAfterUserCreation = exports.deleteUserAndPhotoOnSignupFail = exports.createTokenCookieAndResponseUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cloudinary_1 = __importDefault(require("configs/cloudinary"));
const userModel_1 = __importDefault(require("models/userModel"));
const profileModel_1 = __importDefault(require("models/profileModel"));
const friendsModel_1 = __importDefault(require("models/friendsAndFollowers/friendsModel"));
const followersModel_1 = __importDefault(require("models/friendsAndFollowers/followersModel"));
const blockedUsersSettingsModel_1 = __importDefault(require("models/settings/blockedUsersSettingsModel"));
const profileSettingsModel_1 = __importDefault(require("models/settings/profileSettingsModel"));
const messagingSettingsModel_1 = __importDefault(require("models/settings/messagingSettingsModel"));
const postsSettingsModel_1 = __importDefault(require("models/settings/postsSettingsModel"));
const receivedNotificationSettingsModel_1 = __importDefault(require("models/settings/receivedNotificationSettingsModel"));
const createTokenCookieAndResponseUser = (user) => {
    const userId = user._id.toString();
    const responseUser = {
        _id: userId,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        profilePhotoUrl: user.profilePhotoUrl || null,
        createdAt: user.createdAt
    };
    const token = jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
    if (!token) {
        return null;
    }
    return { user: responseUser, token };
};
exports.createTokenCookieAndResponseUser = createTokenCookieAndResponseUser;
const deleteUserAndPhotoOnSignupFail = (user) => __awaiter(void 0, void 0, void 0, function* () {
    if (user.profilePhotoUrl && user.profilePhotoPublicId) {
        yield cloudinary_1.default.uploader.destroy(user.profilePhotoPublicId);
    }
    yield userModel_1.default.deleteOne({ _id: user._id });
});
exports.deleteUserAndPhotoOnSignupFail = deleteUserAndPhotoOnSignupFail;
const createRequiredCollectionsAfterUserCreation = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield profileModel_1.default.create({ user: userId });
        yield friendsModel_1.default.create({
            user: userId,
            receivedPendingRequests: [],
            sentPendingRequests: [],
            friends: []
        });
        yield followersModel_1.default.create({
            user: userId,
            myFollowers: [],
            peopleIFollow: []
        });
        yield blockedUsersSettingsModel_1.default.create({
            user: userId,
            blockedByMe: [],
            blockedMe: []
        });
        yield profileSettingsModel_1.default.create({ user: userId });
        yield messagingSettingsModel_1.default.create({ user: userId });
        yield postsSettingsModel_1.default.create({ user: userId });
        yield receivedNotificationSettingsModel_1.default.create({ user: userId });
        return {
            createModelsError: null
        };
    }
    catch (_a) {
        yield profileModel_1.default.deleteMany({ user: userId });
        yield friendsModel_1.default.deleteMany({ user: userId });
        yield followersModel_1.default.deleteMany({ user: userId });
        yield blockedUsersSettingsModel_1.default.deleteMany({ user: userId });
        yield profileSettingsModel_1.default.deleteMany({ user: userId });
        yield messagingSettingsModel_1.default.deleteMany({ user: userId });
        yield postsSettingsModel_1.default.deleteMany({ user: userId });
        yield receivedNotificationSettingsModel_1.default.deleteMany({ user: userId });
        return {
            createModelsError: 'Error while creating user. Maybe server is down. Refresh the page and try again'
        };
    }
});
exports.createRequiredCollectionsAfterUserCreation = createRequiredCollectionsAfterUserCreation;
