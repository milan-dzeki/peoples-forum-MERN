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
const appError_1 = __importDefault(require("utils/appError"));
const signupValidator_1 = __importDefault(require("configs/validators/auth/signupValidator"));
const authService_1 = __importDefault(require("services/authService"));
const cloudinaryManagementService_1 = __importDefault(require("services/cloudinaryManagementService"));
const userModel_1 = __importDefault(require("models/userModel"));
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
    const { errors } = yield signupValidator_1.default.validateUserInputs({
        firstName,
        lastName,
        email,
        password,
        passwordConfirm
    });
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
        const uploadedPhotoData = yield cloudinaryManagementService_1.default.uploadSinglePhotoToCloudinary(req.files.profilePhoto);
        prepareUserForCreation.profilePhotoUrl = uploadedPhotoData.secure_url;
        prepareUserForCreation.profilePhotoPublicId = uploadedPhotoData.secure_url;
    }
    const newUser = yield userModel_1.default.create(prepareUserForCreation);
    const signedUser = authService_1.default.createTokenCookieAndResponseUser(newUser);
    if (!signedUser) {
        yield authService_1.default.deleteUserAndPhotoOnSignupFail(newUser);
        next(new appError_1.default(500, 'User creation failed. Maybe servers are down. Refresh the page and try again'));
        return;
    }
    const { user, token } = signedUser;
    const { createModelsError } = yield authService_1.default.createRequiredCollectionsAfterUserCreation(user._id.toString());
    if (createModelsError) {
        yield authService_1.default.deleteUserAndPhotoOnSignupFail(newUser);
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
    const userDB = yield userModel_1.default.findOne({ email }).select('+password');
    if (!userDB) {
        next(new appError_1.default(400, 'Invalid email or password'));
        return;
    }
    const isPasswordValid = yield bcryptjs_1.default.compare(password, userDB.password);
    if (!isPasswordValid) {
        next(new appError_1.default(400, 'Invalid email or password'));
        return;
    }
    const signedUser = authService_1.default.createTokenCookieAndResponseUser(userDB);
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
