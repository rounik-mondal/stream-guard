// src/api/streams.routes.ts
import { Router } from 'express';
import {
  listStreams,
  listLiveStreams,
  listTrendingStreams,
  createStream,
  getStream,
  updateStream,
  deleteStream,
  startStream,
  endStream,
  viewStream,
  leaveStream,
  getStreamerAnalytics,
  likeStream
} from './streams.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// /api/streams and /api/streams/live
router.get('/streams', listStreams);
router.get('/streams/live', listLiveStreams);
router.get('/streams/trending', listTrendingStreams);

// /api/streams (POST)
router.post('/streams', protect, createStream);

// /api/streams/:id (GET, PUT, DELETE)
router.get('/streams/me/analytics', protect, getStreamerAnalytics);
router.get('/streams/:id', getStream);
router.put('/streams/:id', protect, updateStream);
router.delete('/streams/:id', protect, deleteStream);

// /api/streams/:id/start, /end, /like
router.post('/streams/:id/start', protect, startStream);
router.post('/streams/:id/end', protect, endStream);
router.post('/streams/:id/like', protect, likeStream);

// /api/streams/:id/view and /leave
// Note: Your api.ts file points 'leave' to the '/view' endpoint.
// This is unusual. I've created a separate /leave endpoint.
// You should update your api.ts 'leave' to point here:
router.post('/streams/:id/view', protect, viewStream);
router.post('/streams/:id/leave', protect, leaveStream); // Corrected endpoint

export default router;