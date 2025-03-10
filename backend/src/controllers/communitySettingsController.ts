import { Response, NextFunction } from 'express';
import type { RequestWithCommunitySettingsType } from 'types/lib';
import { COMMUNITY_PERMISSION_NAMES } from 'configs/community/community';
import { 
  ALLOWED_JOINED_MEMBERS_POST_SETTINGS_NAMES, 
  ALLOWED_JOINED_MEMBERS_CHATS_SETTINGS_NAMES,
  ALLOWED_NON_MEMBERS_PERMISSION_NAMES
} from 'configs/community/communitySettings';
import catchAsync from 'utils/catchAsync';
import AppError from 'utils/appError';
import CommunitySettingsService from 'services/communitySettingsService';
import { ChatsSettings, NonMembersPermissions, PostsSettings } from 'types/controllers/communitySettings';
import CommunitySettingsValidator from 'configs/validators/communitySettings/communitySettingsValidator';
import CommunityActivityLog from 'models/communityActivityLogsModel';
import { CommunitySettingsResponseType } from 'types/controllers/communitySettings';

export const getCommunitySettings = catchAsync (async (
  req: RequestWithCommunitySettingsType,
  res: Response,
  _: NextFunction
) => {
  const communitySettings = req.communitySettings!;
  const communityWithVirtuals = communitySettings.toJSON({ virtuals: true });

  return res.status(200).json({
    status: 'success',
    communitySettings: communityWithVirtuals
  });
});

export const updateCommunityAccess = catchAsync (async (
  req: RequestWithCommunitySettingsType,
  res: Response,
  _: NextFunction
) => {
  const { access } = req.body;

  CommunitySettingsValidator.isCommunityAccessValueValid(access);

  const communitySettings = req.communitySettings!;

  communitySettings.access!.value = access;
  await communitySettings.save();

  const additionalReqMessage = 
    communitySettings.access!.value 
    ? 'Now even non-members will be able to see community content, if other settings allow it.'
    : 'Now non-members will not be able to view community content.'

  await CommunitySettingsService.createCommunitySettingsChangedLog(
    communitySettings.community,
    req.userId!,
    `changed community access to "${communitySettings.access!.value}"`
  );

  const responseJson: CommunitySettingsResponseType = {
    status: 'success',
    message: `Community access changed to "${communitySettings.access!.value}". ${additionalReqMessage}`,
    updatedSettings: communitySettings.access!.value
  }

  const community = req.community!;

  const updatedResponseJson = await CommunitySettingsService.createModeratorNotifictaionsForSettingChanges(
    communitySettings.moderators_settings!.notifyModeratorAboutSettingsChanges!.value,
    community,
    `Admin changed "${community.name}" community access to "${communitySettings.access!.value}"`,
    responseJson
  );

  return res.status(200).json(updatedResponseJson);
});

export const updateNotifyModeratorsForSettingChangesSetting = catchAsync (async (
  req: RequestWithCommunitySettingsType,
  res: Response,
  next: NextFunction
) => {
  const { data } = req.body;
  if (typeof data !== 'boolean') {
    next(new AppError(422, 'Provided value for updating whether moderator actions require your approval must be either "true" or "false"'));
    return;
  }

  const communitySettings = req.communitySettings!;
  communitySettings.moderators_settings!.notifyModeratorAboutSettingsChanges!.value = data;
  await communitySettings.save();

  await CommunitySettingsService.createCommunitySettingsChangedLog(
    communitySettings.community,
    req.userId!,
    `${communitySettings.moderators_settings!.notifyModeratorAboutSettingsChanges!.value ? 'enabled' : 'disabled'} moderator notifications for settings changes`
  );

  const additionalReqMessage = 
    communitySettings.moderators_settings!.notifyModeratorAboutSettingsChanges!.value
    ? 'Now moderators will receive notifications for every setting change you make.'
    : 'Moderators will not be notified when settings are changed.';

  return res.status(200).json({
    status: 'success',
    message: `Successfully changed setting to "${communitySettings.moderators_settings!.notifyModeratorAboutSettingsChanges!.value}". ${additionalReqMessage}`,
    updatedSettings: communitySettings.moderators_settings!.notifyModeratorAboutSettingsChanges!.value
  });
});

