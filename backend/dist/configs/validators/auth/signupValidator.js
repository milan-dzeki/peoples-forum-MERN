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
const signupInputsRules_1 = __importDefault(require("./signupInputsRules"));
class SignupValidator {
    static doesExistAsString(value, errorMessage) {
        return !value || (value && typeof value === 'string' && value.trim().length === 0) || (value && typeof value !== 'string')
            ? errorMessage
            : null;
    }
    static isSingleString(value, errorMessage) {
        return value.split(' ').length > 1
            ? errorMessage
            : null;
    }
    static isSmallerThanMinLength(value, minLength, errorMessage) {
        return value.trim().length < minLength
            ? errorMessage
            : null;
    }
    static isHigherThanMaxLength(value, maxLength, errorMessage) {
        return value.trim().length > maxLength
            ? errorMessage
            : null;
    }
    static isValidEmail(value) {
        return !value || !(0, validator_1.isEmail)(value)
            ? { error: signupInputsRules_1.default.email.invalidEmailMesssage + 'validator' }
            : { error: null };
    }
    static doesUserWithEmailAlreadyExist(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const emailInvalidError = this.isValidEmail(email);
            if (emailInvalidError) {
                return emailInvalidError.error;
            }
            try {
                const userWithEmailExists = yield userModel_1.default.find({ email });
                if (userWithEmailExists.length) {
                    return signupInputsRules_1.default.email.emailTakenErrorMessage;
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
            ? signupInputsRules_1.default.password.passwordsNotTheSameErrorMessage
            : null;
    }
    static validatePassword(password, passwordConfim) {
        const invalidPassword = this.doesExistAsString(password, signupInputsRules_1.default.password.requiredErrorMessage);
        if (invalidPassword) {
            return { error: invalidPassword };
        }
        const smallerLengthThanRequired = this.isSmallerThanMinLength(password, signupInputsRules_1.default.password.minLength.value, signupInputsRules_1.default.password.minLength.errorMessage);
        if (smallerLengthThanRequired) {
            return { error: smallerLengthThanRequired };
        }
        const higherLengthThanRequired = this.isHigherThanMaxLength(password, signupInputsRules_1.default.password.maxLength.value, signupInputsRules_1.default.password.maxLength.errorMessage);
        if (higherLengthThanRequired) {
            return { error: higherLengthThanRequired };
        }
        const notSame = this.arePasswordsTheSame(password, passwordConfim);
        if (notSame) {
            return { error: notSame };
        }
        return { error: null };
    }
    static validateUserInputs(userInputs) {
        return __awaiter(this, void 0, void 0, function* () {
            const { firstName, lastName, email, password, passwordConfirm } = userInputs;
            const errors = {};
            const validationErrors = {
                firstNameError: this.validateNames(firstName, 'firstName').error,
                lastNameError: this.validateNames(lastName, 'lastName').error,
                emailError: yield this.doesUserWithEmailAlreadyExist(email),
                passwordError: this.validatePassword(password, passwordConfirm).error
            };
            Object.keys(validationErrors).forEach((key) => {
                if (validationErrors[key]) {
                    errors[key] = validationErrors[key];
                }
            });
            console.log(errors);
            return Object.keys(errors).length
                ? { errors }
                : { errors: null };
        });
    }
}
_a = SignupValidator;
SignupValidator.validateNames = (value, key) => {
    const invalidName = _a.doesExistAsString(value, signupInputsRules_1.default[key].requiredErrorMessage);
    if (invalidName) {
        return { error: invalidName };
    }
    // add exclamation marks for value because it will exist if first check (above) doesn't return error msg
    const multiWord = _a.isSingleString(value, signupInputsRules_1.default[key].mustBeOneWordErrorMessage);
    if (multiWord) {
        return { error: multiWord };
    }
    const smallerLengthThanRequired = _a.isSmallerThanMinLength(value, signupInputsRules_1.default[key].minLength.value, signupInputsRules_1.default[key].minLength.errorMessage);
    if (smallerLengthThanRequired) {
        return { error: smallerLengthThanRequired };
    }
    const higherLengthThanRequired = _a.isHigherThanMaxLength(value, signupInputsRules_1.default[key].maxLength.value, signupInputsRules_1.default[key].maxLength.errorMessage);
    if (higherLengthThanRequired) {
        return { error: higherLengthThanRequired };
    }
    return { error: null };
};
exports.default = SignupValidator;
