"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const validator_1 = require("validator");
const signupInputsRules_1 = __importDefault(require("configs/validators/auth/signupInputsRules"));
const userSchema = new mongoose_1.Schema({
    firstName: {
        type: String,
        required: [
            true,
            signupInputsRules_1.default.firstName.requiredErrorMessage
        ],
        minLength: [
            signupInputsRules_1.default.firstName.minLength.value,
            signupInputsRules_1.default.firstName.minLength.errorMessage
        ],
        maxLength: [
            signupInputsRules_1.default.firstName.maxLength.value,
            signupInputsRules_1.default.firstName.maxLength.errorMessage
        ]
    },
    lastName: {
        type: String,
        required: [
            true,
            signupInputsRules_1.default.lastName.requiredErrorMessage
        ],
        minLength: [
            signupInputsRules_1.default.lastName.minLength.value,
            signupInputsRules_1.default.lastName.minLength.errorMessage
        ],
        maxLength: [
            signupInputsRules_1.default.lastName.maxLength.value,
            signupInputsRules_1.default.lastName.maxLength.errorMessage
        ]
    },
    fullName: String,
    email: {
        type: String,
        required: [true, signupInputsRules_1.default.email.requiredErrorMessage],
        lowercase: true,
        unique: true,
        validate: [
            validator_1.isEmail,
            signupInputsRules_1.default.email.invalidEmailMesssage
        ]
    },
    password: {
        type: String,
        required: [true, signupInputsRules_1.default.password.requiredErrorMessage],
        select: false
    },
    role: {
        type: String,
        enum: {
            values: ['user', 'admin'],
            message: 'Role can only be "user" or "admin'
        },
        default: 'user'
    },
    profilePhotoUrl: String,
    // for cloudinary - to be able to use it for user deletions
    profilePhotoPublicId: {
        type: String,
        select: false
    },
    lastTimeSeen: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});
const User = mongoose_1.models.User || (0, mongoose_1.model)('User', userSchema);
exports.default = User;
