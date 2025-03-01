import { Router } from 'express';
import formidable from 'express-formidable';
import { signup, login } from 'controllers/auth.controller';
import isAuth from 'middleware/isAuth.middleware';

const router = Router();

router.post('/signup', formidable(), signup);
router.post('/login', isAuth, login);

export default router;