import { Router } from 'express';
import isAuth from 'middleware/isAuthMiddleware';
import { doesCommunityExistAndIsUserCreator, doesCommunitySettingExist } from 'middleware/communitySettingsMiddleware';
import {
  getCommunitySettings,
  updateCommunityAccess,
  updateChangesByModeratorRequireCreatorApproval,
  updateModeratorPermissions,
  updateNotifyModeratorsForSettingChangesSetting,
  updateMembersSinglePostsSetting,
  updateMembersAllPostsSettings,
  updateMembersSingleChatsSetting,
  updateMembersAllChatsSettings,
  updateMembersCanViewOtherMembersSetting,
  updateSingleNonMembersPermission,
  updateAllNonMemberPermissions
} from 'controllers/communitySettingsController';

const router = Router();

router.use(isAuth);

router.get(
  '/:communityId',
  doesCommunityExistAndIsUserCreator,
  doesCommunitySettingExist,
  getCommunitySettings
);

router.post(
  '/:communityId/updateAccess',
  doesCommunityExistAndIsUserCreator,
  doesCommunitySettingExist,
  updateCommunityAccess
);

router.post(
  '/:communityId/updateModeratorActionsRequireApproval',
  doesCommunityExistAndIsUserCreator,
  doesCommunitySettingExist,
  updateChangesByModeratorRequireCreatorApproval
);

router.patch(
  '/:communityId/updateModeratorPermissions',
  doesCommunityExistAndIsUserCreator,
  doesCommunitySettingExist,
  updateModeratorPermissions
);

router.post(
  '/:communityId/updateNotifyModeratorForSettingsChanges',
  doesCommunityExistAndIsUserCreator,
  doesCommunitySettingExist,
  updateNotifyModeratorsForSettingChangesSetting
);

router.patch(
  '/:communityId/updateSinglePostsSetting',
  doesCommunityExistAndIsUserCreator,
  doesCommunitySettingExist,
  updateMembersSinglePostsSetting
);

router.post(
  '/:communityId/updateAllPostsSettings',
  doesCommunityExistAndIsUserCreator,
  doesCommunitySettingExist,
  updateMembersAllPostsSettings
);

router.patch(
  '/:communityId/updateSingleChatsSetting',
  doesCommunityExistAndIsUserCreator,
  doesCommunitySettingExist,
  updateMembersSingleChatsSetting
);

router.post(
  '/:communityId/updateAllChatsSettings',
  doesCommunityExistAndIsUserCreator,
  doesCommunitySettingExist,
  updateMembersAllChatsSettings
);

router.post(
  '/:communityId/updateCanMemberViewMemberListSettng',
  doesCommunityExistAndIsUserCreator,
  doesCommunitySettingExist,
  updateMembersCanViewOtherMembersSetting
);

router.patch(
  '/:communityId/updateSingleNonMembersPermission',
  doesCommunityExistAndIsUserCreator,
  doesCommunitySettingExist,
  updateSingleNonMembersPermission
);

router.post(
  '/:communityId/updateAllNonMembersPermissions',
  doesCommunityExistAndIsUserCreator,
  doesCommunitySettingExist,
  updateAllNonMemberPermissions
);

export default router;