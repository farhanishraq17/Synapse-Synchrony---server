import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

/**
 * Conversation Service
 * Centralized business logic and authorization for conversations
 * Used by both REST API and Socket.IO handlers
 */

// ==========================================
// AUTHORIZATION HELPERS
// ==========================================

/**
 * Check if user is a member of a conversation (boolean return)
 * Use this for non-critical checks where you just need a yes/no answer
 * 
 * @param {string} userId - User's MongoDB ID
 * @param {string} conversationId - Conversation's MongoDB ID
 * @returns {Promise<boolean>} - True if user is a member
 */
export const isConversationMember = async (userId, conversationId) => {
  try {
    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(userId) || 
        !mongoose.Types.ObjectId.isValid(conversationId)) {
      return false;
    }

    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return false;
    }

    return conversation.isParticipant(userId);
  } catch (error) {
    console.error('Error checking conversation membership:', error);
    return false;
  }
};

/**
 * Assert user is a member of conversation (throws error if not)
 * Use this in routes/handlers where membership is required
 * 
 * @param {string} userId - User's MongoDB ID
 * @param {string} conversationId - Conversation's MongoDB ID
 * @throws {Error} - 403 if not a member, 404 if conversation not found
 * @returns {Promise<Conversation>} - Conversation document if authorized
 */
export const assertUserIsMember = async (userId, conversationId) => {
  // Validate ObjectIds
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const error = new Error('Invalid user ID');
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    const error = new Error('Invalid conversation ID');
    error.statusCode = 400;
    throw error;
  }

  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    const error = new Error('Conversation not found');
    error.statusCode = 404;
    throw error;
  }

  if (!conversation.isParticipant(userId)) {
    const error = new Error('Access denied. You are not a member of this conversation.');
    error.statusCode = 403;
    throw error;
  }

  return conversation;
};

/**
 * Check if user can moderate conversation (admin or moderator role)
 * Use this for admin-only actions like renaming groups, removing members
 * 
 * @param {string} userId - User's MongoDB ID
 * @param {string} conversationId - Conversation's MongoDB ID
 * @throws {Error} - 403 if insufficient permissions
 * @returns {Promise<Object>} - { conversation, user } if authorized
 */
export const assertUserCanModerate = async (userId, conversationId) => {
  // First verify user is a member
  const conversation = await assertUserIsMember(userId, conversationId);

  // Get user to check global roles
  const user = await User.findById(userId);

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // Check if user has global admin/moderator role
  const hasGlobalModeratorRole = 
    user.roles.includes('admin') || 
    user.roles.includes('moderator');

  // Check if user is conversation admin
  const isConversationAdmin = conversation.isAdmin(userId);

  // Allow if either global moderator OR conversation admin
  if (!hasGlobalModeratorRole && !isConversationAdmin) {
    const error = new Error(
      'Insufficient permissions. Only conversation admins or system moderators can perform this action.'
    );
    error.statusCode = 403;
    throw error;
  }

  return { conversation, user };
};

/**
 * Check if user is creator of conversation
 * Use this for actions only creator can perform
 * 
 * @param {string} userId - User's MongoDB ID
 * @param {string} conversationId - Conversation's MongoDB ID
 * @throws {Error} - 403 if not creator
 * @returns {Promise<Conversation>} - Conversation document if authorized
 */
export const assertUserIsCreator = async (userId, conversationId) => {
  const conversation = await assertUserIsMember(userId, conversationId);

  if (conversation.createdBy.toString() !== userId.toString()) {
    const error = new Error('Only the conversation creator can perform this action.');
    error.statusCode = 403;
    throw error;
  }

  return conversation;
};

// ==========================================
// CONVERSATION RETRIEVAL
// ==========================================

/**
 * Get all conversations for a user with pagination and population
 * 
 * @param {string} userId - User's MongoDB ID
 * @param {Object} options - Pagination and sorting options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 20, max: 100)
 * @param {string} options.sortBy - Sort field (default: 'updatedAt')
 * @param {string} options.sortOrder - Sort order 'asc' or 'desc' (default: 'desc')
 * @returns {Promise<Object>} - { conversations, pagination }
 */
