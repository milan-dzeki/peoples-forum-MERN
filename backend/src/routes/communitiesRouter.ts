import { Router } from 'express';
import formidable from 'express-formidable';
import { COMMUNITY_PERMISSION_NAMES } from 'configs/community/community';
import isAuth from 'middleware/isAuthMiddleware';
import { 
  doesCommunityExist, 
  checkIfTargetUserExist, 
  isTargetUserLoggedInUser, 
  havePermissionToPerformAction, 
  isTargetUserAlreadyInLists, 
  isRequestUserAlreadyInLists, 
  changesByModeratorRequireAdminApproval ,
  isTargetUserInTargetList,
  isNotInRequiredList
} from 'middleware/communityMiddlewares';
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

router.delete(
  '/:communityId',
  doesCommunityExist,  
  deleteCommunity
);

router.patch(
  '/:communityId/updateDescription',
  doesCommunityExist, 
  havePermissionToPerformAction(COMMUNITY_PERMISSION_NAMES.UPDATE_DESCRIPTION),
  changesByModeratorRequireAdminApproval,
  updateCommunityDescription
);

router.patch(
  '/:communityId/updateProfileImage', 
  doesCommunityExist, 
  formidable(), 
  havePermissionToPerformAction(COMMUNITY_PERMISSION_NAMES.UPDATE_PROFILE_PHOTO),
  changesByModeratorRequireAdminApproval,
  updateCommunityProfileImage
);

router.patch(
  '/:communityId/removeProfileImage', 
  doesCommunityExist,  
  havePermissionToPerformAction(COMMUNITY_PERMISSION_NAMES.REMOVE_PROFILE_PHOTO),
  changesByModeratorRequireAdminApproval,
  removeCommunityProfileImage
);

router.patch(
  '/:communityId/updateBannerImage', 
  doesCommunityExist, 
  formidable(), 
  havePermissionToPerformAction(COMMUNITY_PERMISSION_NAMES.UPDATE_BANNER_PHOTO),
  changesByModeratorRequireAdminApproval,
  updateCommunityBannerImage
);

router.patch(
  '/:communityId/removeBannerImage', 
  doesCommunityExist, 
  havePermissionToPerformAction(COMMUNITY_PERMISSION_NAMES.REMOVE_BANNER_PHOTO),
  changesByModeratorRequireAdminApproval,
  removeCommunityBannerImage
);

// community rules --start
router.post(
  '/:communityId/addNewRule',
  doesCommunityExist,
  havePermissionToPerformAction(COMMUNITY_PERMISSION_NAMES.UPDATE_RULES),
  changesByModeratorRequireAdminApproval,
  addNewCommunityRule
);

router.patch(
  '/:communityId/updateSingleRule/',
  doesCommunityExist, 
  havePermissionToPerformAction(COMMUNITY_PERMISSION_NAMES.UPDATE_RULES),
  changesByModeratorRequireAdminApproval,
  updateSingleCommunityRule
);

router.put(
  '/:communityId/updateRules',
  doesCommunityExist, 
  havePermissionToPerformAction(COMMUNITY_PERMISSION_NAMES.UPDATE_RULES),
  changesByModeratorRequireAdminApproval,
  updateCommunityRules
);

router.patch(
  '/:communityId/deleteSingleRule/:ruleId',
  doesCommunityExist, 
  havePermissionToPerformAction(COMMUNITY_PERMISSION_NAMES.UPDATE_RULES),
  changesByModeratorRequireAdminApproval,
  deleteSingleCommunityRule
);

router.patch(
  '/:communityId/deleteMultipleRules',
  doesCommunityExist,
  havePermissionToPerformAction(COMMUNITY_PERMISSION_NAMES.UPDATE_RULES),
  changesByModeratorRequireAdminApproval,
  deleteMultipleCommunityRules
);

router.patch(
  '/:communityId/deleteAllRules',
  doesCommunityExist,
  havePermissionToPerformAction(COMMUNITY_PERMISSION_NAMES.UPDATE_RULES),
  changesByModeratorRequireAdminApproval,
  deleteAllCommunityRules
);
// community rules --end

// COMMUNUTY CRUD --end

