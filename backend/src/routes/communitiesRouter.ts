import { Router } from 'express';
import formidable from 'express-formidable';
import { COMMUNITY_PERMISSION_NAMES } from 'configs/community';
import isAuth from 'middleware/isAuthMiddleware';
import { doesCommunityExist, checkIfTargetUserExist, isTargetUserLoggedInUser, havePermissionToPerformAction, isTargetUserAlreadyInLists } from 'middleware/communityMiddlewares';
import {
  communityCRUD,
  communityMembersManagement,
  communityUserActions
} from 'controllers/community';

const {
  createCommunity,
  deleteCommunity,
  updateCommunityDescription,
  addNewCommunityRule,
  updateSingleCommunityRule,
  updateCommunityRules,
  deleteSingleCommunityRule,
  deleteMultipleCommunityRules,
  deleteAllCommunityRules,
  updateCommunityProfileImage,
  removeCommunityProfileImage,
  updateCommunityBannerImage,
  removeCommunityBannerImage
} = communityCRUD;

const {
  banUserFromCommunity,
  undoBanUserFromCommunity,
  inviteUserToJoinAsMember,
  inviteUserToJoinAsModerator,
  withdrawCommunityInviteForUser,
  widthrawCommunityModeratorInvite,
  moderatorAcceptUserJoinRequest,
  moderatorDeclineUserJoinRequest
} = communityMembersManagement;

const {
  userAcceptJoinCommunityInvite,
  userDeclineJoinCommunityInvite,
  userLeaveCommunity,
  userRequestCommunityJoin,
  userWithdrawRequestToJoinCommunity,
} = communityUserActions;

const router = Router();

router.use(isAuth);

// COMMUNUTY CRUD --start
router.post('/', formidable(), createCommunity);

router.use(doesCommunityExist);

router.delete(
  '/:communityId', 
  deleteCommunity
);

router.patch(
  '/:communityId/updateDescription',
  havePermissionToPerformAction(COMMUNITY_PERMISSION_NAMES.UPDATE_DESCRIPTION),
  updateCommunityDescription
);

router.patch(
  '/:communityId/updateProfileImage', 
  formidable(), 
  havePermissionToPerformAction(COMMUNITY_PERMISSION_NAMES.UPDATE_PROFILE_PHOTO),
  updateCommunityProfileImage
);

router.patch(
  '/:communityId/removeProfileImage', 
  havePermissionToPerformAction(COMMUNITY_PERMISSION_NAMES.REMOVE_PROFILE_PHOTOO),
  removeCommunityProfileImage
);

router.patch(
  '/:communityId/updateBannerImage',
  formidable(), 
  havePermissionToPerformAction(COMMUNITY_PERMISSION_NAMES.UPDATE_BANNER_PHOTO),
  updateCommunityBannerImage
);

router.patch(
  '/:communityId/removeBannerImage', 
  havePermissionToPerformAction(COMMUNITY_PERMISSION_NAMES.REMOVE_BANNER_PHOTO),
  removeCommunityBannerImage
);

// community rules --start
router.post(
  '/:communityId/addNewRule',
  havePermissionToPerformAction(COMMUNITY_PERMISSION_NAMES.UPDATE_RULES),
  addNewCommunityRule
);

router.patch(
  '/:communityId/updateSingleRule/',
  havePermissionToPerformAction(COMMUNITY_PERMISSION_NAMES.UPDATE_RULES),
  updateSingleCommunityRule
);

router.put(
  '/:communityId/updateRules',
  havePermissionToPerformAction(COMMUNITY_PERMISSION_NAMES.UPDATE_RULES),
  updateCommunityRules
);

router.patch(
  '/:communityId/deleteSingleRule/:ruleId',
  havePermissionToPerformAction(COMMUNITY_PERMISSION_NAMES.UPDATE_RULES),
  deleteSingleCommunityRule
);