export const getUserConversations = async (userId, options = {}) => {
  // Validate user ID
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const error = new Error('Invalid user ID');
    error.statusCode = 400;
    throw error;
  }

  // Parse and validate options
  const page = Math.max(1, parseInt(options.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(options.limit) || 20));
  const skip = (page - 1) * limit;
  const sortBy = options.sortBy || 'updatedAt';
  const sortOrder = options.sortOrder === 'asc' ? 1 : -1;

  // Build sort object
  const sort = { [sortBy]: sortOrder };

  // Execute query with pagination
  const [conversations, totalCount] = await Promise.all([
    Conversation.find({ 'participants.userId': userId })
      .populate('participants.userId', 'name email avatar isActive')
      .populate('lastMessage.senderId', 'name avatar')
      .populate('createdBy', 'name avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(), // Use lean() for better performance since we're just reading
    
    Conversation.countDocuments({ 'participants.userId': userId })
  ]);

  // Calculate pagination metadata
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    conversations,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      limit,
      hasNextPage,
      hasPrevPage,
    },
  };
};

/**
 * Get single conversation by ID with full details
 * 
 * @param {string} conversationId - Conversation's MongoDB ID
 * @param {string} requestingUserId - User requesting the conversation (for auth)
 * @returns {Promise<Conversation>} - Full conversation document
 */
export const getConversationById = async (conversationId, requestingUserId) => {
  // Verify user has access
  const conversation = await assertUserIsMember(requestingUserId, conversationId);

  // Populate related data
  await conversation.populate([
    { path: 'participants.userId', select: 'name email avatar isActive lastLogin' },
    { path: 'lastMessage.senderId', select: 'name avatar' },
    { path: 'createdBy', select: 'name avatar' },
  ]);

  return conversation;
};

// ==========================================
// CONVERSATION CREATION
// ==========================================

/**
 * Create or get existing direct conversation between two users
 * Idempotent: Returns existing conversation if already exists
 * 
 * @param {string} userId1 - First user's ID (requester)
 * @param {string} userId2 - Second user's ID (target)
 * @returns {Promise<Object>} - { conversation, isNew }
 */
export const createOrGetDirectConversation = async (userId1, userId2) => {
  // Validate IDs
  if (!mongoose.Types.ObjectId.isValid(userId1) || 
      !mongoose.Types.ObjectId.isValid(userId2)) {
    const error = new Error('Invalid user ID');
    error.statusCode = 400;
    throw error;
  }

  // Prevent self-conversation
  if (userId1.toString() === userId2.toString()) {
    const error = new Error('Cannot create conversation with yourself');
    error.statusCode = 400;
    throw error;
  }

  // Check if both users exist
  const [user1, user2] = await Promise.all([
    User.findById(userId1),
    User.findById(userId2),
  ]);

  if (!user1 || !user2) {
    const error = new Error('One or both users not found');
    error.statusCode = 404;
    throw error;
  }

  // Check if both users are active
  if (!user1.isActive || !user2.isActive) {
    const error = new Error('Cannot create conversation with inactive user');
    error.statusCode = 400;
    throw error;
  }

  // Try to find existing direct conversation
  const existingConversation = await Conversation.findOne({
    type: 'direct',
    'participants.userId': { $all: [userId1, userId2] },
    'participants.1': { $exists: true }, // Ensure exactly 2 participants
    'participants.2': { $exists: false }, // Ensure exactly 2 participants
  })
    .populate('participants.userId', 'name email avatar')
    .populate('lastMessage.senderId', 'name avatar');

  if (existingConversation) {
    return { conversation: existingConversation, isNew: false };
  }

  // Create new direct conversation
  const newConversation = new Conversation({
    type: 'direct',
    participants: [
      { userId: userId1, role: 'member' },
      { userId: userId2, role: 'member' },
    ],
    createdBy: userId1,
  });

  await newConversation.save();

  // Populate before returning
  await newConversation.populate([
    { path: 'participants.userId', select: 'name email avatar' },
    { path: 'createdBy', select: 'name avatar' },
  ]);

  return { conversation: newConversation, isNew: true };
};

/**
 * Create new group conversation
 * 
 * @param {string} creatorId - User creating the group
 * @param {Object} groupData - { name, participantIds }
 * @returns {Promise<Conversation>} - New group conversation
 */
