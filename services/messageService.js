import Message from '../models/Message.js';
import ReadReceipt from '../models/ReadReceipt.js';
import mongoose from 'mongoose';
import { buildCursorPaginationMeta } from '../utils/pagination.js';
import * as conversationService from './conversationService.js';

/**
 * Message Service
 * Business logic for message operations
 */

// ==========================================
// MESSAGE CREATION
// ==========================================

/**
 * Create a new message in a conversation
 * @param {Object} messageData - { conversationId, senderId, content, type, attachments }
 * @returns {Promise<Message>} - Created message
 */
export const createMessage = async (messageData) => {
  const { conversationId, senderId, content, type = 'text', attachments = [] } = messageData;

  // Validate required fields
  if (!conversationId || !senderId) {
    const error = new Error('conversationId and senderId are required');
    error.statusCode = 400;
    throw error;
  }

  // Validate ObjectIds
  if (!mongoose.Types.ObjectId.isValid(conversationId) || 
      !mongoose.Types.ObjectId.isValid(senderId)) {
    const error = new Error('Invalid conversationId or senderId');
    error.statusCode = 400;
    throw error;
  }

  // Verify sender is member of conversation
  await conversationService.assertUserIsMember(senderId, conversationId);

  // Validate content based on type
  if (type === 'text' && (!content || content.trim().length === 0)) {
    const error = new Error('Message content cannot be empty');
    error.statusCode = 400;
    throw error;
  }

  if (content && content.length > 5000) {
    const error = new Error('Message content cannot exceed 5000 characters');
    error.statusCode = 400;
    throw error;
  }

  // Create message
  const message = new Message({
    conversationId,
    senderId,
    content: content?.trim(),
    type,
    attachments,
  });

  await message.save();

  // Update conversation's last message
  await conversationService.updateLastMessage(conversationId, {
    content: message.content,
    senderId: message.senderId,
    timestamp: message.createdAt,
  });

  // Increment unread count for all participants except sender
  await ReadReceipt.incrementUnread(conversationId, senderId);

  // Populate sender info before returning
  await message.populate('senderId', 'name email avatar');

  return message;
};

// ==========================================
// MESSAGE RETRIEVAL
// ==========================================

/**
 * Get messages for a conversation with cursor-based pagination
 * @param {String} conversationId - Conversation ID
 * @param {String} userId - User requesting messages (for authorization)
 * @param {Object} options - { limit, before, after }
 * @returns {Promise<Object>} - { messages, pagination }
 */
export const getConversationMessages = async (conversationId, userId, options = {}) => {
  // Validate IDs
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    const error = new Error('Invalid conversation ID');
    error.statusCode = 400;
    throw error;
  }

  // Verify user is member of conversation
  await conversationService.assertUserIsMember(userId, conversationId);

  const { limit = 50, before = null, after = null } = options;
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit)));

  // Build query
  const query = {
    conversationId,
    isDeleted: false, // Don't show soft-deleted messages
  };

  // Cursor-based pagination
  if (before) {
    // Fetch messages before this cursor (older messages)
    if (mongoose.Types.ObjectId.isValid(before)) {
      query._id = { $lt: before };
    } else {
      // If before is a timestamp
      query.createdAt = { $lt: new Date(before) };
    }
  } else if (after) {
    // Fetch messages after this cursor (newer messages)
    if (mongoose.Types.ObjectId.isValid(after)) {
      query._id = { $gt: after };
    } else {
      query.createdAt = { $gt: new Date(after) };
    }
  }

  // Execute query
  const messages = await Message.find(query)
    .populate('senderId', 'name email avatar')
    .sort({ createdAt: -1, _id: -1 }) // Sort by newest first (for infinite scroll)
    .limit(parsedLimit)
    .lean();

  // Build pagination metadata
  const pagination = buildCursorPaginationMeta(messages, parsedLimit);

  return {
    messages,
    pagination,
  };
};

/**
 * Get a single message by ID
 * @param {String} messageId - Message ID
 * @param {String} userId - User requesting message
 * @returns {Promise<Message>} - Message document
 */