export const updateChangesByModeratorRequireCreatorApproval = catchAsync (async (
  req: RequestWithCommunitySettingsType,
  res: Response,
  next: NextFunction
) => {
  const { data } = req.body;
  if (typeof data !== 'boolean') {
    next(new AppError(422, 'Provided value for updating whether moderator actions require your approval must be either "true" or "false"'));
    return;
  }

  const communitySettings = req.communitySettings!;
  communitySettings.moderators_settings!.changesByModeratorRequireApproval!.value = data;
  await communitySettings.save();

  await CommunityActivityLog.create({
    community: communitySettings.community,
    user: req.userId!,
    logType: 'changedSettings',
    text: `Turned ${communitySettings.moderators_settings!.changesByModeratorRequireApproval!.value ? 'on' : 'off'} "moderator actions require admin approval" setting`
  });

  const additionalReqMessage = 
    communitySettings.moderators_settings!.changesByModeratorRequireApproval!.value
    ? 'Now you will receive notificatons when moderators want to do something they have permision for (remove post, ban users etc)'
    : 'Now you will not be notified about moderator actions. However, you will still be able to see them in community settings logs.';

  const responseJson: CommunitySettingsResponseType = {
    status: 'success',
    message: `Successfully changed should moderator actions require your approval to "${communitySettings.moderators_settings!.changesByModeratorRequireApproval!.value}". ${additionalReqMessage}`,
    updatedSettings: communitySettings.moderators_settings!.changesByModeratorRequireApproval!.value
  };

  const community = req.community!;

  const updatedResponseJson = await CommunitySettingsService.createModeratorNotifictaionsForSettingChanges(
    communitySettings.moderators_settings!.notifyModeratorAboutSettingsChanges!.value,
    community,
    `
      Admin turned ${communitySettings.moderators_settings!.changesByModeratorRequireApproval!.value ? 'on' : 'off'} requied approval for moderator actions for "${community.name}" community. 
      ${
        communitySettings.moderators_settings!.changesByModeratorRequireApproval!.value
        ? 'Now you, as moderator, will not be able to perform your alowed actions directly. For every action, approval request will be sent to admin.'
        : 'Now you will not require admin approval for you actions so they will take place immediatelly.'
      }  
    `,
    responseJson
  );

  return res.status(200).json(updatedResponseJson);
});

export const updateModeratorPermissions = catchAsync (async (
  req: RequestWithCommunitySettingsType,
  res: Response,
  next: NextFunction
) => {
  const { updatedPermissions } = req.body;

  if (
    !updatedPermissions ||
    (updatedPermissions && !Array.isArray(updatedPermissions))
  ) {
    next(new AppError(400, 'Invalid permission data provided. Must be list of permissions'));
    return;
  }

  const communitySettings = req.communitySettings!;
  const community = req.community!;

  if (updatedPermissions.length === 0) {
    communitySettings.moderators_settings!.moderatorPermissions!.value = [];
    await communitySettings.save();
    await CommunitySettingsService.createCommunitySettingsChangedLog(
      communitySettings.community,
      req.userId!,
      'updated modertor permissions. Allowed permissions: none'
    );

    const permissionsNoneRespnseJson: CommunitySettingsResponseType = {
      status: 'success',
      message: 'You have removed all permissions for moderators successfully. Now they have normal member permissions.',
      updatedSettings: []
    };


    const updatedPermissionsNoneResponseJson = await CommunitySettingsService.createModeratorNotifictaionsForSettingChanges(
      communitySettings.moderators_settings!.notifyModeratorAboutSettingsChanges!.value,
      community,
      'Admin disabled all moderator permissions. Now you are only allowed to perform actions for which you are given custom permissions.',
      permissionsNoneRespnseJson
    );

    return res.status(200).json(updatedPermissionsNoneResponseJson);
  }

  let invalidPermissions: string[] = [];
  const allowedPermissionValues = Object.values(COMMUNITY_PERMISSION_NAMES).map((value) => value);

  for (const permission of updatedPermissions) {
    if (!allowedPermissionValues.includes(permission)) {
      invalidPermissions.push(permission);
    }
  }

  if (invalidPermissions.length) {
    next(new AppError(422, `Invalid permissions provided: ${invalidPermissions.join(', ')}`));
    return;
  }

  const hasDuplicateValues = updatedPermissions.filter((permission: any, index: number) => updatedPermissions.indexOf(permission) !== index);
  if (hasDuplicateValues.length) {
    next(new AppError(422, `Dulicate values not allowed: provided for ${hasDuplicateValues.join(', ')}`));
    return;
  }

  communitySettings.moderators_settings!.moderatorPermissions!.value = updatedPermissions;
  await communitySettings.save();

  await CommunitySettingsService.createCommunitySettingsChangedLog(
    communitySettings.community,
    req.userId!,
    `updated modertor permissions. Allowed permissions: ${communitySettings.moderators_settings!.moderatorPermissions!.value.toString()}`
  );

  const responseJosn: CommunitySettingsResponseType = {
    status: 'success',
    message: 'Moderator permissions updated successfully',
    updatedSettings: communitySettings.moderators_settings!.moderatorPermissions!.value
  };

  const updatedResponseJosn = await CommunitySettingsService.createModeratorNotifictaionsForSettingChanges(
    communitySettings.moderators_settings!.notifyModeratorAboutSettingsChanges!.value,
    community,
    `
      Admin updated moderator permissions for "${community.name}" community. New allowed permissions: ${communitySettings.moderators_settings!.moderatorPermissions!.value.toString()}. 
      On top of these you will always be able to perform custom permissions given to you.
    `,
    responseJosn
  );

  return res.status(200).json(updatedResponseJosn);
});

