"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const signupInputRules = {
    firstName: {
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
    },
    lastName: {
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
    },
    email: {
        requiredErrorMessage: 'Email is required',
        invalidEmailMesssage: 'Provided Email format is invalid',
        emailTakenErrorMessage: 'Provided email is already taken'
    },
    password: {
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
    }
};
exports.default = signupInputRules;
