import { authorizeConversationAccess } from '../middleware/socketAuthorization.js';

/**
 * Connection Handler
 * Manages joining and leaving conversation rooms
 */

/**
 * Handle user joining a conversation room
 * @param {Object} socket - Socket instance
 * @param {Object} data - { conversationId }
 * @param {Function} callback - Acknowledgement callback
 */
export const handleJoinConversation = async (socket, data, callback) => {
  try {
    const { conversationId } = data;

    if (!conversationId) {
      const error = {
        success: false,
        message: 'conversationId is required',
        code: 'MISSING_CONVERSATION_ID',
      };
      return callback ? callback(error) : null;
    }

    // Check authorization
    const isAuthorized = await authorizeConversationAccess(socket, conversationId);

    if (!isAuthorized) {
      const error = {
        success: false,
        message: 'You are not a member of this conversation',
        code: 'UNAUTHORIZED',
      };
      return callback ? callback(error) : null;
    }

    // Join the conversation room
    const roomName = `conversation:${conversationId}`;
    await socket.join(roomName);

    console.log(`✅ ${socket.user.name} joined room: ${roomName}`);

    // Send success acknowledgement
    if (callback) {
      callback({
        success: true,
        message: 'Joined conversation successfully',
        conversationId,
        roomName,
      });
    }

    // Notify other room members (optional)
    socket.to(roomName).emit('user:joined', {
      conversationId,
      user: {
        id: socket.user.id,
        name: socket.user.name,
        avatar: socket.user.avatar,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Join conversation error:', error);
    
    if (callback) {
      callback({
        success: false,
        message: error.message || 'Failed to join conversation',
        code: 'JOIN_ERROR',
      });
    }
  }
};

/**
 * Handle user leaving a conversation room
 * @param {Object} socket - Socket instance
 * @param {Object} data - { conversationId }
 * @param {Function} callback - Acknowledgement callback
 */
export const handleLeaveConversation = async (socket, data, callback) => {
  try {
    const { conversationId } = data;

    if (!conversationId) {
      const error = {
        success: false,
        message: 'conversationId is required',
        code: 'MISSING_CONVERSATION_ID',
      };
      return callback ? callback(error) : null;
    }

    const roomName = `conversation:${conversationId}`;

    // Leave the room
    await socket.leave(roomName);

    console.log(`📤 ${socket.user.name} left room: ${roomName}`);

    // Send success acknowledgement
    if (callback) {
      callback({
        success: true,
        message: 'Left conversation successfully',
        conversationId,
      });
    }

    // Notify other room members (optional)
    socket.to(roomName).emit('user:left', {
      conversationId,
      user: {
        id: socket.user.id,
        name: socket.user.name,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Leave conversation error:', error);
    
    if (callback) {
      callback({
        success: false,
        message: error.message || 'Failed to leave conversation',
        code: 'LEAVE_ERROR',
      });
    }
  }
};

/**
 * Handle user disconnect - leave all rooms
 * @param {Object} socket - Socket instance
 */
export const handleDisconnect = (socket) => {
  console.log(`🔌 User disconnected: ${socket.user.name} (${socket.id})`);
  
  // Socket.IO automatically removes user from all rooms on disconnect
  // But we can add cleanup logic here if needed
};