export const updateMembersSinglePostsSetting = catchAsync (async (
  req: RequestWithCommunitySettingsType,
  res: Response,
  next: NextFunction
) => {
  const { settingName, settingValue } = req.body;

  CommunitySettingsValidator.isSingleSettingReqDataValid(
    settingName,
    settingValue,
    ALLOWED_JOINED_MEMBERS_POST_SETTINGS_NAMES
  );

  const communitySettings = req.communitySettings!;

  if (settingName === 'postsDataAllowed') {
    CommunitySettingsValidator.isAllowedPostsDataSettingValueValid(settingValue);

    communitySettings.joined_members_permissions!.posts_settings!.postsDataAllowed!.value = settingValue;
  } else {
    if (typeof settingValue !== 'boolean') {
      next(new AppError(400, 'Invalid data types provided. Setting value can only be "true" or "false"'));
      return;
    }

    if (settingName === 'allowPostComments' && settingValue === false) {
      CommunitySettingsService.setAllPostCommentSettingsToFalseIfCommentsAreNotAllowed(communitySettings);
    }

    if (
      settingName.toLowerCase().includes('comment') && 
      settingName !== 'allowPostComments' &&
      settingValue === true &&
      !communitySettings.joined_members_permissions!.posts_settings!.allowPostComments!.value
    ) {
      next(new AppError(400, `Comments are not allowed and therefore setting "${settingName}" to true will not make any difference. If you want to enable this permission, allow post comments.`));
      return;
    }

    communitySettings.joined_members_permissions!.posts_settings![settingName as keyof PostsSettings]!.value = settingValue;
  }

  await communitySettings.save();

  await CommunitySettingsService.createCommunitySettingsChangedLog(
    communitySettings.community,
    req.userId!,
    'updated members post settings'
  );

  const responseJson: CommunitySettingsResponseType = {
    status: 'success',
    message: 'Community memebrs posts settings updated successfully',
    updatedSettings: communitySettings.joined_members_permissions!.posts_settings
  };

  const community = req.community!;

  const updatedResponseJson = await CommunitySettingsService.createModeratorNotifictaionsForSettingChanges(
    communitySettings.moderators_settings!.notifyModeratorAboutSettingsChanges!.value,
    community,
    `Admin updated members post settings for "${community.name}" community. Go to settings page to see updates.`,
    responseJson
  );

  return res.status(200).json(updatedResponseJson);
});

