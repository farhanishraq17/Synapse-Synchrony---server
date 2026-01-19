// models/Blog.js
import mongoose, { Schema } from 'mongoose';

const BlogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: ['experience', 'academic', 'campus-life', 'tips', 'story'],
      required: true,
    },
    image: {
      type: String, // Cloudinary URL
      default: null,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isPublished: {
      type: Boolean,
      default: true,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
BlogSchema.index({ author: 1, createdAt: -1 });
BlogSchema.index({ category: 1 });
BlogSchema.index({ tags: 1 });
BlogSchema.index({ isPublished: 1, createdAt: -1 });

// Virtual for like count
BlogSchema.virtual('likeCount').get(function () {
  return this.likes.length;
});

// Virtual for comment count (will be populated separately)
BlogSchema.virtual('commentCount', {
  ref: 'BlogComment',
  localField: '_id',
  foreignField: 'blogId',
  count: true,
});

// Ensure virtuals are included in JSON
BlogSchema.set('toJSON', { virtuals: true });
BlogSchema.set('toObject', { virtuals: true });

const Blog = mongoose.model('Blog', BlogSchema, 'blogs');
export default Blog;
