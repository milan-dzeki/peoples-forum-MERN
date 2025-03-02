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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const validator_1 = require("validator");
const userModel_1 = __importDefault(require("models/userModel"));
const signupInputRules_1 = __importDefault(require("./signupInputRules"));
const parentValidator_1 = __importDefault(require("configs/validators/parentValidator"));
class SignupValidator extends parentValidator_1.default {
    static isValidEmail(value) {
        return !value || !(0, validator_1.isEmail)(value)
            ? signupInputRules_1.default.email.invalidEmailMesssage
            : null;
    }
    static doesUserWithEmailAlreadyExist(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const emailInvalidError = this.isValidEmail(email);
            if (emailInvalidError) {
                return emailInvalidError;
            }
            try {
                const userWithEmailExists = yield userModel_1.default.find({ email });
                if (userWithEmailExists.length) {
                    return signupInputRules_1.default.email.emailTakenErrorMessage;
                }
                return null;
            }
            catch (_b) {
                return 'Checking email failed. Maybe servers are down. Refresh page and try again';
            }
        });
    }
    static arePasswordsTheSame(password, passwordConfim) {
        return !passwordConfim || password !== passwordConfim
            ? signupInputRules_1.default.password.passwordsNotTheSameErrorMessage
            : null;
    }
    static validatePassword(password, passwordConfim) {
        const invalidPassword = this.isValidNonEmptyString(password, signupInputRules_1.default.password.requiredErrorMessage);
        if (invalidPassword) {
            return invalidPassword;
        }
        const smallerLengthThanRequired = this.isSmallerThanMinLength(password, signupInputRules_1.default.password.minLength.value, signupInputRules_1.default.password.minLength.errorMessage);
        if (smallerLengthThanRequired) {
            return smallerLengthThanRequired;
        }
        const higherLengthThanRequired = this.isHigherThanMaxLength(password, signupInputRules_1.default.password.maxLength.value, signupInputRules_1.default.password.maxLength.errorMessage);
        if (higherLengthThanRequired) {
            return higherLengthThanRequired;
        }
        const notSame = this.arePasswordsTheSame(password, passwordConfim);
        if (notSame) {
            return notSame;
        }
        return null;
    }
    static validateUserInputs(userInputs) {
        return __awaiter(this, void 0, void 0, function* () {
            const { firstName, lastName, email, password, passwordConfirm } = userInputs;
            const errors = {};
            const userWithEmailExistsError = yield this.doesUserWithEmailAlreadyExist(email);
            const validationErrors = {
                firstNameError: this.validateNames(firstName, 'firstName'),
                lastNameError: this.validateNames(lastName, 'lastName'),
                emailError: userWithEmailExistsError,
                passwordError: this.validatePassword(password, passwordConfirm)
            };
            Object.keys(validationErrors).forEach((key) => {
                if (validationErrors[key]) {
                    errors[key] = validationErrors[key];
                }
            });
            return Object.keys(errors).length
                ? { errors }
                : { errors: null };
        });
    }
}
_a = SignupValidator;
SignupValidator.validateNames = (value, key) => {
    const invalidName = _a.isValidNonEmptyString(value, signupInputRules_1.default[key].requiredErrorMessage);
    if (invalidName) {
        return invalidName;
    }
    // add exclamation marks for value because it will exist if first check (above) doesn't return error msg
    const multiWord = _a.isSingleString(value, signupInputRules_1.default[key].mustBeOneWordErrorMessage);
    if (multiWord) {
        return multiWord;
    }
    const smallerLengthThanRequired = _a.isSmallerThanMinLength(value, signupInputRules_1.default[key].minLength.value, signupInputRules_1.default[key].minLength.errorMessage);
    if (smallerLengthThanRequired) {
        return smallerLengthThanRequired;
    }
    const higherLengthThanRequired = _a.isHigherThanMaxLength(value, signupInputRules_1.default[key].maxLength.value, signupInputRules_1.default[key].maxLength.errorMessage);
    if (higherLengthThanRequired) {
        return higherLengthThanRequired;
    }
    return null;
};
exports.default = SignupValidator;
