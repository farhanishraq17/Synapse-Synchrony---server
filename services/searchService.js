import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import mongoose from 'mongoose';

/**
 * Search Service
 * Business logic for searching users and conversations
 */

// ==========================================
// USER SEARCH
// ==========================================

/**
 * Search users by name or email
 * @param {String} query - Search query string
 * @param {String} currentUserId - User performing the search (to exclude from results)
 * @param {Object} options - { limit }
 * @returns {Promise<Array>} - Array of users
 */
export const searchUsers = async (query, currentUserId, options = {}) => {
  // Validate query
  if (!query || typeof query !== 'string') {
    const error = new Error('Search query is required');
    error.statusCode = 400;
    throw error;
  }

  const trimmedQuery = query.trim();

  // Minimum query length
  if (trimmedQuery.length < 2) {
    const error = new Error('Search query must be at least 2 characters');
    error.statusCode = 400;
    throw error;
  }

  // Maximum query length
  if (trimmedQuery.length > 50) {
    const error = new Error('Search query cannot exceed 50 characters');
    error.statusCode = 400;
    throw error;
  }

  const limit = Math.min(20, Math.max(1, parseInt(options.limit) || 20));

  // Build search query using regex for partial matching
  const searchRegex = new RegExp(trimmedQuery, 'i'); // Case-insensitive

  const users = await User.find({
    _id: { $ne: currentUserId }, // Exclude current user
    isActive: true, // Only active users
    $or: [
      { name: searchRegex },
      { email: searchRegex },
    ],
  })
    .select('name email avatar isVerified createdAt')
    .limit(limit)
    .lean();

  return users;
};

/**
 * Get user by ID (for starting conversations)
 * @param {String} userId - User ID to fetch
 * @param {String} currentUserId - User performing the lookup
 * @returns {Promise<User>} - User document
 */
export const getUserById = async (userId, currentUserId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const error = new Error('Invalid user ID');
    error.statusCode = 400;
    throw error;
  }

  // Prevent self-lookup
  if (userId === currentUserId) {
    const error = new Error('Cannot lookup yourself');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(userId)
    .select('name email avatar isVerified isActive createdAt');

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('User account is inactive');
    error.statusCode = 400;
    throw error;
  }

  return user;
};

// ==========================================
// CONVERSATION SEARCH
// ==========================================

/**
 * Search user's conversations by name or participant name
 * @param {String} query - Search query string
 * @param {String} userId - User performing the search
 * @param {Object} options - { limit }
 * @returns {Promise<Array>} - Array of conversations
 */
export const searchConversations = async (query, userId, options = {}) => {
  // Validate query
  if (!query || typeof query !== 'string') {
    const error = new Error('Search query is required');
    error.statusCode = 400;
    throw error;
  }

  const trimmedQuery = query.trim();

  // Minimum query length
  if (trimmedQuery.length < 1) {
    const error = new Error('Search query must be at least 1 character');
    error.statusCode = 400;
    throw error;
  }

  // Maximum query length
  if (trimmedQuery.length > 50) {
    const error = new Error('Search query cannot exceed 50 characters');
    error.statusCode = 400;
    throw error;
  }

  const limit = Math.min(50, Math.max(1, parseInt(options.limit) || 20));

  // Build search query
  const searchRegex = new RegExp(trimmedQuery, 'i');

  // First, get all user's conversations
  const conversations = await Conversation.find({
    'participants.userId': userId,
  })
    .populate('participants.userId', 'name email avatar')
    .populate('lastMessage.senderId', 'name avatar')
    .populate('createdBy', 'name avatar')
    .sort({ updatedAt: -1 })
    .lean();

  // Filter conversations by:
  // 1. Group name (for groups)
  // 2. Participant names (for both direct and groups)
  const filteredConversations = conversations.filter(conv => {
    // Search in group name
    if (conv.type === 'group' && conv.name && searchRegex.test(conv.name)) {
      return true;
    }

    // Search in participant names
    const participantMatch = conv.participants.some(p => {
      return p.userId && (
        searchRegex.test(p.userId.name) || 
        searchRegex.test(p.userId.email)
      );
    });

    return participantMatch;
  });

  // Limit results
  return filteredConversations.slice(0, limit);
};

/**
 * Get recent conversations for user (for autocomplete/suggestions)
 * @param {String} userId - User ID
 * @param {Number} limit - Max results
 * @returns {Promise<Array>} - Array of recent conversations
 */
export const getRecentConversations = async (userId, limit = 5) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const error = new Error('Invalid user ID');
    error.statusCode = 400;
    throw error;
  }

  const conversations = await Conversation.find({
    'participants.userId': userId,
    lastMessage: { $exists: true }, // Only conversations with messages
  })
    .populate('participants.userId', 'name avatar')
    .populate('lastMessage.senderId', 'name avatar')
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean();

  return conversations;
};

/**
 * Get suggested users (users in same conversations)
 * @param {String} userId - Current user ID
 * @param {Number} limit - Max results
 * @returns {Promise<Array>} - Array of suggested users
 */
export const getSuggestedUsers = async (userId, limit = 10) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const error = new Error('Invalid user ID');
    error.statusCode = 400;
    throw error;
  }

  // Get all conversations user is in
  const conversations = await Conversation.find({
    'participants.userId': userId,
  }).select('participants');

  // Extract unique user IDs from participants
  const userIds = new Set();
  conversations.forEach(conv => {
    conv.participants.forEach(p => {
      const id = p.userId.toString();
      if (id !== userId.toString()) {
        userIds.add(id);
      }
    });
  });

  // Fetch user details
  const users = await User.find({
    _id: { $in: Array.from(userIds) },
    isActive: true,
  })
    .select('name email avatar isVerified')
    .limit(limit)
    .lean();

  return users;
};