export const updateMembersAllPostsSettings = catchAsync (async (
  req: RequestWithCommunitySettingsType,
  res: Response,
  next: NextFunction
) => {
  const { updatedSettings } = req.body;

  CommunitySettingsValidator.areAllSettingsReqDataValid(
    updatedSettings,
    ALLOWED_JOINED_MEMBERS_POST_SETTINGS_NAMES,
    'posts'
  );

  const allValuesBoolean = Object.keys(updatedSettings)
    .filter((setting) => setting !== 'postsDataAllowed')
    .every((setting) => typeof updatedSettings[setting] === 'boolean');

  if (!allValuesBoolean) {
    next(new AppError(422, 'Invalid data: all setting values except for "posts data allowed" must be true or false'));
    return;
  }

  CommunitySettingsValidator.isAllowedPostsDataSettingValueValid(updatedSettings.postsDataAllowed);

  const communitySettings = req.communitySettings!;
  const filterSettings = { ...updatedSettings };

  if (updatedSettings.allowPostComments === false) {
    CommunitySettingsService.setAllPostCommentSettingsToFalseIfCommentsAreNotAllowed(communitySettings);
    Object.keys(updatedSettings).forEach((setting) => {
      if (setting.toLowerCase().includes('comment')) {
        delete filterSettings[setting];
      }
    })
  }
  
  for (const setting in filterSettings) {
    communitySettings.joined_members_permissions!.posts_settings![setting as keyof PostsSettings] = { value: updatedSettings[setting] };
  }

  await communitySettings.save();

  await CommunitySettingsService.createCommunitySettingsChangedLog(
    communitySettings.community,
    req.userId!,
    'updated members post settings'
  );

  const responseJson: CommunitySettingsResponseType = {
    status: 'success',
    message: 'Community memebrs posts settings updated successfully',
    updatedSettings: communitySettings.joined_members_permissions!.posts_settings
  };

  const community = req.community!;

  const updatedResponseJson = await CommunitySettingsService.createModeratorNotifictaionsForSettingChanges(
    communitySettings.moderators_settings!.notifyModeratorAboutSettingsChanges!.value,
    community,
    `Admin updated members post settings for "${community.name}" community. Go to settings page to see updates.`,
    responseJson
  );

  return res.status(200).json(updatedResponseJson);
});

export const updateMembersSingleChatsSetting = catchAsync (async (
  req: RequestWithCommunitySettingsType,
  res: Response,
  next: NextFunction
) => {
  const { settingName, settingValue } = req.body;

  CommunitySettingsValidator.isSingleSettingReqDataValid(
    settingName,
    settingValue,
    ALLOWED_JOINED_MEMBERS_CHATS_SETTINGS_NAMES,
    true
  );

  const communitySettings = req.communitySettings!;

  if (
    settingName !== 'allowChats' && 
    settingValue === true &&
    !communitySettings.joined_members_permissions!.chats_settings!.allowChats!.value
  ) {
    next(new AppError(400, `Chats are not allowed, so changing "${settingName}" to true will do nothing. If you want this enabled, allow community chats.`));
    return;
  }

  const allowChatsDisabled = settingName === 'allowChats' && settingValue ===  false;

  if (allowChatsDisabled) {
    CommunitySettingsService.setAllChatSettingsToFalseIfChatsAreNotAllowed(communitySettings);
  } else {
    communitySettings.joined_members_permissions!.chats_settings![settingName as keyof ChatsSettings]!.value = settingValue;
  }

  await communitySettings.save();

  await CommunitySettingsService.createCommunitySettingsChangedLog(
    communitySettings.community,
    req.userId!,
    'updated members chats settings'
  );

  const responseMessage = `
    Chat settings updated successfully. 
    ${allowChatsDisabled ? 'Because you disabled "allow chats" setting, all other chat settings are also disabled.' : ''}
  `;

  const responseJson: CommunitySettingsResponseType = {
    status: 'success',
    message: responseMessage,
    updatedSettings: communitySettings.joined_members_permissions!.chats_settings
  };

  const community = req.community!;

  const updatedResponseJson = await CommunitySettingsService.createModeratorNotifictaionsForSettingChanges(
    communitySettings.moderators_settings!.notifyModeratorAboutSettingsChanges!.value,
    community,
    `Admin updated members chats settings for "${community.name}" community. Go to settings page to see updates.`,
    responseJson
  );

  return res.status(200).json(updatedResponseJson);
});

