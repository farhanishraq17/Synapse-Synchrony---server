import express from 'express';
import * as messageController from '../controllers/messageController.js';
import { authenticate } from '../middleware/auth.js';
import { param, query, body } from 'express-validator';
import { validateRequest } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/conversations/:conversationId/messages
 * @desc    Get messages for a conversation with cursor pagination
 * @access  Private (member only)
 */
router.get(
  '/:conversationId/messages',
  [
    param('conversationId')
      .isMongoId()
      .withMessage('Invalid conversation ID'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('limit must be between 1 and 100'),
    query('before')
      .optional()
      .custom((value) => {
        // Allow both MongoDB ObjectId and ISO date string
        return mongoose.Types.ObjectId.isValid(value) || !isNaN(Date.parse(value));
      })
      .withMessage('before must be a valid message ID or timestamp'),
    query('after')
      .optional()
      .custom((value) => {
        return mongoose.Types.ObjectId.isValid(value) || !isNaN(Date.parse(value));
      })
      .withMessage('after must be a valid message ID or timestamp'),
  ],
  validateRequest,
  messageController.getMessages
);

/**
 * @route   GET /api/conversations/:conversationId/messages/unread-count
 * @desc    Get unread message count
 * @access  Private (member only)
 */
router.get(
  '/:conversationId/messages/unread-count',
  [
    param('conversationId')
      .isMongoId()
      .withMessage('Invalid conversation ID'),
  ],
  validateRequest,
  messageController.getUnreadCount
);

/**
 * @route   POST /api/conversations/:conversationId/messages/read
 * @desc    Mark messages as read
 * @access  Private (member only)
 */
router.post(
  '/:conversationId/messages/read',
  [
    param('conversationId')
      .isMongoId()
      .withMessage('Invalid conversation ID'),
    body('messageId')
      .optional()
      .isMongoId()
      .withMessage('Invalid message ID'),
  ],
  validateRequest,
  messageController.markMessagesAsRead
);

export default router;
