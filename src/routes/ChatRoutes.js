import express from 'express';
import { HttpResponse } from '../utils/HttpResponse.js';

import { VerifyToken } from '../middlewares/VeriyToken.js';
import {
  CreateChat,
  GetSingleChat,
  GetUserChats,
} from '../controllers/ChatController.js';

const router = express.Router();

router.post('/create-chat', VerifyToken, CreateChat);
router.get('/get-user-chats', VerifyToken, GetUserChats);
router.get('/get-single-chat/:id', VerifyToken, GetSingleChat);

export default router;
