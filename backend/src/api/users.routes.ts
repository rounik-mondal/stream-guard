// src/api/users.routes.ts
import { Router } from 'express';
import {
  getUserProfile,
  getUserByUsername,
  searchUsers,
  updateMe,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  blockUser,
  unblockUser,
  isFollowing
} from './users.controller';


import { getMe } from './auth.controller'; // Re-use auth 'getMe'
import { protect } from '../middleware/auth.middleware';


const router = Router();

// /api/users/me (GET and PUT)
router.get('/users/me', protect, getMe);
router.put('/users/me', protect, updateMe);

// /api/users/search
router.get('/users/search', protect, searchUsers);

// /api/users/username/:username
router.get('/users/username/:username', protect, getUserByUsername);

// /api/users/:id
router.get('/users/:id', getUserProfile);

// /api/users/:id/follow (POST and DELETE)
router.post('/users/:id/follow', protect, followUser);
router.delete('/users/:id/follow', protect, unfollowUser);

// /api/users/:id/followers and /following
router.get('/users/:id/followers', protect, getFollowers);
router.get('/users/:id/following', protect, getFollowing);

// /api/users/:id/block (POST and DELETE)
router.post('/users/:id/block', protect, blockUser);
router.delete('/users/:id/block', protect, unblockUser);


router.get('/users/:id/is-following', protect, isFollowing);

export default router;