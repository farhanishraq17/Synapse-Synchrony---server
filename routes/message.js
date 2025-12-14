import express from 'express';
import * as messageController from '../controllers/messageController.js';
import { authenticate } from '../middleware/auth.js';
import { param, query, body } from 'express-validator';
import { validateRequest } from '../middleware/validation.js';
import mongoose from 'mongoose';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/conversations/:conversationId/messages
 * @desc    Send a new message
 * @access  Private (member only)
 */
router.post(
  '/:conversationId/messages',
  [
    param('conversationId')
      .isMongoId()
      .withMessage('Invalid conversation ID'),
    body('content')
      .notEmpty()
      .withMessage('Message content is required')
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Message cannot exceed 5000 characters'),
    body('type')
      .optional()
      .isIn(['text', 'image', 'file', 'audio', 'video'])
      .withMessage('Invalid message type'),
    body('attachments')
      .optional()
      .isArray()
      .withMessage('Attachments must be an array'),
  ],
  validateRequest,
  messageController.sendMessage
);

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
 * @route   PATCH /api/conversations/:conversationId/messages/:messageId
 * @desc    Edit a message
 * @access  Private (sender only)
 */
router.patch(
  '/:conversationId/messages/:messageId',
  [
    param('conversationId')
      .isMongoId()
      .withMessage('Invalid conversation ID'),
    param('messageId')
      .isMongoId()
      .withMessage('Invalid message ID'),
    body('content')
      .notEmpty()
      .withMessage('Message content is required')
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Message cannot exceed 5000 characters'),
  ],
  validateRequest,
  messageController.editMessage
);

/**
 * @route   DELETE /api/conversations/:conversationId/messages/:messageId
 * @desc    Delete a message
 * @access  Private (sender only)
 */
router.delete(
  '/:conversationId/messages/:messageId',
  [
    param('conversationId')
      .isMongoId()
      .withMessage('Invalid conversation ID'),
    param('messageId')
      .isMongoId()
      .withMessage('Invalid message ID'),
  ],
  validateRequest,
  messageController.deleteMessage
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
