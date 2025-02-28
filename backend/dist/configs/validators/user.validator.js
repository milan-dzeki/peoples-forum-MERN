"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const validator_1 = require("validator");
class UserValidator {
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
            ? { error: this.email.invalidEmailMesssage }
            : { error: null };
    }
    static arePasswordsTheSame(password, passwordConfim) {
        return !passwordConfim || password !== passwordConfim
            ? this.password.passwordsNotTheSameErrorMessage
            : null;
    }
    static validatePassword(password, passwordConfim) {
        const invalidPassword = this.doesExistAsString(password, this.password.requiredErrorMessage);
        if (invalidPassword) {
            return { error: invalidPassword };
        }
        const smallerLengthThanRequired = this.isSmallerThanMinLength(password, this.password.minLength.value, this.password.minLength.errorMessage);
        if (smallerLengthThanRequired) {
            return { error: smallerLengthThanRequired };
        }
        const higherLengthThanRequired = this.isHigherThanMaxLength(password, this.password.maxLength.value, this.password.maxLength.errorMessage);
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
        const { firstName, lastName, email, password, passwordConfirm } = userInputs;
        const errors = {};
        const validationErrors = {
            firstNameError: this.validateNames(firstName, 'firstName').error,
            lastNameError: this.validateNames(lastName, 'lastName').error,
            emailError: this.isValidEmail(email).error,
            passwordError: this.validatePassword(password, passwordConfirm).error
        };
        Object.keys(validationErrors).forEach((key) => {
            if (validationErrors[key]) {
                errors[key] = validationErrors[key];
            }
        });
        return Object.keys(errors).length
            ? { errors }
            : { errors: null };
    }
}
_a = UserValidator;
UserValidator.firstName = {
    requiredErrorMessage: 'First Name is required',
    mustBeOneWordErrorMessage: 'First Name must be one word',
    minLength: {
        value: 2,
        errorMessage: 'First Name must be at least 2 characters long'
    },
    maxLength: {
        value: 10,
        errorMessage: 'First Name must not exceed 10 characters'
    },
};
UserValidator.lastName = {
    requiredErrorMessage: 'Last Name is required',
    minLength: {
        value: 2,
        errorMessage: 'Last Name must be at least 2 characters long'
    },
    maxLength: {
        value: 10,
        errorMessage: 'Last Name must not exceed 10 characters'
    },
    mustBeOneWordErrorMessage: 'Last Name must be one word',
};
UserValidator.email = {
    requiredErrorMessage: 'Email is required',
    invalidEmailMesssage: 'Provided Email format is invalid'
};
UserValidator.password = {
    requiredErrorMessage: 'Password is required',
    minLength: {
        value: 6,
        errorMessage: 'Password must be at least 6 characters long'
    },
    maxLength: {
        value: 20,
        errorMessage: 'Password must be under 20 characters'
    },
    passwordsNotTheSameErrorMessage: 'Passwords must be the same'
};
UserValidator.validateNames = (value, key) => {
    const invalidName = _a.doesExistAsString(value, _a[key].requiredErrorMessage);
    if (invalidName) {
        return { error: invalidName };
    }
    // add exclamation marks for value because it will exist if first check (above) doesn't return error msg
    const multiWord = _a.isSingleString(value, _a[key].mustBeOneWordErrorMessage);
    if (multiWord) {
        return { error: multiWord };
    }
    const smallerLengthThanRequired = _a.isSmallerThanMinLength(value, _a[key].minLength.value, _a[key].minLength.errorMessage);
    if (smallerLengthThanRequired) {
        return { error: smallerLengthThanRequired };
    }
    const higherLengthThanRequired = _a.isHigherThanMaxLength(value, _a[key].maxLength.value, _a[key].maxLength.errorMessage);
    if (higherLengthThanRequired) {
        return { error: higherLengthThanRequired };
    }
    return { error: null };
};
exports.default = UserValidator;
