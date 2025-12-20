import { authorizeConversationAccess } from '../middleware/socketAuthorization.js';

/**
 * Typing Handler
 * Manages typing indicators for conversations
 */

// Store typing timeouts per user per conversation
const typingTimeouts = new Map();

/**
 * Get timeout key
 * @param {String} userId - User ID
 * @param {String} conversationId - Conversation ID
 * @returns {String} - Timeout key
 */
const getTimeoutKey = (userId, conversationId) => {
  return `${userId}:${conversationId}`;
};

/**
 * Handle typing start
 * @param {Object} io - Socket.IO server instance
 * @param {Object} socket - Socket instance
 * @param {Object} data - { conversationId }
 * @param {Function} callback - Acknowledgement callback
 */
export const handleTypingStart = async (io, socket, data, callback) => {
  try {
    const { conversationId } = data;

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

    const roomName = `conversation:${conversationId}`;
    const timeoutKey = getTimeoutKey(socket.userId, conversationId);

    // Clear existing timeout if any
    if (typingTimeouts.has(timeoutKey)) {
      clearTimeout(typingTimeouts.get(timeoutKey));
    }

    // Broadcast typing start to other room members (not to sender)
    socket.to(roomName).emit('typing:start', {
      conversationId,
      user: {
        id: socket.user.id,
        name: socket.user.name,
        avatar: socket.user.avatar,
      },
      timestamp: new Date().toISOString(),
    });

    // Auto-stop typing after 3 seconds
    const timeout = setTimeout(() => {
      socket.to(roomName).emit('typing:stop', {
        conversationId,
        user: {
          id: socket.user.id,
          name: socket.user.name,
        },
        timestamp: new Date().toISOString(),
      });
      typingTimeouts.delete(timeoutKey);
    }, 3000);

    typingTimeouts.set(timeoutKey, timeout);

    // Send acknowledgement
    callback?.({
      success: true,
      message: 'Typing indicator sent',
    });
  } catch (error) {
    console.error('Typing start error:', error);
    callback?.({
      success: false,
      message: error.message || 'Failed to send typing indicator',
      code: 'TYPING_ERROR',
    });
  }
};

/**
 * Handle typing stop
 * @param {Object} io - Socket.IO server instance
 * @param {Object} socket - Socket instance
 * @param {Object} data - { conversationId }
 * @param {Function} callback - Acknowledgement callback
 */
export const handleTypingStop = async (io, socket, data, callback) => {
  try {
    const { conversationId } = data;

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

    const roomName = `conversation:${conversationId}`;
    const timeoutKey = getTimeoutKey(socket.userId, conversationId);

    // Clear timeout
    if (typingTimeouts.has(timeoutKey)) {
      clearTimeout(typingTimeouts.get(timeoutKey));
      typingTimeouts.delete(timeoutKey);
    }

    // Broadcast typing stop to other room members
    socket.to(roomName).emit('typing:stop', {
      conversationId,
      user: {
        id: socket.user.id,
        name: socket.user.name,
      },
      timestamp: new Date().toISOString(),
    });

    // Send acknowledgement
    callback?.({
      success: true,
      message: 'Typing stopped',
    });
  } catch (error) {
    console.error('Typing stop error:', error);
    callback?.({
      success: false,
      message: error.message || 'Failed to stop typing indicator',
      code: 'TYPING_ERROR',
    });
  }
};

/**
 * Clear all typing indicators for a user (on disconnect)
 * @param {Object} io - Socket.IO server instance
 * @param {Object} socket - Socket instance
 */
export const clearUserTypingIndicators = (io, socket) => {
  // Clear all timeouts for this user
  const keysToDelete = [];
  
  for (const [key, timeout] of typingTimeouts.entries()) {
    if (key.startsWith(socket.userId)) {
      clearTimeout(timeout);
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach(key => typingTimeouts.delete(key));
};

