import express from 'express';
import * as conversationController from '../controllers/conversationController.js';
import { authenticate } from '../middleware/auth.js';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/conversations/direct
 * @desc    Create or get existing direct conversation
 * @access  Private
 */
router.post(
  '/direct',
  [
    body('participantId')
      .notEmpty()
      .withMessage('participantId is required')
      .isMongoId()
      .withMessage('Invalid participantId format'),
  ],
  validateRequest,
  conversationController.createDirectConversation
);

/**
 * @route   POST /api/conversations/group
 * @desc    Create group conversation
 * @access  Private
 */
router.post(
  '/group',
  [
    body('name')
      .notEmpty()
      .withMessage('Group name is required')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Group name must be between 1 and 100 characters'),
    body('participantIds')
      .isArray({ min: 1 })
      .withMessage('participantIds must be an array with at least one participant'),
    body('participantIds.*')
      .isMongoId()
      .withMessage('Each participantId must be a valid MongoDB ID'),
  ],
  validateRequest,
  conversationController.createGroupConversation
);

/**
 * @route   GET /api/conversations
 * @desc    Get user's conversations with pagination
 * @access  Private
 */
router.get(
  '/',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('limit must be between 1 and 100'),
    query('sortBy')
      .optional()
      .isIn(['updatedAt', 'createdAt', 'name'])
      .withMessage('sortBy must be one of: updatedAt, createdAt, name'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('sortOrder must be either asc or desc'),
  ],
  validateRequest,
  conversationController.getUserConversations
);

/**
 * @route   GET /api/conversations/:id
 * @desc    Get single conversation details
 * @access  Private (member only)
 */
router.get(
  '/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid conversation ID'),
  ],
  validateRequest,
  conversationController.getConversationById
);

/**
 * @route   PATCH /api/conversations/:id/name
 * @desc    Update group conversation name
 * @access  Private (admin/moderator only)
 */
router.patch(
  '/:id/name',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid conversation ID'),
    body('name')
      .notEmpty()
      .withMessage('Group name is required')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Group name must be between 1 and 100 characters'),
  ],
  validateRequest,
  conversationController.updateConversationName
);

/**
 * @route   POST /api/conversations/:id/members
 * @desc    Add member to group conversation
 * @access  Private (admin only)
 */
router.post(
  '/:id/members',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid conversation ID'),
    body('userId')
      .notEmpty()
      .withMessage('userId is required')
      .isMongoId()
      .withMessage('Invalid userId format'),
  ],
  validateRequest,
  conversationController.addMember
);

/**
 * @route   DELETE /api/conversations/:id/members/:userId
 * @desc    Remove member from group conversation
 * @access  Private (admin or self-removal)
 */
router.delete(
  '/:id/members/:userId',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid conversation ID'),
    param('userId')
      .isMongoId()
      .withMessage('Invalid userId format'),
  ],
  validateRequest,
  conversationController.removeMember
);

/**
 * @route   DELETE /api/conversations/:id
 * @desc    Delete/leave conversation
 * @access  Private
 */
router.delete(
  '/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid conversation ID'),
  ],
  validateRequest,
  conversationController.deleteConversation
);

export default router;
