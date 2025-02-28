import { Router } from 'express';
import formidable from 'express-formidable';
import { signup } from 'controllers/auth.controller';

const router = Router();

router.post('/signup', formidable(), signup);

export default router;