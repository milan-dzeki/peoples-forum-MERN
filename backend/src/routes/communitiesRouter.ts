import { Router } from 'express';
import formidable from 'express-formidable';
import isAuth from 'middleware/isAuthMiddleware';
import { 
  createCommunity, 
  deleteCommunity, 
  updateCommunityProfileImage,
  removeCommunityProfileImage,
  updateCommunityBannerImage,
  removeCommunityBannerImage 
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
  formidable(), 
  removeCommunityBannerImage
);

export default router;