export const getMessageById = async (messageId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(messageId)) {
    const error = new Error('Invalid message ID');
    error.statusCode = 400;
    throw error;
  }

  const message = await Message.findById(messageId)
    .populate('senderId', 'name email avatar');

  if (!message) {
    const error = new Error('Message not found');
    error.statusCode = 404;
    throw error;
  }

  // Verify user is member of conversation
  await conversationService.assertUserIsMember(userId, message.conversationId.toString());

  return message;
};

// ==========================================
// MESSAGE UPDATES
// ==========================================

/**
 * Edit message content
 * @param {String} messageId - Message ID
 * @param {String} userId - User editing the message
 * @param {String} newContent - New message content
 * @returns {Promise<Message>} - Updated message
 */
export const editMessage = async (messageId, userId, newContent) => {
  if (!mongoose.Types.ObjectId.isValid(messageId)) {
    const error = new Error('Invalid message ID');
    error.statusCode = 400;
    throw error;
  }

  if (!newContent || newContent.trim().length === 0) {
    const error = new Error('Message content cannot be empty');
    error.statusCode = 400;
    throw error;
  }

  if (newContent.length > 5000) {
    const error = new Error('Message content cannot exceed 5000 characters');
    error.statusCode = 400;
    throw error;
  }

  const message = await Message.findById(messageId);

  if (!message) {
    const error = new Error('Message not found');
    error.statusCode = 404;
    throw error;
  }

  // Only sender can edit their own message
  if (message.senderId.toString() !== userId.toString()) {
    const error = new Error('You can only edit your own messages');
    error.statusCode = 403;
    throw error;
  }

  // Use the editContent instance method from Message model
  await message.editContent(newContent.trim());

  await message.populate('senderId', 'name email avatar');

  return message;
};

/**
 * Soft delete a message
 * @param {String} messageId - Message ID
 * @param {String} userId - User deleting the message
 * @returns {Promise<Message>} - Deleted message
 */
export const deleteMessage = async (messageId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(messageId)) {
    const error = new Error('Invalid message ID');
    error.statusCode = 400;
    throw error;
  }

  const message = await Message.findById(messageId);

  if (!message) {
    const error = new Error('Message not found');
    error.statusCode = 404;
    throw error;
  }

  // Only sender can delete their own message
  if (message.senderId.toString() !== userId.toString()) {
    const error = new Error('You can only delete your own messages');
    error.statusCode = 403;
    throw error;
  }

  // Use the softDelete instance method from Message model
  await message.softDelete();

  return message;
};

// ==========================================
// UNREAD COUNT
// ==========================================

/**
 * Get unread message count for a user in a conversation
 * @param {String} conversationId - Conversation ID
 * @param {String} userId - User ID
 * @returns {Promise<Number>} - Unread count
 */
export const getUnreadCount = async (conversationId, userId) => {
  // Get user's read receipt
  const receipt = await ReadReceipt.getReceipt(userId, conversationId);

  if (!receipt || !receipt.lastReadAt) {
    // No receipt means user hasn't read anything, count all messages
    return await Message.countDocuments({
      conversationId,
      senderId: { $ne: userId }, // Don't count own messages
      isDeleted: false,
    });
  }

  // Count messages after last read timestamp
  return await Message.countDocuments({
    conversationId,
    senderId: { $ne: userId },
    createdAt: { $gt: receipt.lastReadAt },
    isDeleted: false,
  });
};

/**
 * Mark messages as read
 * @param {String} conversationId - Conversation ID
 * @param {String} userId - User ID
 * @param {String} messageId - Last read message ID (optional)
 * @returns {Promise<ReadReceipt>} - Updated read receipt
 */
export const markAsRead = async (conversationId, userId, messageId = null) => {
  // Verify user is member
  await conversationService.assertUserIsMember(userId, conversationId);

  // If messageId provided, verify it exists and belongs to conversation
  if (messageId) {
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      const error = new Error('Invalid message ID');
      error.statusCode = 400;
      throw error;
    }

    const message = await Message.findOne({
      _id: messageId,
      conversationId,
    });

    if (!message) {
      const error = new Error('Message not found in this conversation');
      error.statusCode = 404;
      throw error;
    }
  }

  // Update or create read receipt
  const receipt = await ReadReceipt.markAsRead(userId, conversationId, messageId);

  // Update unread count cache
  const unreadCount = await getUnreadCount(conversationId, userId);
  await ReadReceipt.updateUnreadCount(userId, conversationId, unreadCount);

  return receipt;
};