export const createGroupConversation = async (creatorId, groupData) => {
  const { name, participantIds } = groupData;

  // Validate creator ID
  if (!mongoose.Types.ObjectId.isValid(creatorId)) {
    const error = new Error('Invalid creator ID');
    error.statusCode = 400;
    throw error;
  }

  // Validate group name
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    const error = new Error('Group name is required');
    error.statusCode = 400;
    throw error;
  }

  if (name.trim().length > 100) {
    const error = new Error('Group name cannot exceed 100 characters');
    error.statusCode = 400;
    throw error;
  }

  // Validate participant IDs
  if (!Array.isArray(participantIds) || participantIds.length < 1) {
    const error = new Error('At least one additional participant is required for group chats');
    error.statusCode = 400;
    throw error;
  }

  if (participantIds.length > 100) {
    const error = new Error('Cannot create group with more than 100 participants');
    error.statusCode = 400;
    throw error;
  }

  // Validate all participant IDs
  const invalidIds = participantIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
  if (invalidIds.length > 0) {
    const error = new Error('Invalid participant IDs');
    error.statusCode = 400;
    error.details = { invalidIds };
    throw error;
  }

  // Add creator to participants if not already included
  const uniqueParticipantIds = [...new Set([creatorId, ...participantIds])];

  // Verify all participants exist and are active
  const users = await User.find({
    _id: { $in: uniqueParticipantIds },
  });

  if (users.length !== uniqueParticipantIds.length) {
    const error = new Error('One or more participants not found');
    error.statusCode = 404;
    throw error;
  }

  const inactiveUsers = users.filter(user => !user.isActive);
  if (inactiveUsers.length > 0) {
    const error = new Error('Cannot add inactive users to group');
    error.statusCode = 400;
    error.details = { inactiveUserIds: inactiveUsers.map(u => u._id) };
    throw error;
  }

  // Create participants array (creator is admin, others are members)
  const participants = uniqueParticipantIds.map(userId => ({
    userId,
    role: userId.toString() === creatorId.toString() ? 'admin' : 'member',
  }));

  // Create group conversation
  const groupConversation = new Conversation({
    type: 'group',
    name: name.trim(),
    participants,
    createdBy: creatorId,
  });

  await groupConversation.save();

  // Populate before returning
  await groupConversation.populate([
    { path: 'participants.userId', select: 'name email avatar' },
    { path: 'createdBy', select: 'name avatar' },
  ]);

  return groupConversation;
};

// ==========================================
// CONVERSATION UPDATES
// ==========================================

/**
 * Update group conversation name
 * Only admins and moderators can rename
 * 
 * @param {string} conversationId - Conversation's MongoDB ID
 * @param {string} userId - User requesting the update
 * @param {string} newName - New conversation name
 * @returns {Promise<Conversation>} - Updated conversation
 */
export const updateConversationName = async (conversationId, userId, newName) => {
  // Verify user can moderate
  const { conversation } = await assertUserCanModerate(userId, conversationId);

  // Validate conversation type
  if (conversation.type !== 'group') {
    const error = new Error('Cannot rename direct conversations');
    error.statusCode = 400;
    throw error;
  }

  // Validate new name
  if (!newName || typeof newName !== 'string' || newName.trim().length === 0) {
    const error = new Error('Group name cannot be empty');
    error.statusCode = 400;
    throw error;
  }

  if (newName.trim().length > 100) {
    const error = new Error('Group name cannot exceed 100 characters');
    error.statusCode = 400;
    throw error;
  }

  // Update name
  conversation.name = newName.trim();
  await conversation.save();

  return conversation;
};

/**
 * Add member to group conversation
 * Only admins can add members
 * 
 * @param {string} conversationId - Conversation's MongoDB ID
 * @param {string} requestingUserId - User requesting the addition
 * @param {string} newMemberId - User ID to add
 * @returns {Promise<Conversation>} - Updated conversation
 */
