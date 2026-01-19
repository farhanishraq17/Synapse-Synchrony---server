import express from 'express';
import { HttpResponse } from '../utils/HttpResponse.js';
import {
  CheckAuth,
  ForgotPassword,
  login,
  logout,
  ResetPassword,
  signup,
  SyncUsersToStream,
  VerifyEmail,
} from '../controllers/authController.js';
import { VerifyToken } from '../middlewares/VeriyToken.js';

const router = express.Router();
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/verify-email', VerifyEmail);
router.post('/forgot-password', ForgotPassword);
router.post('/reset-password/:token', ResetPassword);
router.get('/check-auth', VerifyToken, CheckAuth);

// ✅ NEW: One-time sync endpoint (protect with auth if needed)
router.post('/sync-stream-users', VerifyToken, SyncUsersToStream);
export default router;
