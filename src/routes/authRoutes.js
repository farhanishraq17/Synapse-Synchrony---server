import express from 'express';
import { HttpResponse } from '../utils/HttpResponse.js';
import {
  ForgotPassword,
  login,
  logout,
  ResetPassword,
  signup,
  VerifyEmail,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/verify-email', VerifyEmail);
router.post('/forgot-password', ForgotPassword);
router.post('/reset-password/:token', ResetPassword);
export default router;
