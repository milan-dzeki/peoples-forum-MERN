import { Router } from 'express';
import formidable from 'express-formidable';
import isAuth from 'middleware/isAuthMiddleware';
import { doesCommunityExist, isLoggedUserCommunityCreatorOrModerator } from 'middleware/communityMiddlewares';
import {
  communityCRUD,
  communityMembersManagement
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
  inviteUserToJoinCommunity,
  moderatorWithdrawJoinCommunityInviteForUser,
  userAcceptJoinCommunityInvite,
  userDeclineJoinCommunityInvite,
  userLeaveCommunity
} = communityMembersManagement

const router = Router();

router.use(isAuth);

router.post('/', formidable(), createCommunity);

router.delete(
  '/:communityId',
  doesCommunityExist, 
  isLoggedUserCommunityCreatorOrModerator,  
  deleteCommunity
);

router.patch(
  '/:communityId/updateDescription',
  doesCommunityExist, 
  isLoggedUserCommunityCreatorOrModerator, 
  updateCommunityDescription
);

router.patch(
  '/:communityId/updateProfileImage', 
  doesCommunityExist, 
  isLoggedUserCommunityCreatorOrModerator, 
  formidable(), 
  updateCommunityProfileImage
);

router.patch(
  '/:communityId/removeProfileImage', 
  doesCommunityExist, 
  isLoggedUserCommunityCreatorOrModerator, 
  formidable(), 
  removeCommunityProfileImage
);

router.patch(
  '/:communityId/updateBannerImage', 
  doesCommunityExist, 
  isLoggedUserCommunityCreatorOrModerator, 
  formidable(), 
  updateCommunityBannerImage
);

router.patch(
  '/:communityId/removeBannerImage', 
  doesCommunityExist, 
  isLoggedUserCommunityCreatorOrModerator,
  removeCommunityBannerImage
);

router.patch(
  '/:communityId/banUserFromCommunity',
  doesCommunityExist, 
  isLoggedUserCommunityCreatorOrModerator,
  banUserFromCommunity
);

router.patch(
  '/:communityId/undoUserCommunityBan',
  doesCommunityExist, 
  isLoggedUserCommunityCreatorOrModerator,
  undoBanUserFromCommunity
);

router.patch(
  '/:communityId/invite',
  doesCommunityExist, 
  isLoggedUserCommunityCreatorOrModerator,
  inviteUserToJoinCommunity
);

router.patch(
  '/:communityId/moderatorWidthrawJoinInviteForUser',
  doesCommunityExist, 
  isLoggedUserCommunityCreatorOrModerator,
  moderatorWithdrawJoinCommunityInviteForUser
);

router.patch(
  '/:communityId/userAcceptInviteJoinCommunity/:inviteType',
  doesCommunityExist,
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

export default router;