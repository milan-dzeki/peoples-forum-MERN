"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ParentValidator {
    static isValidNonEmptyString(value, errorMessage) {
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
}
exports.default = ParentValidator;