router.patch(
  '/:communityId/deleteMultipleRules',
  havePermissionToPerformAction(COMMUNITY_PERMISSION_NAMES.UPDATE_RULES),
  deleteMultipleCommunityRules
);

router.patch(
  '/:communityId/deleteAllRules',
  havePermissionToPerformAction(COMMUNITY_PERMISSION_NAMES.UPDATE_RULES),
  deleteAllCommunityRules
);
// community rules --end

// COMMUNUTY CRUD --end

// COMMUNITY MEMBER MANAGEMENT --start
router.patch(
  '/:communityId/banUserFromCommunity',
  checkIfTargetUserExist,
  isTargetUserLoggedInUser,
  havePermissionToPerformAction(COMMUNITY_PERMISSION_NAMES.BAN_USERS),
  isTargetUserAlreadyInLists,
  banUserFromCommunity
);

router.patch(
  '/:communityId/undoUserCommunityBan',
  checkIfTargetUserExist,
  isTargetUserLoggedInUser,
  havePermissionToPerformAction(COMMUNITY_PERMISSION_NAMES.UNDO_BAN_USERS),
  isTargetUserAlreadyInLists,
  undoBanUserFromCommunity
);

router.patch(
  '/:communityId/inviteToJoinAsMember',
  checkIfTargetUserExist,
  havePermissionToPerformAction(COMMUNITY_PERMISSION_NAMES.INVITE_USERS_AS_MEMBERS),
  isTargetUserLoggedInUser,
  isTargetUserAlreadyInLists,
  inviteUserToJoinAsMember
);

router.patch(
  '/:communityId/inviteToJoinAsModerator',
  checkIfTargetUserExist,
  isTargetUserAlreadyInLists,
  inviteUserToJoinAsModerator
);

router.patch(
  '/:communityId/withdrawMemberJoinInvite',
  checkIfTargetUserExist,
  isTargetUserLoggedInUser,
  isTargetUserAlreadyInLists,
  havePermissionToPerformAction(COMMUNITY_PERMISSION_NAMES.WITHDRAW_INVITE_USERS_AS_MEMBERS),
  withdrawCommunityInviteForUser
);

router.patch(
  '/:communityId/withdrawModeratorJoinInvite',
  checkIfTargetUserExist,
  isTargetUserLoggedInUser,
  isTargetUserAlreadyInLists,
  widthrawCommunityModeratorInvite
);

router.patch(
  '/:communityId/acceptUserJoinRequest',
  checkIfTargetUserExist,
  isTargetUserLoggedInUser,
  isTargetUserAlreadyInLists,
  havePermissionToPerformAction(COMMUNITY_PERMISSION_NAMES.ACCEPT_JOIN_REQUESTS),
  moderatorAcceptUserJoinRequest
);

router.patch(
  '/:communityId/declineUserJoinRequest',
  checkIfTargetUserExist,
  isTargetUserLoggedInUser,
  isTargetUserAlreadyInLists,
  havePermissionToPerformAction(COMMUNITY_PERMISSION_NAMES.DECLINE_JOIN_REQUESTS),
  moderatorDeclineUserJoinRequest,
);

// COMMUNITY MEMBER MANAGEMENT --end

// COMMUNITY USER ACTIONS --start
router.patch(
  '/:communityId/requestToJoin',
  isTargetUserAlreadyInLists,
  userRequestCommunityJoin
);

router.patch(
  '/:communityId/userWithdrawRequestToJoin',
  isTargetUserAlreadyInLists,
  userWithdrawRequestToJoinCommunity
);

router.patch(
  '/:communityId/userAcceptInviteJoinCommunity/:inviteType',
  isTargetUserAlreadyInLists,
  userAcceptJoinCommunityInvite
);

router.patch(
  '/:communityId/userDeclineInviteJoinCommunity/:inviteType',
  userDeclineJoinCommunityInvite
);

router.patch(
  '/:communityId/userLeaveCommunity/:communityRole',
  userLeaveCommunity
);
// COMMUNITY USER ACTIONS --end

export default router;