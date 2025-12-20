import express from 'express';
import * as searchController from '../controllers/searchController.js';
import { authenticate } from '../middleware/auth.js';
import { query, param } from 'express-validator';
import { validateRequest } from '../middleware/validation.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Apply rate limiting to search endpoints
router.use(apiRateLimiter);

/**
 * @route   GET /api/search/users?q=searchTerm&limit=20
 * @desc    Search users by name or email
 * @access  Private
 */
router.get(
  '/users',
  [
    query('q')
      .notEmpty()
      .withMessage('Search query is required')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Search query must be between 2 and 50 characters'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('limit must be between 1 and 20'),
  ],
  validateRequest,
  searchController.searchUsers
);

/**
 * @route   GET /api/search/users/:userId
 * @desc    Get user by ID
 * @access  Private
 */
router.get(
  '/users/:userId',
  [
    param('userId')
      .isMongoId()
      .withMessage('Invalid user ID'),
  ],
  validateRequest,
  searchController.getUserById
);

/**
 * @route   GET /api/search/conversations?q=searchTerm&limit=20
 * @desc    Search conversations by name or participants
 * @access  Private
 */
router.get(
  '/conversations',
  [
    query('q')
      .notEmpty()
      .withMessage('Search query is required')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Search query must be between 1 and 50 characters'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('limit must be between 1 and 50'),
  ],
  validateRequest,
  searchController.searchConversations
);

/**
 * @route   GET /api/search/recent
 * @desc    Get recent conversations
 * @access  Private
 */
router.get(
  '/recent',
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('limit must be between 1 and 10'),
  ],
  validateRequest,
  searchController.getRecentConversations
);

/**
 * @route   GET /api/search/suggestions
 * @desc    Get suggested users (users in same conversations)
 * @access  Private
 */
router.get(
  '/suggestions',
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('limit must be between 1 and 20'),
  ],
  validateRequest,
  searchController.getSuggestedUsers
);

export default router;
