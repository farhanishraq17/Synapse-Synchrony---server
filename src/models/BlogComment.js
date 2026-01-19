// models/BlogComment.js
import mongoose, { Schema } from 'mongoose';

const BlogCommentSchema = new mongoose.Schema(
  {
    blogId: {
      type: Schema.Types.ObjectId,
      ref: 'Blog',
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: 'BlogComment',
      default: null, // null means it's a top-level comment
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
BlogCommentSchema.index({ blogId: 1, createdAt: -1 });
BlogCommentSchema.index({ author: 1 });
BlogCommentSchema.index({ parentComment: 1 });

// Virtual for like count
BlogCommentSchema.virtual('likeCount').get(function () {
  return this.likes.length;
});

// Virtual for reply count (will be populated separately)
BlogCommentSchema.virtual('replyCount', {
  ref: 'BlogComment',
  localField: '_id',
  foreignField: 'parentComment',
  count: true,
});

// Ensure virtuals are included in JSON
BlogCommentSchema.set('toJSON', { virtuals: true });
BlogCommentSchema.set('toObject', { virtuals: true });

const BlogComment = mongoose.model('BlogComment', BlogCommentSchema, 'blogComments');
export default BlogComment;
