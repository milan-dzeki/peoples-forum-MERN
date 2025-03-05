import { Router } from 'express';
import formidable from 'express-formidable';
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
  havePermissionToPerformAction,
  updateCommunityDescription
);

router.patch(
  '/:communityId/updateProfileImage', 
  doesCommunityExist, 
  formidable(), 
  havePermissionToPerformAction,
  updateCommunityProfileImage
);

router.patch(
  '/:communityId/removeProfileImage', 
  doesCommunityExist,  
  havePermissionToPerformAction,
  removeCommunityProfileImage
);

router.patch(
  '/:communityId/updateBannerImage', 
  doesCommunityExist, 
  formidable(), 
  havePermissionToPerformAction,
  updateCommunityBannerImage
);

router.patch(
  '/:communityId/removeBannerImage', 
  doesCommunityExist, 
  havePermissionToPerformAction,
  removeCommunityBannerImage
);

// COMMUNUTY CRUD --end

// COMMUNITY MEMBER MANAGEMENT --start
router.patch(
  '/:communityId/banUserFromCommunity',
  doesCommunityExist, 
  checkIfTargetUserExist,
  isTargetUserLoggedInUser,
  havePermissionToPerformAction,
  isTargetUserAlreadyInLists,
  banUserFromCommunity
);

router.patch(
  '/:communityId/undoUserCommunityBan',
  doesCommunityExist, 
  checkIfTargetUserExist,
  isTargetUserLoggedInUser,
  havePermissionToPerformAction,
  isTargetUserAlreadyInLists,
  undoBanUserFromCommunity
);

router.patch(
  '/:communityId/inviteToJoinAsMember',
  doesCommunityExist,
  checkIfTargetUserExist,
  havePermissionToPerformAction,
  isTargetUserLoggedInUser,
  isTargetUserAlreadyInLists,
  inviteUserToJoinAsMember
);

router.patch(
  '/:communityId/inviteToJoinAsModerator',
  doesCommunityExist,
  checkIfTargetUserExist,
  isTargetUserAlreadyInLists,
  inviteUserToJoinAsModerator
);

router.patch(
  '/:communityId/withdrawMemberJoinInvite',
  doesCommunityExist, 
  checkIfTargetUserExist,
  isTargetUserLoggedInUser,
  isTargetUserAlreadyInLists,
  havePermissionToPerformAction,
  withdrawCommunityInviteForUser
);

router.patch(
  '/:communityId/withdrawModeratorJoinInvite',
  doesCommunityExist, 
  checkIfTargetUserExist,
  isTargetUserLoggedInUser,
  isTargetUserAlreadyInLists,
  widthrawCommunityModeratorInvite
);

router.patch(
  '/:communityId/acceptUserJoinRequest',
  doesCommunityExist, 
  checkIfTargetUserExist,
  isTargetUserLoggedInUser,
  isTargetUserAlreadyInLists,
  havePermissionToPerformAction,
  moderatorAcceptUserJoinRequest
);

router.patch(
  '/:communityId/declineUserJoinRequest',
  doesCommunityExist, 
  checkIfTargetUserExist,
  isTargetUserLoggedInUser,
  isTargetUserAlreadyInLists,
  havePermissionToPerformAction,
  moderatorDeclineUserJoinRequest,
);

// COMMUNITY MEMBER MANAGEMENT --end

// COMMUNITY USER ACTIONS --start
router.patch(
  '/:communityId/requestToJoin',
  doesCommunityExist,
  isTargetUserAlreadyInLists,
  userRequestCommunityJoin
);

router.patch(
  '/:communityId/userWithdrawRequestToJoin',
  doesCommunityExist,
  isTargetUserAlreadyInLists,
  userWithdrawRequestToJoinCommunity
);

router.patch(
  '/:communityId/userAcceptInviteJoinCommunity/:inviteType',
  doesCommunityExist,
  isTargetUserAlreadyInLists,
  userAcceptJoinCommunityInvite
);

router.patch(
  '/:communityId/userDeclineInviteJoinCommunity/:inviteType',
  doesCommunityExist,
  userDeclineJoinCommunityInvite
);

router.patch(
  '/:communityId/userLeaveCommunity/:communityRole',
  doesCommunityExist,
  userLeaveCommunity
);
// COMMUNITY USER ACTIONS --end

export default router;