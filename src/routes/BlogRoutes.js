// routes/BlogRoutes.js
import express from 'express';
import { VerifyToken } from '../middlewares/VeriyToken.js';
import {
  CreateBlog,
  GetAllBlogs,
  GetSingleBlog,
  UpdateBlog,
  DeleteBlog,
  ToggleLikeBlog,
  IncrementBlogView,
  GetMyBlogs,
  GetPopularBlogs,
  GenerateBlogWithAI,
  SummarizeBlog,
} from '../controllers/BlogController.js';
import {
  AddComment,
  GetBlogComments,
  GetCommentReplies,
  UpdateComment,
  DeleteComment,
  ToggleLikeComment,
} from '../controllers/BlogCommentController.js';

const router = express.Router();

// ========== BLOG ROUTES ==========

// Public routes (anyone can view blogs)
router.get('/', GetAllBlogs);
router.get('/popular', GetPopularBlogs);
router.get('/:id', GetSingleBlog);
router.patch('/:id/view', IncrementBlogView);

// Protected routes (require authentication)
router.post('/', VerifyToken, CreateBlog);
router.put('/:id', VerifyToken, UpdateBlog);
router.delete('/:id', VerifyToken, DeleteBlog);
router.patch('/:id/like', VerifyToken, ToggleLikeBlog);
router.get('/user/my-blogs', VerifyToken, GetMyBlogs);

// ========== COMMENT ROUTES ==========

// Public routes (anyone can view comments)
router.get('/:blogId/comments', GetBlogComments);
router.get('/comments/:commentId/replies', GetCommentReplies);

// Protected routes (require authentication)
router.post('/:blogId/comments', VerifyToken, AddComment);
router.put('/comments/:commentId', VerifyToken, UpdateComment);
router.delete('/comments/:commentId', VerifyToken, DeleteComment);
router.patch('/comments/:commentId/like', VerifyToken, ToggleLikeComment);

// ========== AI ROUTES ==========

// AI-powered features (require authentication)
router.post('/ai/generate', VerifyToken, GenerateBlogWithAI);
router.get('/:id/ai/summarize', SummarizeBlog);

export default router;
