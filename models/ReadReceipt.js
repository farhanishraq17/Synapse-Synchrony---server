import mongoose from 'mongoose';

/**
 * ReadReceipt Schema
 * Tracks read status for each user in each conversation
 * Enables unread count and "last seen" functionality
 */
const readReceiptSchema = new mongoose.Schema(
  {
    // Reference to conversation
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true, 'Conversation ID is required'],
    },

    // User who read messages
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },

    // Last message read by this user
    lastReadMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },

    // Timestamp of last read action
    lastReadAt: {
      type: Date,
      required: [true, 'Last read timestamp is required'],
      default: Date.now,
    },

    // Unread count cache (for performance)
    unreadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

/**
 * INSTANCE METHOD: Update read receipt
 * @param {string} messageId - Message's MongoDB ID
 * @returns {Promise<ReadReceipt>} - Updated receipt
 */
readReceiptSchema.methods.markRead = async function (messageId) {
  this.lastReadMessageId = messageId;
  this.lastReadAt = new Date();
  this.unreadCount = 0;
  return await this.save();
};

/**
 * STATIC METHOD: Mark messages as read
 * Creates or updates read receipt for user in conversation
 * @param {string} userId - User's MongoDB ID
 * @param {string} conversationId - Conversation's MongoDB ID
 * @param {string} messageId - Last read message's MongoDB ID
 * @returns {Promise<ReadReceipt>} - Created or updated receipt
 */
readReceiptSchema.statics.markAsRead = async function (
  userId,
  conversationId,
  messageId = null
) {
  try {
    // Find existing receipt or create new one
    const receipt = await this.findOneAndUpdate(
      { userId, conversationId },
      {
        userId,
        conversationId,
        lastReadMessageId: messageId,
        lastReadAt: new Date(),
        unreadCount: 0,
      },
      {
        upsert: true, // Create if doesn't exist
        new: true, // Return updated document
        setDefaultsOnInsert: true,
      }
    );

    return receipt;
  } catch (error) {
    throw new Error(`Failed to mark as read: ${error.message}`);
  }
};

/**
 * STATIC METHOD: Get read receipt for user in conversation
 * @param {string} userId - User's MongoDB ID
 * @param {string} conversationId - Conversation's MongoDB ID
 * @returns {Promise<ReadReceipt|null>} - Read receipt or null
 */
readReceiptSchema.statics.getReceipt = async function (userId, conversationId) {
  return await this.findOne({ userId, conversationId });
};

/**
 * STATIC METHOD: Get all receipts for a conversation
 * Useful for showing who has read messages in a group
 * @param {string} conversationId - Conversation's MongoDB ID
 * @returns {Promise<Array>} - Array of read receipts
 */
readReceiptSchema.statics.getConversationReceipts = async function (conversationId) {
  return await this.find({ conversationId })
    .populate('userId', 'name avatar')
    .sort({ lastReadAt: -1 });
};

/**
 * STATIC METHOD: Update unread count for user in conversation
 * @param {string} userId - User's MongoDB ID
 * @param {string} conversationId - Conversation's MongoDB ID
 * @param {number} count - Unread count
 * @returns {Promise<ReadReceipt>} - Updated receipt
 */
readReceiptSchema.statics.updateUnreadCount = async function (
  userId,
  conversationId,
  count
) {
  return await this.findOneAndUpdate(
    { userId, conversationId },
    { unreadCount: count },
    { upsert: true, new: true }
  );
};

/**
 * STATIC METHOD: Increment unread count
 * Called when new message arrives
 * @param {string} conversationId - Conversation's MongoDB ID
 * @param {string} excludeUserId - User ID to exclude (message sender)
 * @returns {Promise<void>}
 */
readReceiptSchema.statics.incrementUnread = async function (
  conversationId,
  excludeUserId
) {
  await this.updateMany(
    {
      conversationId,
      userId: { $ne: excludeUserId }, // Exclude sender
    },
    {
      $inc: { unreadCount: 1 },
    }
  );
};

// Create unique compound index to prevent duplicate receipts
readReceiptSchema.index({ conversationId: 1, userId: 1 }, { unique: true });

// Additional indexes for queries
readReceiptSchema.index({ userId: 1, lastReadAt: -1 }); // Query receipts by user
readReceiptSchema.index({ conversationId: 1, lastReadAt: -1 }); // Query receipts by conversation
readReceiptSchema.index({ userId: 1, unreadCount: 1 }); // Query unread counts

const ReadReceipt = mongoose.model('ReadReceipt', readReceiptSchema);

export default ReadReceipt;
