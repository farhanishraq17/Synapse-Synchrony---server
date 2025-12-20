import * as messageService from '../services/messageService.js';
import { parseCursorPagination } from '../utils/pagination.js';

/**
 * @desc    Send a new message (REST API)
 * @route   POST /api/conversations/:conversationId/messages
 * @access  Private (member only)
 */
export const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, type = 'text', attachments = [] } = req.body;
    const currentUserId = req.userId;

    // Get Socket.IO instance from app
    const io = req.app.get('io');

    // Create message
    const message = await messageService.createMessage({
      conversationId,
      senderId: currentUserId,
      content,
      type,
      attachments,
    });

    // Broadcast to Socket.IO room if io is available
    if (io) {
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
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
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
      },
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to send message',
    });
  }
};

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
 * @desc    Edit a message (REST API)
 * @route   PATCH /api/conversations/:conversationId/messages/:messageId
 * @access  Private (sender only)
 */
export const editMessage = async (req, res) => {
  try {
    const { conversationId, messageId } = req.params;
    const { content } = req.body;
    const currentUserId = req.userId;

    // Get Socket.IO instance
    const io = req.app.get('io');

    // Edit message
    const updatedMessage = await messageService.editMessage(
      messageId,
      currentUserId,
      content
    );

    // Broadcast to Socket.IO room
    if (io) {
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
    }

    res.status(200).json({
      success: true,
      message: 'Message edited successfully',
      data: {
        message: updatedMessage,
      },
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to edit message',
    });
  }
};

/**
 * @desc    Delete a message (REST API)
 * @route   DELETE /api/conversations/:conversationId/messages/:messageId
 * @access  Private (sender only)
 */
export const deleteMessage = async (req, res) => {
  try {
    const { conversationId, messageId } = req.params;
    const currentUserId = req.userId;

    // Get Socket.IO instance
    const io = req.app.get('io');

    // Delete message
    const deletedMessage = await messageService.deleteMessage(
      messageId,
      currentUserId
    );

    // Broadcast to Socket.IO room
    if (io) {
      const roomName = `conversation:${conversationId}`;
      io.to(roomName).emit('message:deleted', {
        success: true,
        messageId: deletedMessage._id,
        conversationId,
        deletedAt: new Date().toISOString(),
      });
    }

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
      data: {
        messageId: deletedMessage._id,
      },
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to delete message',
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
