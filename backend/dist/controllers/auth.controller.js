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
const catchAsync_1 = __importDefault(require("utils/catchAsync"));
const appError_1 = __importDefault(require("utils/appError"));
const user_validator_1 = __importDefault(require("configs/validators/user.validator"));
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
    if (Object.keys(errors).length > 0) {
        next(new appError_1.default(422, 'Invalid inputs', errors));
        return;
    }
    return res.send('success');
}));
