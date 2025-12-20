import * as conversationService from '../services/conversationService.js';
import Conversation from '../models/Conversation.js';

/**
 * @desc    Create or get existing direct conversation
 * @route   POST /api/conversations/direct
 * @access  Private
 */
export const createDirectConversation = async (req, res) => {
  try {
    const { participantId } = req.body;
    const currentUserId = req.userId; // From auth middleware

    // Prevent self-conversation
    if (currentUserId === participantId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create conversation with yourself',
      });
    }

    // Create or get conversation
    const { conversation, isNew } = await conversationService.createOrGetDirectConversation(
      currentUserId,
      participantId
    );

    res.status(isNew ? 201 : 200).json({
      success: true,
      message: isNew ? 'Direct conversation created successfully' : 'Direct conversation already exists',
      data: {
        conversation,
        isNew,
      },
    });
  } catch (error) {
    console.error('Create direct conversation error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to create conversation',
    });
  }
};

/**
 * @desc    Create group conversation
 * @route   POST /api/conversations/group
 * @access  Private
 */
export const createGroupConversation = async (req, res) => {
  try {
    const { name, participantIds } = req.body;
    const currentUserId = req.userId;

    // Create group
    const conversation = await conversationService.createGroupConversation(
      currentUserId,
      { name, participantIds }
    );

    res.status(201).json({
      success: true,
      message: 'Group conversation created successfully',
      data: {
        conversation,
      },
    });
  } catch (error) {
    console.error('Create group conversation error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to create group conversation',
      errors: error.details || undefined,
    });
  }
};

/**
 * @desc    Get user's conversations with pagination
 * @route   GET /api/conversations
 * @access  Private
 */
export const getUserConversations = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const { page, limit, sortBy, sortOrder } = req.query;

    const result = await conversationService.getUserConversations(currentUserId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      sortBy: sortBy || 'updatedAt',
      sortOrder: sortOrder || 'desc',
    });

    res.status(200).json({
      success: true,
      message: 'Conversations retrieved successfully',
      data: result,
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to retrieve conversations',
    });
  }
};

/**
 * @desc    Get single conversation by ID
 * @route   GET /api/conversations/:id
 * @access  Private (member only)
 */
export const getConversationById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.userId;

    const conversation = await conversationService.getConversationById(id, currentUserId);

    res.status(200).json({
      success: true,
      message: 'Conversation retrieved successfully',
      data: {
        conversation,
      },
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to retrieve conversation',
    });
  }
};

/**
 * @desc    Update group conversation name
 * @route   PATCH /api/conversations/:id/name
 * @access  Private (admin/moderator only)
 */
export const updateConversationName = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const currentUserId = req.userId;

    const conversation = await conversationService.updateConversationName(
      id,
      currentUserId,
      name
    );

    res.status(200).json({
      success: true,
      message: 'Conversation name updated successfully',
      data: {
        conversation,
      },
    });
  } catch (error) {
    console.error('Update conversation name error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update conversation name',
    });
  }
};

/**
 * @desc    Add member to group conversation
 * @route   POST /api/conversations/:id/members
 * @access  Private (admin only)
 */
export const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const currentUserId = req.userId;

    const conversation = await conversationService.addConversationMember(
      id,
      currentUserId,
      userId
    );

    res.status(200).json({
      success: true,
      message: 'Member added successfully',
      data: {
        conversation,
      },
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to add member',
    });
  }
};

/**
 * @desc    Remove member from group conversation
 * @route   DELETE /api/conversations/:id/members/:userId
 * @access  Private (admin or self-removal)
 */
export const removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const currentUserId = req.userId;

    const conversation = await conversationService.removeConversationMember(
      id,
      currentUserId,
      userId
    );

    const isSelfRemoval = currentUserId === userId;

    res.status(200).json({
      success: true,
      message: isSelfRemoval ? 'You left the conversation' : 'Member removed successfully',
      data: {
        conversation,
      },
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to remove member',
    });
  }
};

/**
 * @desc    Delete/leave conversation
 * @route   DELETE /api/conversations/:id
 * @access  Private
 */
export const deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.userId;

    // Verify user is a member
    const conversation = await conversationService.assertUserIsMember(currentUserId, id);

    if (conversation.type === 'direct') {
      // For direct conversations, just remove the user (soft delete from their view)
      await conversationService.removeConversationMember(id, currentUserId, currentUserId);
      
      return res.status(200).json({
        success: true,
        message: 'Conversation deleted',
      });
    } else {
      // For groups, remove the user (leave group)
      const updatedConversation = await conversationService.removeConversationMember(
        id,
        currentUserId,
        currentUserId
      );

      // If group is now empty, delete it completely
      if (updatedConversation.participants.length === 0) {
        await Conversation.findByIdAndDelete(id);
        return res.status(200).json({
          success: true,
          message: 'Conversation deleted (no members remaining)',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'You left the group',
      });
    }
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to delete conversation',
    });
  }
};
