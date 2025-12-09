import express from 'express';
import { HttpResponse } from '../utils/HttpResponse.js';
import {
  CheckAuth,
  ForgotPassword,
  login,
  logout,
  ResetPassword,
  signup,
  VerifyEmail,
} from '../controllers/authController.js';
import { VerifyToken } from '../middlewares/VeriyToken.js';

const router = express.Router();
router.get('/check-auth', VerifyToken, CheckAuth);
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/verify-email', VerifyEmail);
router.post('/forgot-password', ForgotPassword);
router.post('/reset-password/:token', ResetPassword);
export default router;
