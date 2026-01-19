// controllers/BlogCommentController.js
import BlogComment from '../models/BlogComment.js';
import Blog from '../models/Blog.js';
import { HttpResponse } from '../utils/HttpResponse.js';

// Add Comment to Blog
export const AddComment = async (req, res) => {
  const userId = req.userId;
  const { blogId } = req.params;
  const { content, parentComment } = req.body;

  try {
    // Validate content
    if (!content || content.trim().length === 0) {
      return HttpResponse(res, 400, true, 'Comment content is required');
    }

    // Check if blog exists
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return HttpResponse(res, 404, true, 'Blog not found');
    }

    if (!blog.isPublished) {
      return HttpResponse(res, 403, true, 'Cannot comment on unpublished blog');
    }

    // If it's a reply, check if parent comment exists
    if (parentComment) {
      const parentExists = await BlogComment.findOne({
        _id: parentComment,
        blogId,
      });
      if (!parentExists) {
        return HttpResponse(res, 404, true, 'Parent comment not found');
      }
    }

    // Create comment
    const newComment = await BlogComment.create({
      blogId,
      author: userId,
      content: content.trim(),
      parentComment: parentComment || null,
    });

    // Populate author info
    await newComment.populate('author', 'name email avatar');

    return HttpResponse(res, 201, false, 'Comment added successfully', newComment);
  } catch (error) {
    console.error('Error in AddComment:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};

// Get All Comments for a Blog
export const GetBlogComments = async (req, res) => {
  const { blogId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  try {
    // Check if blog exists
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return HttpResponse(res, 404, true, 'Blog not found');
    }

    // Build filter - only top-level comments (no parent)
    const filter = { blogId, parentComment: null };

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get comments
    const comments = await BlogComment.find(filter)
      .populate('author', 'name email avatar')
      .populate('replyCount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await BlogComment.find({ parentComment: comment._id })
          .populate('author', 'name email avatar')
          .sort({ createdAt: 1 })
          .limit(5); // Limit replies shown initially

        return {
          ...comment.toObject(),
          replies,
        };
      })
    );

    // Get total count
    const total = await BlogComment.countDocuments(filter);

    return HttpResponse(res, 200, false, 'Comments fetched successfully', {
      comments: commentsWithReplies,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalComments: total,
        commentsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Error in GetBlogComments:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};

// Get Replies for a Comment
export const GetCommentReplies = async (req, res) => {
  const { commentId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    // Check if parent comment exists
    const parentComment = await BlogComment.findById(commentId);
    if (!parentComment) {
      return HttpResponse(res, 404, true, 'Comment not found');
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get replies
    const replies = await BlogComment.find({ parentComment: commentId })
      .populate('author', 'name email avatar')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await BlogComment.countDocuments({ parentComment: commentId });

    return HttpResponse(res, 200, false, 'Replies fetched successfully', {
      replies,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalReplies: total,
        repliesPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Error in GetCommentReplies:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};

// Update Comment
export const UpdateComment = async (req, res) => {
  const userId = req.userId;
  const { commentId } = req.params;
  const { content } = req.body;

  try {
    // Validate content
    if (!content || content.trim().length === 0) {
      return HttpResponse(res, 400, true, 'Comment content is required');
    }

    // Find comment
    const comment = await BlogComment.findById(commentId);
    if (!comment) {
      return HttpResponse(res, 404, true, 'Comment not found');
    }

    // Check if user is the author
    if (comment.author.toString() !== userId) {
      return HttpResponse(res, 403, true, 'You are not authorized to update this comment');
    }

    // Update comment
    comment.content = content.trim();
    await comment.save();

    // Populate author info
    await comment.populate('author', 'name email avatar');

    return HttpResponse(res, 200, false, 'Comment updated successfully', comment);
  } catch (error) {
    console.error('Error in UpdateComment:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};

// Delete Comment
export const DeleteComment = async (req, res) => {
  const userId = req.userId;
  const { commentId } = req.params;

  try {
    // Find comment
    const comment = await BlogComment.findById(commentId);
    if (!comment) {
      return HttpResponse(res, 404, true, 'Comment not found');
    }

    // Check if user is the author
    if (comment.author.toString() !== userId) {
      return HttpResponse(res, 403, true, 'You are not authorized to delete this comment');
    }

    // Delete all replies to this comment
    await BlogComment.deleteMany({ parentComment: commentId });

    // Delete comment
    await BlogComment.findByIdAndDelete(commentId);

    return HttpResponse(res, 200, false, 'Comment and replies deleted successfully');
  } catch (error) {
    console.error('Error in DeleteComment:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};

// Toggle Like on Comment
export const ToggleLikeComment = async (req, res) => {
  const userId = req.userId;
  const { commentId } = req.params;

  try {
    // Find comment
    const comment = await BlogComment.findById(commentId);
    if (!comment) {
      return HttpResponse(res, 404, true, 'Comment not found');
    }

    // Check if user already liked
    const hasLiked = comment.likes.includes(userId);

    let updatedComment;
    if (hasLiked) {
      // Unlike
      updatedComment = await BlogComment.findByIdAndUpdate(
        commentId,
        { $pull: { likes: userId } },
        { new: true }
      ).populate('author', 'name email avatar');
    } else {
      // Like
      updatedComment = await BlogComment.findByIdAndUpdate(
        commentId,
        { $addToSet: { likes: userId } },
        { new: true }
      ).populate('author', 'name email avatar');
    }

    return HttpResponse(
      res,
      200,
      false,
      hasLiked ? 'Comment unliked successfully' : 'Comment liked successfully',
      updatedComment
    );
  } catch (error) {
    console.error('Error in ToggleLikeComment:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};
