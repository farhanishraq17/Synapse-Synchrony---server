import * as messageService from '../services/messageService.js';
import { parseCursorPagination } from '../utils/pagination.js';

/**
 * @desc    Get messages for conversation with pagination
 * @route   GET /api/conversations/:conversationId/messages
 * @access  Private (member only)
 */
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.userId;
    const paginationParams = parseCursorPagination(req.query);

    const result = await messageService.getConversationMessages(
      conversationId,
      currentUserId,
      paginationParams
    );

    res.status(200).json({
      success: true,
      message: 'Messages retrieved successfully',
      data: result,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to retrieve messages',
    });
  }
};

/**
 * @desc    Get unread message count
 * @route   GET /api/conversations/:conversationId/messages/unread-count
 * @access  Private (member only)
 */
export const getUnreadCount = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.userId;

    const count = await messageService.getUnreadCount(conversationId, currentUserId);

    res.status(200).json({
      success: true,
      message: 'Unread count retrieved successfully',
      data: {
        conversationId,
        unreadCount: count,
      },
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get unread count',
    });
  }
};

/**
 * @desc    Mark messages as read
 * @route   POST /api/conversations/:conversationId/messages/read
 * @access  Private (member only)
 */
export const markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { messageId } = req.body;
    const currentUserId = req.userId;

    const receipt = await messageService.markAsRead(
      conversationId,
      currentUserId,
      messageId
    );

    res.status(200).json({
      success: true,
      message: 'Messages marked as read',
      data: {
        receipt,
      },
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to mark messages as read',
    });
  }
};