export const updateMembersAllChatsSettings = catchAsync (async (
  req: RequestWithCommunitySettingsType,
  res: Response,
  _: NextFunction
) => {
  const { updatedSettings } = req.body;

  CommunitySettingsValidator.areAllSettingsReqDataValid(
    updatedSettings,
    ALLOWED_JOINED_MEMBERS_CHATS_SETTINGS_NAMES,
    'chats',
    true
  );

  const communitySettings = req.communitySettings!;

  if (updatedSettings.allowChats === false) {
    CommunitySettingsService.setAllChatSettingsToFalseIfChatsAreNotAllowed(communitySettings);
  } else {
    for (const setting in updatedSettings) {
      communitySettings.joined_members_permissions!.chats_settings![setting as keyof ChatsSettings]!.value = updatedSettings[setting];
    }
  }

  await communitySettings.save();

  await CommunitySettingsService.createCommunitySettingsChangedLog(
    communitySettings.community,
    req.userId!,
    'updated members chats settings'
  );

  const additionalReqMessage =
    !communitySettings.joined_members_permissions!.chats_settings!.allowChats!.value
    ? 'Since you disabled chats all other chat setting will be ignored, so they are also disabled. If you want any of the other settings turned on, enable chats.'
    : '';

  const responseJson: CommunitySettingsResponseType = {
    status: 'success',
    message: `Community members chat settings updated successfully. ${additionalReqMessage}`,
    updatedSettings: communitySettings.joined_members_permissions!.chats_settings
  };

  const community = req.community!;

  const updatedResponseJson = await CommunitySettingsService.createModeratorNotifictaionsForSettingChanges(
    communitySettings.moderators_settings!.notifyModeratorAboutSettingsChanges!.value,
    community,
    `Admin updated members chats settings for "${community.name}" community. Go to settings page to see updates.`,
    responseJson
  );

  return res.status(200).json(updatedResponseJson);
});

export const updateMembersCanViewOtherMembersSetting = catchAsync (async (
  req: RequestWithCommunitySettingsType,
  res: Response,
  next: NextFunction
) => {
  const { canViewMembers } = req.body;
  if (typeof canViewMembers !== 'boolean') {
    next(new AppError(422, 'Value for view member permission can only be true of false'));
    return;
  }

  const communitySettings = req.communitySettings!;
  communitySettings.joined_members_permissions!.can_view_members!.value = canViewMembers;
  await communitySettings.save();

  await CommunitySettingsService.createCommunitySettingsChangedLog(
    communitySettings.community,
    req.userId!,
    `${communitySettings.joined_members_permissions!.can_view_members!.value ? 'enabled' : 'disabled'} viewing of members list by other members`
  );

  const responseJson: CommunitySettingsResponseType = {
    status: 'success',
    message: `${canViewMembers === true ? 'Enabled' : 'Disabled'} non-embers to see member list`,
    updatedSettings: communitySettings.joined_members_permissions!.can_view_members!.value
  };

  const community = req.community!;

  const updatedResponseJson = await CommunitySettingsService.createModeratorNotifictaionsForSettingChanges(
    communitySettings.moderators_settings!.notifyModeratorAboutSettingsChanges!.value,
    community,
    `Admin ${canViewMembers === true ? 'enabled' : 'disabled'} viewing member list for non-members for "${community.name}" community.`,
    responseJson
  );

  return res.status(200).json(updatedResponseJson);
});

