export const COMMUNITY_MODERATOR_REQUEST_TYPES = {
  UPDATE_DESCRIPTION: 'update_description',
  UPDATE_PROFILE_PHOTO: 'update_profile_photo',
  REMOVE_PROFILE_PHOTO: 'remove_profile_photo',
  UPDATE_BANNER_PHOTO: 'update_banner_photo',
  REMOVE_BANNER_PHOTO: 'remove_banner_photo',
  ADD_RULE: 'add_rule',
  UPDATE_SINGLE_RULE: 'update_single_rule',
  UPDATE_RULES: 'update_rules',
  DELETE_SINGLE_RULE: 'delete_single_rule',
  DELETE_MULTIPLE_RULES: 'delete_multiple_rules',
  DELETE_ALL_RULES: 'delete_all_rules',
  BAN_USER: 'ban_user'
};

export const ALLOWED_MODERATOR_REQUEST_UPDATE_VALUES = [
  'newDescriptionValue',
  'photo',
  'newRules',
  'deleteRuleIds'
];