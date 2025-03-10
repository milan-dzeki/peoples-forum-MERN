import { Router } from 'express';
import isAuth from 'middleware/isAuthMiddleware';
import { 
  doesCommunityExist, 
  isUserCommunityCreator
} from 'middleware/communityMiddlewares';
import { isModeratorRequestValid, shouldNotifyModerator } from 'middleware/comunityModeratorChangeRequestsMiddlewares';
import { acceptModeratorRequest, declineModeratorRequest } from 'controllers/communityModeratorChangeRequestsController';

const router = Router();

router.use(isAuth);

// router.use(isUserCommunityCreator, isModeratorRequestValid, shouldNotifyModerator);

router.post(
  '/:communityId/decline/:requestId',
  doesCommunityExist,
  isUserCommunityCreator,
  isModeratorRequestValid,
  shouldNotifyModerator,
  declineModeratorRequest
);

router.post(
  '/:communityId/accept/:requestId',
  doesCommunityExist,
  isUserCommunityCreator,
  isModeratorRequestValid,
  shouldNotifyModerator,
  acceptModeratorRequest
);

export default router;