// COMMUNITY MEMBER MANAGEMENT --start
router.patch(
  '/:communityId/banUserFromCommunity',
  doesCommunityExist, 
  checkIfTargetUserExist,
  isTargetUserLoggedInUser,
  havePermissionToPerformAction(COMMUNITY_PERMISSION_NAMES.BAN_USERS),
  isTargetUserInTargetList('bannedUsers'),
  isTargetUserAlreadyInLists,
  changesByModeratorRequireAdminApproval,
  banUserFromCommunity
);

router.patch(
  '/:communityId/undoUserCommunityBan',
  doesCommunityExist, 
  checkIfTargetUserExist,
  isTargetUserLoggedInUser,
  havePermissionToPerformAction(COMMUNITY_PERMISSION_NAMES.UNDO_BAN_USERS),
  isTargetUserAlreadyInLists,
  undoBanUserFromCommunity
);

router.patch(
  '/:communityId/inviteToJoinAsMember',
  doesCommunityExist,
  checkIfTargetUserExist,
  havePermissionToPerformAction(COMMUNITY_PERMISSION_NAMES.INVITE_USERS_AS_MEMBERS),
  isTargetUserLoggedInUser,
  isTargetUserInTargetList('pendingInvitedUsers'),
  isTargetUserAlreadyInLists,
  inviteUserToJoinAsMember
);

router.patch(
  '/:communityId/inviteToJoinAsModerator',
  doesCommunityExist,
  checkIfTargetUserExist,
  havePermissionToPerformAction(COMMUNITY_PERMISSION_NAMES.INVITE_USERS_AS_MODERATORS, true),
  isTargetUserAlreadyInLists,
  inviteUserToJoinAsModerator
);

router.patch(
  '/:communityId/withdrawMemberJoinInvite',
  doesCommunityExist, 
  checkIfTargetUserExist,
  isTargetUserLoggedInUser,
  isTargetUserAlreadyInLists,
  havePermissionToPerformAction(COMMUNITY_PERMISSION_NAMES.WITHDRAW_INVITE_USERS_AS_MEMBERS),
  isNotInRequiredList('pendingInvitedUsers'),
  withdrawCommunityInviteForUser
);

router.patch(
  '/:communityId/withdrawModeratorJoinInvite',
  doesCommunityExist, 
  checkIfTargetUserExist,
  isTargetUserLoggedInUser,
  isTargetUserAlreadyInLists,
  havePermissionToPerformAction(COMMUNITY_PERMISSION_NAMES.WITHDRAW_INVITE_USERS_AS_MODERATORS, true),
  widthrawCommunityModeratorInvite
);

router.patch(
  '/:communityId/acceptUserJoinRequest',
  doesCommunityExist, 
  checkIfTargetUserExist,
  isTargetUserLoggedInUser,
  havePermissionToPerformAction(COMMUNITY_PERMISSION_NAMES.ACCEPT_JOIN_REQUESTS),
  isNotInRequiredList('userJoinRequests'),
  isTargetUserAlreadyInLists,
  moderatorAcceptUserJoinRequest
);

router.patch(
  '/:communityId/declineUserJoinRequest',
  doesCommunityExist, 
  checkIfTargetUserExist,
  isTargetUserLoggedInUser,
  havePermissionToPerformAction(COMMUNITY_PERMISSION_NAMES.DECLINE_JOIN_REQUESTS),
  isNotInRequiredList('userJoinRequests'),
  isTargetUserAlreadyInLists,
  moderatorDeclineUserJoinRequest,
);

// COMMUNITY MEMBER MANAGEMENT --end

// COMMUNITY USER ACTIONS --start
router.patch(
  '/:communityId/requestToJoin',
  doesCommunityExist,
  isRequestUserAlreadyInLists,
  userRequestCommunityJoin
);

router.patch(
  '/:communityId/userWithdrawRequestToJoin',
  doesCommunityExist,
  isRequestUserAlreadyInLists,
  userWithdrawRequestToJoinCommunity
);

router.patch(
  '/:communityId/userAcceptInviteJoinCommunity/:inviteType',
  doesCommunityExist,
  isRequestUserAlreadyInLists,
  userAcceptJoinCommunityInvite
);

router.patch(
  '/:communityId/userDeclineInviteJoinCommunity/:inviteType',
  doesCommunityExist,
  isRequestUserAlreadyInLists,
  userDeclineJoinCommunityInvite
);

router.patch(
  '/:communityId/userLeaveCommunity/:communityRole',
  doesCommunityExist,
  userLeaveCommunity
);
// COMMUNITY USER ACTIONS --end

export default router;