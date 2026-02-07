import express from 'express';
import multer from 'multer';

import { VerifyToken } from '../middlewares/VeriyToken.js';
import {
  CreateChat,
  GetSingleChat,
  getStreamToken,
  GetUserChats,
} from '../controllers/ChatController.js';
import { CreateMessage, CreateVoiceMessage, CreateLocationMessage, GetOrCreateAIChat, SendAIMessage } from '../controllers/MessageController.js';

const router = express.Router();

// Configure multer for audio file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/') || file.mimetype === 'video/webm') {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  },
});

router.post('/create-chat', VerifyToken, CreateChat);
router.post('/create-message', VerifyToken, CreateMessage);
router.post('/create-voice-message', VerifyToken, upload.single('audio'), CreateVoiceMessage);
router.post('/create-location-message', VerifyToken, CreateLocationMessage);
router.get('/get-user-chats', VerifyToken, GetUserChats);
router.get('/get-single-chat/:id', VerifyToken, GetSingleChat);
router.get('/token', VerifyToken, getStreamToken);

// ✅ NEW: AI Chat routes
router.post('/send-ai-message', VerifyToken, SendAIMessage);
router.get('/ai-chat', VerifyToken, GetOrCreateAIChat);

export default router;

