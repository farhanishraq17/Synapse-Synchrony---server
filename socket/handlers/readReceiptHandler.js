import * as messageService from '../../services/messageService.js';
import { authorizeConversationAccess } from '../middleware/socketAuthorization.js';

/**
 * Read Receipt Handler
 * Manages read receipts and message status
 */

/**
 * Handle marking messages as read
 * @param {Object} io - Socket.IO server instance
 * @param {Object} socket - Socket instance
 * @param {Object} data - { conversationId, messageId }
 * @param {Function} callback - Acknowledgement callback
 */
export const handleMarkAsRead = async (io, socket, data, callback) => {
  try {
    const { conversationId, messageId } = data;

    if (!conversationId) {
      return callback?.({
        success: false,
        message: 'conversationId is required',
        code: 'MISSING_CONVERSATION_ID',
      });
    }

    // Check authorization
    const isAuthorized = await authorizeConversationAccess(socket, conversationId);
    
    if (!isAuthorized) {
      return callback?.({
        success: false,
        message: 'You are not a member of this conversation',
        code: 'UNAUTHORIZED',
      });
    }

    // Mark messages as read
    const receipt = await messageService.markAsRead(
      conversationId,
      socket.userId,
      messageId
    );

    console.log(`📖 ${socket.user.name} marked messages as read in conversation ${conversationId}`);

    // Broadcast read receipt to conversation room
    const roomName = `conversation:${conversationId}`;
    socket.to(roomName).emit('message:read', {
      conversationId,
      user: {
        id: socket.user.id,
        name: socket.user.name,
        avatar: socket.user.avatar,
      },
      messageId: messageId || null,
      lastReadAt: receipt.lastReadAt,
      timestamp: new Date().toISOString(),
    });

    // Get updated unread count
    const unreadCount = await messageService.getUnreadCount(conversationId, socket.userId);

    // Send acknowledgement
    callback?.({
      success: true,
      message: 'Messages marked as read',
      data: {
        conversationId,
        lastReadAt: receipt.lastReadAt,
        unreadCount,
      },
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    callback?.({
      success: false,
      message: error.message || 'Failed to mark messages as read',
      code: 'READ_ERROR',
    });
  }
};

/**
 * Handle getting unread count
 * @param {Object} socket - Socket instance
 * @param {Object} data - { conversationId }
 * @param {Function} callback - Acknowledgement callback
 */
export const handleGetUnreadCount = async (socket, data, callback) => {
  try {
    const { conversationId } = data;

    if (!conversationId) {
      return callback({
        success: false,
        message: 'conversationId is required',
        code: 'MISSING_CONVERSATION_ID',
      });
    }

    // Check authorization
    const isAuthorized = await authorizeConversationAccess(socket, conversationId);
    
    if (!isAuthorized) {
      return callback({
        success: false,
        message: 'You are not a member of this conversation',
        code: 'UNAUTHORIZED',
      });
    }

    // Get unread count
    const unreadCount = await messageService.getUnreadCount(conversationId, socket.userId);

    callback({
      success: true,
      data: {
        conversationId,
        unreadCount,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    callback({
      success: false,
      message: error.message || 'Failed to get unread count',
      code: 'UNREAD_ERROR',
    });
  }
};

/**
 * Handle getting all unread counts for user
 * @param {Object} socket - Socket instance
 * @param {Object} data - { conversationIds }
 * @param {Function} callback - Acknowledgement callback
 */
export const handleGetAllUnreadCounts = async (socket, data, callback) => {
  try {
    const { conversationIds } = data;

    if (!conversationIds || !Array.isArray(conversationIds)) {
      return callback({
        success: false,
        message: 'conversationIds array is required',
        code: 'INVALID_INPUT',
      });
    }

    // Get unread counts for all conversations
    const unreadCounts = {};
    
    for (const conversationId of conversationIds) {
      try {
        // Check if user is member
        const isAuthorized = await authorizeConversationAccess(socket, conversationId);
        
        if (isAuthorized) {
          const count = await messageService.getUnreadCount(conversationId, socket.userId);
          unreadCounts[conversationId] = count;
        }
      } catch (error) {
        // Skip unauthorized conversations
        console.log(`Skipping unauthorized conversation: ${conversationId}`);
      }
    }

    callback({
      success: true,
      data: {
        unreadCounts,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Get all unread counts error:', error);
    callback({
      success: false,
      message: error.message || 'Failed to get unread counts',
      code: 'UNREAD_ERROR',
    });
  }
};

/**
 * Broadcast unread count update to user
 * @param {Object} io - Socket.IO server instance
 * @param {String} userId - User ID
 * @param {String} conversationId - Conversation ID
 * @param {Number} unreadCount - New unread count
 */
export const broadcastUnreadCount = (io, userId, conversationId, unreadCount) => {
  io.to(`user:${userId}`).emit('unread:update', {
    conversationId,
    unreadCount,
    timestamp: new Date().toISOString(),
  });
};
