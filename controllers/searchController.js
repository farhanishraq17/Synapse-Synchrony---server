import * as searchService from '../services/searchService.js';

/**
 * @desc    Search users by name or email
 * @route   GET /api/search/users?q=searchTerm&limit=20
 * @access  Private
 */
export const searchUsers = async (req, res) => {
  try {
    const { q: query, limit } = req.query;
    const currentUserId = req.userId;

    const users = await searchService.searchUsers(query, currentUserId, { limit });

    res.status(200).json({
      success: true,
      message: 'User search completed',
      data: {
        users,
        count: users.length,
        query,
      },
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to search users',
    });
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/search/users/:userId
 * @access  Private
 */
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    const user = await searchService.getUserById(userId, currentUserId);

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get user',
    });
  }
};

/**
 * @desc    Search conversations by name or participants
 * @route   GET /api/search/conversations?q=searchTerm&limit=20
 * @access  Private
 */
export const searchConversations = async (req, res) => {
  try {
    const { q: query, limit } = req.query;
    const currentUserId = req.userId;

    const conversations = await searchService.searchConversations(
      query,
      currentUserId,
      { limit }
    );

    res.status(200).json({
      success: true,
      message: 'Conversation search completed',
      data: {
        conversations,
        count: conversations.length,
        query,
      },
    });
  } catch (error) {
    console.error('Search conversations error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to search conversations',
    });
  }
};

/**
 * @desc    Get recent conversations
 * @route   GET /api/search/recent
 * @access  Private
 */
export const getRecentConversations = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const { limit } = req.query;

    const conversations = await searchService.getRecentConversations(
      currentUserId,
      limit ? parseInt(limit) : 5
    );

    res.status(200).json({
      success: true,
      message: 'Recent conversations retrieved',
      data: {
        conversations,
        count: conversations.length,
      },
    });
  } catch (error) {
    console.error('Get recent conversations error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get recent conversations',
    });
  }
};

/**
 * @desc    Get suggested users
 * @route   GET /api/search/suggestions
 * @access  Private
 */
export const getSuggestedUsers = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const { limit } = req.query;

    const users = await searchService.getSuggestedUsers(
      currentUserId,
      limit ? parseInt(limit) : 10
    );

    res.status(200).json({
      success: true,
      message: 'Suggested users retrieved',
      data: {
        users,
        count: users.length,
      },
    });
  } catch (error) {
    console.error('Get suggested users error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get suggestions',
    });
  }
};
