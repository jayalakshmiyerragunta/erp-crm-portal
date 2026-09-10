import { Router } from 'express';
import * as authController from './auth.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// POST /auth/login
router.post('/login', authController.login);

// GET /auth/me — protected
router.get('/me', authenticate, authController.me);

export default router;
