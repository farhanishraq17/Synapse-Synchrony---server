import * as messageService from '../../services/messageService.js';
import { authorizeConversationAccess } from '../middleware/socketAuthorization.js';

/**
 * Message Handler
 * Handles real-time message sending and broadcasting
 */

/**
 * Handle sending a new message
 * @param {Object} io - Socket.IO server instance
 * @param {Object} socket - Socket instance
 * @param {Object} data - { conversationId, content, type, attachments }
 * @param {Function} callback - Acknowledgement callback
 */
export const handleSendMessage = async (io, socket, data, callback) => {
  try {
    const { conversationId, content, type = 'text', attachments = [] } = data;

    // Validate required fields
    if (!conversationId) {
      return callback({
        success: false,
        message: 'conversationId is required',
        code: 'MISSING_CONVERSATION_ID',
      });
    }

    if (!content || content.trim().length === 0) {
      return callback({
        success: false,
        message: 'Message content cannot be empty',
        code: 'EMPTY_CONTENT',
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

    // Create message in database
    const message = await messageService.createMessage({
      conversationId,
      senderId: socket.userId,
      content: content.trim(),
      type,
      attachments,
    });

    console.log(`💬 New message from ${socket.user.name} in conversation ${conversationId}`);

    // Broadcast to all room members (including sender for consistency)
    const roomName = `conversation:${conversationId}`;
    io.to(roomName).emit('message:new', {
      success: true,
      message: {
        _id: message._id,
        conversationId: message.conversationId,
        senderId: {
          _id: message.senderId._id,
          name: message.senderId.name,
          email: message.senderId.email,
          avatar: message.senderId.avatar,
        },
        content: message.content,
        type: message.type,
        attachments: message.attachments,
        isEdited: message.isEdited,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      },
    });

    // Send acknowledgement to sender
    callback({
      success: true,
      message: 'Message sent successfully',
      data: {
        messageId: message._id,
        conversationId: message.conversationId,
        createdAt: message.createdAt,
      },
    });
  } catch (error) {
    console.error('Send message error:', error);
    
    callback({
      success: false,
      message: error.message || 'Failed to send message',
      code: error.statusCode === 403 ? 'UNAUTHORIZED' : 'SEND_ERROR',
    });
  }
};

/**
 * Handle message editing
 * @param {Object} io - Socket.IO server instance
 * @param {Object} socket - Socket instance
 * @param {Object} data - { messageId, conversationId, content }
 * @param {Function} callback - Acknowledgement callback
 */
export const handleEditMessage = async (io, socket, data, callback) => {
  try {
    const { messageId, conversationId, content } = data;

    if (!messageId || !content) {
      return callback({
        success: false,
        message: 'messageId and content are required',
        code: 'MISSING_FIELDS',
      });
    }

    // Edit message
    const updatedMessage = await messageService.editMessage(
      messageId,
      socket.userId,
      content
    );

    console.log(`✏️ Message edited by ${socket.user.name}: ${messageId}`);

    // Broadcast update to conversation room
    const roomName = `conversation:${conversationId}`;
    io.to(roomName).emit('message:edited', {
      success: true,
      message: {
        _id: updatedMessage._id,
        conversationId: updatedMessage.conversationId,
        content: updatedMessage.content,
        isEdited: updatedMessage.isEdited,
        updatedAt: updatedMessage.updatedAt,
      },
    });

    // Send acknowledgement
    callback({
      success: true,
      message: 'Message edited successfully',
      data: {
        messageId: updatedMessage._id,
        updatedAt: updatedMessage.updatedAt,
      },
    });
  } catch (error) {
    console.error('Edit message error:', error);
    
    callback({
      success: false,
      message: error.message || 'Failed to edit message',
      code: error.statusCode === 403 ? 'UNAUTHORIZED' : 'EDIT_ERROR',
    });
  }
};

/**
 * Handle message deletion
 * @param {Object} io - Socket.IO server instance
 * @param {Object} socket - Socket instance
 * @param {Object} data - { messageId, conversationId }
 * @param {Function} callback - Acknowledgement callback
 */
export const handleDeleteMessage = async (io, socket, data, callback) => {
  try {
    const { messageId, conversationId } = data;

    if (!messageId) {
      return callback({
        success: false,
        message: 'messageId is required',
        code: 'MISSING_MESSAGE_ID',
      });
    }

    // Delete message (soft delete)
    const deletedMessage = await messageService.deleteMessage(
      messageId,
      socket.userId
    );

    console.log(`🗑️ Message deleted by ${socket.user.name}: ${messageId}`);

    // Broadcast deletion to conversation room
    const roomName = `conversation:${conversationId}`;
    io.to(roomName).emit('message:deleted', {
      success: true,
      messageId: deletedMessage._id,
      conversationId,
      deletedAt: new Date().toISOString(),
    });

    // Send acknowledgement
    callback({
      success: true,
      message: 'Message deleted successfully',
      data: {
        messageId: deletedMessage._id,
      },
    });
  } catch (error) {
    console.error('Delete message error:', error);
    
    callback({
      success: false,
      message: error.message || 'Failed to delete message',
      code: error.statusCode === 403 ? 'UNAUTHORIZED' : 'DELETE_ERROR',
    });
  }
};