export const addConversationMember = async (conversationId, requestingUserId, newMemberId) => {
  // Verify requesting user can moderate
  const { conversation } = await assertUserCanModerate(requestingUserId, conversationId);

  // Validate conversation type
  if (conversation.type !== 'group') {
    const error = new Error('Cannot add members to direct conversations');
    error.statusCode = 400;
    throw error;
  }

  // Validate new member ID
  if (!mongoose.Types.ObjectId.isValid(newMemberId)) {
    const error = new Error('Invalid user ID');
    error.statusCode = 400;
    throw error;
  }

  // Check if user is already a member
  if (conversation.isParticipant(newMemberId)) {
    const error = new Error('User is already a member of this conversation');
    error.statusCode = 400;
    throw error;
  }

  // Verify new member exists and is active
  const newMember = await User.findById(newMemberId);
  if (!newMember) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (!newMember.isActive) {
    const error = new Error('Cannot add inactive user to conversation');
    error.statusCode = 400;
    throw error;
  }

  // Add member
  conversation.participants.push({
    userId: newMemberId,
    role: 'member',
    joinedAt: new Date(),
  });

  await conversation.save();

  // Populate new member info
  await conversation.populate('participants.userId', 'name email avatar');

  return conversation;
};

/**
 * Remove member from group conversation
 * Admins can remove anyone, users can remove themselves
 * 
 * @param {string} conversationId - Conversation's MongoDB ID
 * @param {string} requestingUserId - User requesting the removal
 * @param {string} memberToRemoveId - User ID to remove
 * @returns {Promise<Conversation>} - Updated conversation
 */
export const removeConversationMember = async (conversationId, requestingUserId, memberToRemoveId) => {
  // First verify requesting user is a member
  const conversation = await assertUserIsMember(requestingUserId, conversationId);

  // Validate conversation type
  if (conversation.type !== 'group') {
    const error = new Error('Cannot remove members from direct conversations');
    error.statusCode = 400;
    throw error;
  }

  // Validate member to remove ID
  if (!mongoose.Types.ObjectId.isValid(memberToRemoveId)) {
    const error = new Error('Invalid user ID');
    error.statusCode = 400;
    throw error;
  }

  // Check if member to remove is actually in conversation
  if (!conversation.isParticipant(memberToRemoveId)) {
    const error = new Error('User is not a member of this conversation');
    error.statusCode = 400;
    throw error;
  }

  const isSelfRemoval = requestingUserId.toString() === memberToRemoveId.toString();

  // If not self-removal, verify requesting user can moderate
  if (!isSelfRemoval) {
    await assertUserCanModerate(requestingUserId, conversationId);
  }

  // Prevent removing last member
  if (conversation.participants.length <= 1) {
    const error = new Error('Cannot remove the last member of a conversation');
    error.statusCode = 400;
    throw error;
  }

  // Remove member
  conversation.participants = conversation.participants.filter(
    p => p.userId.toString() !== memberToRemoveId.toString()
  );

  // If removed user was the only admin, promote another member
  const remainingAdmins = conversation.participants.filter(p => p.role === 'admin');
  if (remainingAdmins.length === 0 && conversation.participants.length > 0) {
    conversation.participants[0].role = 'admin';
  }

  await conversation.save();

  return conversation;
};

/**
 * Update last message for conversation (called after new message)
 * 
 * @param {string} conversationId - Conversation's MongoDB ID
 * @param {Object} messageData - { content, senderId, timestamp }
 * @returns {Promise<Conversation>} - Updated conversation
 */
export const updateLastMessage = async (conversationId, messageData) => {
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    const error = new Error('Conversation not found');
    error.statusCode = 404;
    throw error;
  }

  // Truncate content to 200 characters for preview
  const truncatedContent = messageData.content?.length > 200
    ? messageData.content.substring(0, 197) + '...'
    : messageData.content;

  conversation.lastMessage = {
    content: truncatedContent,
    senderId: messageData.senderId,
    timestamp: messageData.timestamp || new Date(),
  };

  await conversation.save();

  return conversation;
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get conversation participant count
 * 
 * @param {string} conversationId - Conversation's MongoDB ID
 * @returns {Promise<number>} - Number of participants
 */
export const getParticipantCount = async (conversationId) => {
  const conversation = await Conversation.findById(conversationId);
  
  if (!conversation) {
    const error = new Error('Conversation not found');
    error.statusCode = 404;
    throw error;
  }

  return conversation.participants.length;
};

/**
 * Check if conversation is group
 * 
 * @param {string} conversationId - Conversation's MongoDB ID
 * @returns {Promise<boolean>} - True if group conversation
 */
export const isGroupConversation = async (conversationId) => {
  const conversation = await Conversation.findById(conversationId);
  return conversation?.type === 'group';
};
