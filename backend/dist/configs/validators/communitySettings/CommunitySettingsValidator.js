"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const communitySettings_1 = require("configs/communitySettings");
const appError_1 = __importDefault(require("utils/appError"));
class CommunitySettingsValidator {
    static isCommunityAccessValueValid(value) {
        if (!value ||
            (value && value !== 'public' && value !== 'private')) {
            throw new appError_1.default(422, 'Invalid access value provided: can be either "public" or "private"');
        }
    }
    static isSingleSettingReqDataValid(settingName, settingValue, ALLOWED_SETTING_NAMES_LIST, checkIfValueIsBoolean) {
        if (!settingName || (settingName && typeof settingName !== 'string')) {
            throw new appError_1.default(400, 'Invalid setting name provided');
        }
        if (!ALLOWED_SETTING_NAMES_LIST.includes(settingName)) {
            throw new appError_1.default(400, 'Invalid setting name provided');
        }
        if (checkIfValueIsBoolean) {
            if (typeof settingValue !== 'boolean') {
                throw new appError_1.default(400, 'Invalid data types provided');
            }
        }
    }
    static areAllSettingsReqDataValid(settings, ALLOWED_SETTING_NAMES_LIST, settingName, checkIfValueIsBoolean) {
        if (!settings ||
            (settings && typeof settings !== 'object')) {
            throw new appError_1.default(400, 'No valid setting for update are provided');
        }
        if (Object.keys(settings).length === 0) {
            throw new appError_1.default(400, 'Empty setting list provided');
        }
        const providedSettingNames = Object.keys(settings).map((setting) => setting);
        if (providedSettingNames.length !== ALLOWED_SETTING_NAMES_LIST.length ||
            !providedSettingNames.every((name) => ALLOWED_SETTING_NAMES_LIST.includes(name)) ||
            !ALLOWED_SETTING_NAMES_LIST.every((name) => providedSettingNames.includes(name))) {
            throw new appError_1.default(422, `Invalid ${settingName} setting names provided. All settings for ${settingName} are required to be sent`);
        }
        if (checkIfValueIsBoolean) {
            const allValuesBoolean = Object.keys(settings)
                .every((setting) => typeof settings[setting] === 'boolean');
            if (!allValuesBoolean) {
                throw new appError_1.default(422, 'Invalid data: all setting values must be true or false');
            }
        }
    }
    static isAllowedPostsDataSettingValueValid(values) {
        if (!values || (values && !Array.isArray(values))) {
            throw new appError_1.default(422, 'Invalid data types for "allowed posts data" provided');
        }
        if (!values.length) {
            throw new appError_1.default(422, 'At least 1 value is required for allowed post data');
        }
        if (!values.every((value) => communitySettings_1.ALLOWED_POST_DATA_TYPES.includes(value))) {
            throw new appError_1.default(422, 'Invalid post data allowed values: can be text, photos and videos');
        }
        const hasDuplicateValues = values.filter((value, index) => values.indexOf(value) !== index);
        if (Array.from(new Set(values)).length !== values.length) {
            throw new appError_1.default(422, `Duplicate value provided for allowed post data: ${hasDuplicateValues.join(', ')}`);
        }
    }
}
exports.default = CommunitySettingsValidator;
