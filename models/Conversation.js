import mongoose from 'mongoose';

/**
 * Conversation Schema
 * Supports both 1:1 direct chats and group conversations
 * Tracks participants, roles, and last message for preview
 */
const conversationSchema = new mongoose.Schema(
  {
    // Conversation type
    type: {
      type: String,
      enum: ['direct', 'group'],
      required: [true, 'Conversation type is required'],
      default: 'direct',
    },

    // Conversation name (required for groups, optional for direct)
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Conversation name cannot exceed 100 characters'],
      validate: {
        validator: function (value) {
          // Name is required for group chats
          if (this.type === 'group' && !value) {
            return false;
          }
          return true;
        },
        message: 'Group conversations must have a name',
      },
    },

    // Embedded participants array
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['member', 'admin'],
          default: 'member',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Creator of the conversation
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Conversation creator is required'],
    },

    // Last message for conversation preview
    lastMessage: {
      content: {
        type: String,
        maxlength: 200, // Truncated preview
      },
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      timestamp: {
        type: Date,
      },
    },

    // Group avatar (optional, future-ready)
    avatar: {
      type: String, // URL to group image
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

/**
 * INSTANCE METHOD: Check if user is a participant
 * @param {string} userId - User's MongoDB ID
 * @returns {boolean} - True if user is a participant
 */
conversationSchema.methods.isParticipant = function (userId) {
  return this.participants.some(
    (participant) => participant.userId.toString() === userId.toString()
  );
};

/**
 * INSTANCE METHOD: Check if user is an admin
 * @param {string} userId - User's MongoDB ID
 * @returns {boolean} - True if user is an admin
 */
conversationSchema.methods.isAdmin = function (userId) {
  const participant = this.participants.find(
    (p) => p.userId.toString() === userId.toString()
  );
  return participant?.role === 'admin';
};

/**
 * INSTANCE METHOD: Get participant count
 * @returns {number} - Number of participants
 */
conversationSchema.methods.getParticipantCount = function () {
  return this.participants.length;
};

/**
 * STATIC METHOD: Find conversations by user ID
 * @param {string} userId - User's MongoDB ID
 * @returns {Promise<Array>} - Array of conversations
 */
conversationSchema.statics.findByUserId = async function (userId) {
  return await this.find({ 'participants.userId': userId }).sort({
    updatedAt: -1,
  });
};

/**
 * STATIC METHOD: Create or get existing direct conversation
 * @param {string} userId1 - First user's ID
 * @param {string} userId2 - Second user's ID
 * @returns {Promise<Conversation>} - Conversation document
 */
conversationSchema.statics.getOrCreateDirect = async function (userId1, userId2) {
  // Check if direct conversation already exists
  const existing = await this.findOne({
    type: 'direct',
    'participants.userId': { $all: [userId1, userId2] },
    $expr: { $eq: [{ $size: '$participants' }, 2] }, // Exactly 2 participants
  });

  if (existing) {
    return existing;
  }

  // Create new direct conversation
  return await this.create({
    type: 'direct',
    participants: [
      { userId: userId1, role: 'member' },
      { userId: userId2, role: 'member' },
    ],
    createdBy: userId1,
  });
};

// Create indexes for performance
conversationSchema.index({ 'participants.userId': 1 }); // Query conversations by participant
conversationSchema.index({ updatedAt: -1 }); // Sort by most recent activity
conversationSchema.index({ type: 1, 'participants.userId': 1 }); // Compound index for type + participant queries
conversationSchema.index({ createdBy: 1 }); // Query conversations by creator

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
