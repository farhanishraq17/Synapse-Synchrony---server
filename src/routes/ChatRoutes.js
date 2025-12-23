import express from 'express';

import { VerifyToken } from '../middlewares/VeriyToken.js';
import {
  CreateChat,
  GetSingleChat,
  getStreamToken,
  GetUserChats,
} from '../controllers/ChatController.js';
import { CreateMessage } from '../controllers/MessageController.js';

const router = express.Router();

router.post('/create-chat', VerifyToken, CreateChat);
router.post('/create-message', VerifyToken, CreateMessage);
router.get('/get-user-chats', VerifyToken, GetUserChats);
router.get('/get-single-chat/:id', VerifyToken, GetSingleChat);
router.get('/token', VerifyToken, getStreamToken);

// ✅ NEW: AI Chat routes
router.post('/send-ai-message', VerifyToken, SendAIMessage);
router.get('/ai-chat', VerifyToken, GetOrCreateAIChat);

export default router;
