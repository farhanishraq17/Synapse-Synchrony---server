import * as conversationService from '../../services/conversationService.js';

/**
 * Socket Authorization Middleware
 * Verifies user has access to conversation rooms
 */

/**
 * Authorize user to join conversation room
 * @param {Object} socket - Socket instance
 * @param {String} conversationId - Conversation ID to join
 * @returns {Promise<Boolean>} - True if authorized
 */
export const authorizeConversationAccess = async (socket, conversationId) => {
  try {
    // Check if user is member of conversation
    const isMember = await conversationService.isConversationMember(
      socket.userId,
      conversationId
    );

    if (!isMember) {
      console.log(`❌ Unauthorized room access attempt: ${socket.user.name} -> ${conversationId}`);
      return false;
    }

    console.log(`✅ Authorized: ${socket.user.name} -> conversation:${conversationId}`);
    return true;
  } catch (error) {
    console.error('Socket authorization error:', error);
    return false;
  }
};

/**
 * Middleware to check conversation access before event execution
 * @param {Function} handler - Event handler function
 * @returns {Function} - Wrapped handler with authorization check
 */
export const requireConversationAccess = (handler) => {
  return async (data, callback) => {
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
      const isAuthorized = await authorizeConversationAccess(this, conversationId);

      if (!isAuthorized) {
        const error = {
          success: false,
          message: 'You are not a member of this conversation',
          code: 'UNAUTHORIZED',
        };
        return callback ? callback(error) : null;
      }

      // Execute handler if authorized
      return await handler.call(this, data, callback);
    } catch (error) {
      console.error('Authorization middleware error:', error);
      const errorResponse = {
        success: false,
        message: 'Authorization failed',
        code: 'AUTH_ERROR',
      };
      return callback ? callback(errorResponse) : null;
    }
  };
};
