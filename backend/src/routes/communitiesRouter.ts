import { Router } from 'express';
import formidable from 'express-formidable';
import isAuth from 'middleware/isAuthMiddleware';
import { 
  createCommunity, 
  updateCommunityDescription,
  deleteCommunity, 
  updateCommunityProfileImage,
  removeCommunityProfileImage,
  updateCommunityBannerImage,
  removeCommunityBannerImage, 
  banUserFromCommunity,
  undoBanUserFromCommunity,
  inviteUserToJoinCommunity,
  moderatorWithdrawJoinCommunityInviteForUser
} from 'controllers/communityController';
import { doesCommunityExist, isLoggedUserCommunityCreatorOrModerator } from 'middleware/communityMiddlewares';

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

export default router;