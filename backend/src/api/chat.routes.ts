// src/api/chat.routes.ts
import { Router } from 'express';
import {
  handleAnalyze,
  getMessages,
  sendMessage,
  deleteMessage,
  reportMessage,
  getChatStats,
} from './chat.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All chat routes should be protected
router.use(protect);

router.post('/chat/analyze', handleAnalyze);
router.post('/chat/send', sendMessage);
router.get('/chat/stats/filter', getChatStats);

router.get('/chat/:streamId/messages', getMessages);

router.delete('/chat/:messageId', deleteMessage);
router.post('/chat/:messageId/report', reportMessage);

export default router;