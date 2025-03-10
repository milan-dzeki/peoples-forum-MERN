import { ALLOWED_POST_DATA_TYPES } from 'configs/community/communitySettings';
import AppError from 'utils/appError';

class CommunitySettingsValidator {
  static isCommunityAccessValueValid (value: unknown): void {
    if (
      !value ||
      (value && value !== 'public' && value !== 'private')
    ) {
      throw new AppError(422, 'Invalid access value provided: can be either "public" or "private"');
    }
  }

  static isSingleSettingReqDataValid (
    settingName: any,
    settingValue: any,
    ALLOWED_SETTING_NAMES_LIST: string[],
    checkIfValueIsBoolean?: boolean
  ): void {
    if (!settingName || (settingName && typeof settingName !== 'string')) {
      throw new AppError(400, 'Invalid setting name provided');
    }
  
    if (!ALLOWED_SETTING_NAMES_LIST.includes(settingName)) {
      throw new AppError(400, 'Invalid setting name provided');
    }

    if (checkIfValueIsBoolean) {
      if (typeof settingValue !== 'boolean') {
        throw new AppError(400, 'Invalid data types provided');
      }
    }
  }

  static areAllSettingsReqDataValid (
    settings: unknown,
    ALLOWED_SETTING_NAMES_LIST: string[],
    settingName: string,
    checkIfValueIsBoolean?: boolean
  ): void {
    if (
      !settings || 
      (settings && typeof settings !== 'object')
    ) {
      throw new AppError(400, 'No valid setting for update are provided');
    }

    if (Object.keys(settings).length === 0) {
      throw new AppError(400, 'Empty setting list provided');
    }

    const providedSettingNames = Object.keys(settings).map((setting) => setting);

    if (
      providedSettingNames.length !== ALLOWED_SETTING_NAMES_LIST.length ||
      !providedSettingNames.every((name) => ALLOWED_SETTING_NAMES_LIST.includes(name)) ||
      !ALLOWED_SETTING_NAMES_LIST.every((name) => providedSettingNames.includes(name)) 
    ) {
      throw new AppError(422, `Invalid ${settingName} setting names provided. All settings for ${settingName} are required to be sent`);
    }

    if (checkIfValueIsBoolean) {
      const allValuesBoolean = Object.keys(settings)
        .every((setting: string) => typeof settings[setting as keyof typeof settings] === 'boolean');

      if (!allValuesBoolean) {
        throw new AppError(422, 'Invalid data: all setting values must be true or false');
      }
    }
  }

  static isAllowedPostsDataSettingValueValid (values: string[]) {
    if (!values || (values && !Array.isArray(values))) {
      throw new AppError(422, 'Invalid data types for "allowed posts data" provided');
    }

    if (!values.length) {
      throw new AppError(422, 'At least 1 value is required for allowed post data');
    }

    if (!values.every((value: string) => ALLOWED_POST_DATA_TYPES.includes(value))) {
      throw new AppError(422, 'Invalid post data allowed values: can be text, photos and videos');
    } 

    const hasDuplicateValues = values.filter((value: string, index: number) => values.indexOf(value) !== index);
    if (Array.from(new Set(values)).length !== values.length) {
      throw new AppError(422, `Duplicate value provided for allowed post data: ${hasDuplicateValues.join(', ')}`);
    }
  }
}

export default CommunitySettingsValidator;