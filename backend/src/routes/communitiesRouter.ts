import { Router } from 'express';
import formidable from 'express-formidable';
import isAuth from 'middleware/isAuthMiddleware';
import { createCommunity } from 'controllers/communitiesController';

const router = Router();

router.use(isAuth);

router.post('/', formidable(), createCommunity);

export default router;