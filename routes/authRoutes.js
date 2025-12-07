import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  refreshToken,
  logout,
  sendOTP,
  verifyOTP,
  googleAuthCallback,
  getCurrentUser,
} from '../controllers/authController.js';
import { validateRequest } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';
import passport from 'passport';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register new user with email and password
 * @access  Public
 */
router.post(
  '/register',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage('Name must be at least 2 characters long'),
    body('phoneNumber')
      .optional()
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Please provide a valid phone number in E.164 format'),
  ],
  validateRequest,
  register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login with email and password
 * @access  Public
 */
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
  validateRequest,
  login
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public (requires valid refresh token in cookie)
 */
router.post('/refresh', refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and clear refresh token
 * @access  Private
 */
router.post('/logout', logout);

/**
 * @route   POST /api/auth/otp/send
 * @desc    Send OTP to phone number
 * @access  Public
 */
router.post(
  '/otp/send',
  [
    body('phoneNumber')
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Please provide a valid phone number in E.164 format'),
  ],
  validateRequest,
  sendOTP
);

/**
 * @route   POST /api/auth/otp/verify
 * @desc    Verify OTP and login/register
 * @access  Public
 */
router.post(
  '/otp/verify',
  [
    body('phoneNumber')
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Please provide a valid phone number in E.164 format'),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('OTP must be a 6-digit number'),
  ],
  validateRequest,
  verifyOTP
);

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth login
 * @access  Public
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    session: false,
  }),
  googleAuthCallback
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, getCurrentUser);

export default router;
