// src/api/admin.routes.ts
import { Router } from 'express';
import { getDashboardStats, banUser } from './admin.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.get('/admin/dashboard', protect, getDashboardStats);
router.post('/admin/ban/:id', protect, banUser);

export default router;
