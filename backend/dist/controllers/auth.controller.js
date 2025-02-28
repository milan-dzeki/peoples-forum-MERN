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
exports.login = exports.signup = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const catchAsync_1 = __importDefault(require("utils/catchAsync"));
const cloudinary_1 = __importDefault(require("configs/cloudinary"));
const appError_1 = __importDefault(require("utils/appError"));
const user_validator_1 = __importDefault(require("configs/validators/user.validator"));
const auth_service_1 = require("services/auth/auth.service");
const user_model_1 = __importDefault(require("models/user.model"));
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
    const { errors } = user_validator_1.default.validateUserInputs({
        firstName,
        lastName,
        email,
        password,
        passwordConfirm
    });
    const userWithEmailExists = yield user_model_1.default.find({ email });
    if (userWithEmailExists.length) {
        next(new appError_1.default(400, 'Provided email is already taken'));
        return;
    }
    if (errors) {
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
    const signedUser = (0, auth_service_1.createTokenCookieAndResponseUser)(newUser);
    if (!signedUser) {
        yield (0, auth_service_1.deleteUserAndPhotoOnSignupFail)(newUser);
        next(new appError_1.default(500, 'User creation failed. Maybe servers are down. Refresh the page and try again'));
        return;
    }
    const { user, token } = signedUser;
    const { createModelsError } = yield (0, auth_service_1.createRequiredCollectionsAfterUserCreation)(user._id.toString());
    if (createModelsError) {
        yield (0, auth_service_1.deleteUserAndPhotoOnSignupFail)(newUser);
        next(new appError_1.default(500, createModelsError));
        return;
    }
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
exports.login = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!email || !password) {
        next(new appError_1.default(422, 'Email and password are required'));
        return;
    }
    const userDB = yield user_model_1.default.findOne({ email }).select('+password');
    if (!userDB) {
        next(new appError_1.default(400, 'Invalid email or password'));
        return;
    }
    const isPasswordValid = yield bcryptjs_1.default.compare(password, userDB.password);
    if (!isPasswordValid) {
        next(new appError_1.default(400, 'Invalid email or password'));
        return;
    }
    const signedUser = (0, auth_service_1.createTokenCookieAndResponseUser)(userDB);
    if (!signedUser) {
        next(new appError_1.default(500, 'User login. Maybe servers are down. Refresh the page and try again'));
        return;
    }
    const { user, token } = signedUser;
    res.cookie('_pplFrmCKK', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict'
    });
    return res.status(200).json({
        status: 'success',
        message: 'Login successfull',
        user
    });
}));
