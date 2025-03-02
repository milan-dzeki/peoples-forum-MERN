import { Router } from 'express';
import formidable from 'express-formidable';
import isAuth from 'middleware/isAuthMiddleware';
import { createCommunity, deleteCommunity, removeCommunityProfileImage, updateCommunityProfileImage } from 'controllers/communityController';
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

export default router;