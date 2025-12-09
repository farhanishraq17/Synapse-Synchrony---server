import express from 'express';
import { HttpResponse } from '../utils/HttpResponse.js';
import {
    ForgotPassword,
  login,
  logout,
  signup,
  VerifyEmail,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/verify-email', VerifyEmail);
router.post('/forgot-password', ForgotPassword);
export default router;
