// src/api/auth.routes.ts
import { Router } from 'express';
import {
  register,
  login,
  getMe,
  guest,
  refreshToken,
  logout,
} from './auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/guest', guest);
router.get('/auth/me', protect, getMe);
router.post('/auth/refresh', refreshToken);
router.post('/auth/logout', protect, logout);

export default router;