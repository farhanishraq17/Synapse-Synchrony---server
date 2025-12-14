import mongoose from 'mongoose';

/**
 * Message Schema
 * Stores individual messages within conversations
 * Future-ready for image/file attachments
 */
const messageSchema = new mongoose.Schema(
  {
    // Reference to conversation
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true, 'Conversation ID is required'],
      index: true,
    },

    // Message sender
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID is required'],
      index: true,
    },

    // Message content
    content: {
      type: String,
      required: function () {
        // Content is required for text messages or if no attachments
        return this.type === 'text' || this.attachments.length === 0;
      },
      maxlength: [5000, 'Message content cannot exceed 5000 characters'],
      trim: true,
    },

    // Message type (future-ready for attachments)
    type: {
      type: String,
      enum: ['text', 'image', 'file'],
      default: 'text',
    },

    // Attachments array (future-ready, not implemented yet)
    attachments: [
      {
        url: {
          type: String,
          required: true,
        },
        mime: {
          type: String, // MIME type (e.g., image/jpeg, application/pdf)
        },
        size: {
          type: Number, // File size in bytes
        },
        width: {
          type: Number, // Image width (for images only)
        },
        height: {
          type: Number, // Image height (for images only)
        },
        name: {
          type: String, // Original filename
        },
      },
    ],

    // Edit tracking
    isEdited: {
      type: Boolean,
      default: false,
    },

    // Soft delete support
    isDeleted: {
      type: Boolean,
      default: false,
    },

    // Original content before edit (optional)
    editHistory: [
      {
        content: String,
        editedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Message reactions (future-ready, emoji support)
    reactions: {
      type: Map,
      of: [mongoose.Schema.Types.ObjectId], // Map of emoji -> array of user IDs
      default: new Map(),
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

/**
 * INSTANCE METHOD: Soft delete message
 * @returns {Promise<Message>} - Updated message
 */
messageSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.content = 'This message has been deleted';
  return await this.save();
};

/**
 * INSTANCE METHOD: Edit message content
 * @param {string} newContent - New message content
 * @returns {Promise<Message>} - Updated message
 */
messageSchema.methods.editContent = async function (newContent) {
  // Save original content to history
  if (this.content && !this.isEdited) {
    this.editHistory.push({
      content: this.content,
      editedAt: new Date(),
    });
  }

  this.content = newContent;
  this.isEdited = true;
  return await this.save();
};

/**
 * INSTANCE METHOD: Add reaction to message
 * @param {string} emoji - Emoji string
 * @param {string} userId - User's MongoDB ID
 * @returns {Promise<Message>} - Updated message
 */
messageSchema.methods.addReaction = async function (emoji, userId) {
  const userIds = this.reactions.get(emoji) || [];
  if (!userIds.includes(userId)) {
    userIds.push(userId);
    this.reactions.set(emoji, userIds);
    await this.save();
  }
  return this;
};

/**
 * INSTANCE METHOD: Remove reaction from message
 * @param {string} emoji - Emoji string
 * @param {string} userId - User's MongoDB ID
 * @returns {Promise<Message>} - Updated message
 */
messageSchema.methods.removeReaction = async function (emoji, userId) {
  const userIds = this.reactions.get(emoji) || [];
  const filtered = userIds.filter((id) => id.toString() !== userId.toString());
  
  if (filtered.length === 0) {
    this.reactions.delete(emoji);
  } else {
    this.reactions.set(emoji, filtered);
  }
  
  await this.save();
  return this;
};

/**
 * STATIC METHOD: Get messages for conversation with pagination
 * @param {string} conversationId - Conversation's MongoDB ID
 * @param {number} limit - Number of messages to fetch
 * @param {Date} before - Fetch messages before this date (for pagination)
 * @returns {Promise<Array>} - Array of messages
 */
messageSchema.statics.getConversationMessages = async function (
  conversationId,
  limit = 50,
  before = null
) {
  const query = { conversationId, isDeleted: false };
  
  if (before) {
    query.createdAt = { $lt: before };
  }

  return await this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('senderId', 'name avatar');
};

/**
 * STATIC METHOD: Count unread messages for user in conversation
 * @param {string} conversationId - Conversation's MongoDB ID
 * @param {Date} lastReadAt - Last read timestamp
 * @returns {Promise<number>} - Count of unread messages
 */
messageSchema.statics.countUnread = async function (conversationId, lastReadAt) {
  return await this.countDocuments({
    conversationId,
    createdAt: { $gt: lastReadAt },
    isDeleted: false,
  });
};

// Create compound indexes for performance
messageSchema.index({ conversationId: 1, createdAt: -1 }); // Pagination queries (most important)
messageSchema.index({ conversationId: 1, createdAt: -1, _id: -1 }); // Cursor pagination with tie-breaker
messageSchema.index({ senderId: 1, createdAt: -1 }); // Query messages by sender
messageSchema.index({ conversationId: 1, isDeleted: 1 }); // Filter deleted messages

const Message = mongoose.model('Message', messageSchema);

export default Message;