export const updateSingleNonMembersPermission = catchAsync (async (
  req: RequestWithCommunitySettingsType,
  res: Response,
  next: NextFunction
) => {
  const { settingName, settingValue } = req.body;

  CommunitySettingsValidator.isSingleSettingReqDataValid(
    settingName,
    settingValue,
    ALLOWED_NON_MEMBERS_PERMISSION_NAMES,
    true
  );

  const communitySettings = req.communitySettings!;

  // disable all other settings if canViewPosts === false
  // reason: everyhing in these settings are post /comment relates
  // if user cannot view posts, other settings must be false
  // otherview it doesn't make sense
  if (settingName === 'canViewPosts' && settingValue ===  false) {
    CommunitySettingsService.setAllNonMemberPostSettingsToFalseIfPostsNotAllowed(communitySettings);
  } else if (settingName === 'canViewComments' && settingValue === false) {
    CommunitySettingsService.setAllNonMemberCommentSettingsToFalseIfCommentsNotAllowed(communitySettings);
  } else if (
    settingName !== 'canViewPosts' &&
    settingValue === true &&
    (settingName.toLowerCase().includes('post') || settingName.toLowerCase().includes('comment')) &&
    !communitySettings.non_members_permissions!.canViewPosts!.value
  ) {
    next(new AppError(400, `Non-members cannnot see posts so setting "${settingName}" to true will be ignored. If you want to enable this, allow post view for non-members.`));
    return;
  } else if (
    settingName !== 'canViewPosts' &&
    settingName !== 'canViewComments' &&
    settingValue === true &&
    settingName.toLowerCase().includes('comment') &&
    !communitySettings.non_members_permissions!.canPostComments!.value
  ) {
    next(new AppError(400, `Non-members cannnot see comments so setting "${settingName}" to true will be ignored. If you want to enable this, allow comment view for non-members.`));
    return;
  } else {
    communitySettings.non_members_permissions![settingName as keyof NonMembersPermissions]!.value = settingValue;
  }

  await communitySettings.save();

  await CommunitySettingsService.createCommunitySettingsChangedLog(
    communitySettings.community,
    req.userId!,
    'updated non-member permissions'
  );

  const responseJson: CommunitySettingsResponseType = {
    status: 'success',
    message: 'Successfully updated non-members permissions',
    updatedSettings: communitySettings.non_members_permissions
  };

  const community = req.community!;

  const updatedResponseJson = await CommunitySettingsService.createModeratorNotifictaionsForSettingChanges(
    communitySettings.moderators_settings!.notifyModeratorAboutSettingsChanges!.value,
    community,
    `Admin updated members non-member permissions for "${community.name}" community. Go to settings page to see updates.`,
    responseJson
  );

  return res.status(200).json(updatedResponseJson);
});

export const updateAllNonMemberPermissions = catchAsync (async (
  req: RequestWithCommunitySettingsType,
  res: Response,
  _: NextFunction
) => {
  const { updatedSettings } = req.body;

  CommunitySettingsValidator.areAllSettingsReqDataValid(
    updatedSettings,
    ALLOWED_NON_MEMBERS_PERMISSION_NAMES,
    'non members',
    true
  );

  const communitySettings = req.communitySettings!;
  const filterSettings = { ...updatedSettings };

  // if posts cannot be viewed, all other post / comment related settings are
  // irrelevant, so they are set to false
  if (updatedSettings.canViewPosts === false) {
    CommunitySettingsService.setAllNonMemberPostSettingsToFalseIfPostsNotAllowed(communitySettings);
    Object.keys(updatedSettings).forEach((setting) => {
      if (setting.toLowerCase().includes('post') || setting.toLowerCase().includes('comment')) {
        delete filterSettings[setting];
      }
    });
  }

  // if comments cannot be viewed, all other comment related settings are
  // irrelevant, so they are set to false
  if (updatedSettings.canViewPosts === true && updatedSettings.canViewComments === false) {
    CommunitySettingsService.setAllNonMemberCommentSettingsToFalseIfCommentsNotAllowed(communitySettings);
    Object.keys(updatedSettings).forEach((setting) => {
      if (setting.toLowerCase().includes('comment')) {
        delete filterSettings[setting];
      }
    });
  }
  
  for (const setting in filterSettings) {
    communitySettings.non_members_permissions!![setting as keyof NonMembersPermissions]!.value = updatedSettings[setting];
  }

  await communitySettings.save();

  await CommunitySettingsService.createCommunitySettingsChangedLog(
    communitySettings.community,
    req.userId!,
    'updated non-member permissions'
  );

  const responseJson: CommunitySettingsResponseType = {
    status: 'success',
    message: 'Successfully updated non-members permissions',
    updatedSettings: communitySettings.non_members_permissions
  };

  const community = req.community!;

  const updatedResponseJson = await CommunitySettingsService.createModeratorNotifictaionsForSettingChanges(
    communitySettings.moderators_settings!.notifyModeratorAboutSettingsChanges!.value,
    community,
    `Admin updated members non-member permissions for "${community.name}" community. Go to settings page to see updates.`,
    responseJson
  );

  return res.status(200).json(updatedResponseJson);
});