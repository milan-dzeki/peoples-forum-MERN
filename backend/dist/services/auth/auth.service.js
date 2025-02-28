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
const user_model_1 = __importDefault(require("models/user.model"));
const profile_model_1 = __importDefault(require("models/profile.model"));
const friends_model_1 = __importDefault(require("models/friendsAndFollowers/friends.model"));
const followers_model_1 = __importDefault(require("models/friendsAndFollowers/followers.model"));
const blockedUsersSettings_model_1 = __importDefault(require("models/settings/blockedUsersSettings.model"));
const profileSettings_model_1 = __importDefault(require("models/settings/profileSettings.model"));
const messagingSettings_model_1 = __importDefault(require("models/settings/messagingSettings.model"));
const postsSettings_model_1 = __importDefault(require("models/settings/postsSettings.model"));
const receivedNotificationSettings_model_1 = __importDefault(require("models/settings/receivedNotificationSettings.model"));
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
    yield user_model_1.default.deleteOne({ _id: user._id });
});
exports.deleteUserAndPhotoOnSignupFail = deleteUserAndPhotoOnSignupFail;
const createRequiredCollectionsAfterUserCreation = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield profile_model_1.default.create({ user: userId });
        yield friends_model_1.default.create({
            user: userId,
            receivedPendingRequests: [],
            sentPendingRequests: [],
            friends: []
        });
        yield followers_model_1.default.create({
            user: userId,
            myFollowers: [],
            peopleIFollow: []
        });
        yield blockedUsersSettings_model_1.default.create({
            user: userId,
            blockedByMe: [],
            blockedMe: []
        });
        yield profileSettings_model_1.default.create({ user: userId });
        yield messagingSettings_model_1.default.create({ user: userId });
        yield postsSettings_model_1.default.create({ user: userId });
        yield receivedNotificationSettings_model_1.default.create({ user: userId });
        return {
            createModelsError: null
        };
    }
    catch (_a) {
        yield profile_model_1.default.deleteMany({ user: userId });
        yield friends_model_1.default.deleteMany({ user: userId });
        yield followers_model_1.default.deleteMany({ user: userId });
        yield blockedUsersSettings_model_1.default.deleteMany({ user: userId });
        yield profileSettings_model_1.default.deleteMany({ user: userId });
        yield messagingSettings_model_1.default.deleteMany({ user: userId });
        yield postsSettings_model_1.default.deleteMany({ user: userId });
        yield receivedNotificationSettings_model_1.default.deleteMany({ user: userId });
        return {
            createModelsError: 'Error while creating user. Maybe server is down. Refresh the page and try again'
        };
    }
});
exports.createRequiredCollectionsAfterUserCreation = createRequiredCollectionsAfterUserCreation;
