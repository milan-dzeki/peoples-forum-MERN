import { Router } from 'express';
import formidable from 'express-formidable';
import { signup, login } from 'controllers/auth.controller';

const router = Router();

router.post('/signup', formidable(), signup);
router.post('/login', login);

export default router;