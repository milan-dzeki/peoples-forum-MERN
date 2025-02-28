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
exports.signup = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const catchAsync_1 = __importDefault(require("utils/catchAsync"));
const cloudinary_1 = __importDefault(require("configs/cloudinary"));
const appError_1 = __importDefault(require("utils/appError"));
const user_validator_1 = __importDefault(require("configs/validators/user.validator"));
const auth_service_1 = __importDefault(require("services/auth/auth.service"));
const user_model_1 = __importDefault(require("models/user.model"));
const profile_model_1 = __importDefault(require("models/profile.model"));
const friends_model_1 = __importDefault(require("models/friendsAndFollowers/friends.model"));
const followers_model_1 = __importDefault(require("models/friendsAndFollowers/followers.model"));
const blockedUsersSettings_model_1 = __importDefault(require("models/settings/blockedUsersSettings.model"));
const profileSettings_model_1 = __importDefault(require("models/settings/profileSettings.model"));
const messagingSettings_model_1 = __importDefault(require("models/settings/messagingSettings.model"));
const postsSettings_model_1 = __importDefault(require("models/settings/postsSettings.model"));
const receivedNotificationSettings_model_1 = __importDefault(require("models/settings/receivedNotificationSettings.model"));
exports.signup = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.fields) {
        next(new appError_1.default(500, 'Request fields are missing. try refreshing the page and try again'));
        return;
    }
    const { firstName, lastName, email, password, passwordConfirm } = req.fields;
    /*
      need to type cast req.fields because it is wrongly typed in d.ts file => it says that each property is string[] | undefined
      which is not true - it is string | undefined
    */
    // validate fields
    const errors = {};
    const firstNameError = user_validator_1.default.validateNames(firstName, 'firstName');
    if (firstNameError) {
        errors.firstName = firstNameError;
    }
    const lastNameError = user_validator_1.default.validateNames(lastName, 'lastName');
    if (lastNameError) {
        errors.lastName = lastNameError;
    }
    const emailError = user_validator_1.default.isValidEmail(email);
    if (emailError) {
        errors.email = emailError;
    }
    const passwordsError = user_validator_1.default.validatePassword(password, passwordConfirm);
    if (passwordsError) {
        errors.password = passwordsError;
    }
    const userWithEmailExists = yield user_model_1.default.find({ email });
    if (userWithEmailExists.length) {
        next(new appError_1.default(400, 'Provided email is already taken'));
        return;
    }
    if (Object.keys(errors).length > 0) {
        next(new appError_1.default(422, 'Invalid inputs', errors));
        return;
    }
    const hashedPassword = yield bcryptjs_1.default.hash(password, 12);
    if (!hashedPassword) {
        next(new appError_1.default(500, 'Setting password failed. Server is possibly down. refresh and try again'));
        return;
    }
    const prepareUserForCreation = {
        firstName: firstName,
        lastName: lastName,
        fullname: `${firstName} ${lastName}`,
        email: email,
        password: hashedPassword,
        lastTimeSeen: new Date()
    };
    if (req.files && req.files.profilePhoto) {
        const profilePhoto = req.files.profilePhoto;
        if (profilePhoto.path) {
            const uploadCustomError = new appError_1.default(500, 'Unable to upload the photo. Maybe servers are down. Refresh the page and try again.');
            const uploadedPhoto = yield cloudinary_1.default.uploader.upload(profilePhoto.path, (error) => {
                if (error) {
                    next(uploadCustomError);
                    return;
                }
            });
            if (!uploadedPhoto.secure_url || !uploadedPhoto.public_id) {
                next(uploadCustomError);
                return;
            }
            prepareUserForCreation.profilePhotoUrl = uploadedPhoto.secure_url;
            prepareUserForCreation.profilePhotoPublicId = uploadedPhoto.secure_url;
        }
    }
    const newUser = yield user_model_1.default.create(prepareUserForCreation);
    const signedUser = (0, auth_service_1.default)(newUser);
    if (!signedUser) {
        if (newUser.profilePhotoPublicId) {
            yield cloudinary_1.default.uploader.destroy(newUser.profilePhotoPublicId);
        }
        yield user_model_1.default.deleteOne({ _id: newUser._id });
        next(new appError_1.default(500, 'User creation failed. Maybe servers are down. Refresh the page and try again'));
        return;
    }
    const { user, token } = signedUser;
    yield profile_model_1.default.create({ user: user._id });
    yield friends_model_1.default.create({
        user: user._id,
        receivedPendingRequests: [],
        sentPendingRequests: [],
        friends: []
    });
    yield followers_model_1.default.create({
        user: user._id,
        myFollowers: [],
        peopleIFollow: []
    });
    yield blockedUsersSettings_model_1.default.create({
        user: user._id,
        blockedByMe: [],
        blockedMe: []
    });
    yield profileSettings_model_1.default.create({ user: user._id });
    yield messagingSettings_model_1.default.create({ user: user._id });
    yield postsSettings_model_1.default.create({ user: user._id });
    yield receivedNotificationSettings_model_1.default.create({ user: user._id });
    res.cookie('_pplFrmCKK', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict'
    });
    return res.status(201).json({
        status: 'success',
        message: 'You have successfully signed up to peoples forum',
        user
    });
}));
