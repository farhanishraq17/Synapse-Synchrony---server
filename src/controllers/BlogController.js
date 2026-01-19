// controllers/BlogController.js
import Blog from '../models/Blog.js';
import BlogComment from '../models/BlogComment.js';
import { HttpResponse } from '../utils/HttpResponse.js';
import cloudinary from '../config/cloudinary.js';

// Create Blog
export const CreateBlog = async (req, res) => {
  const userId = req.userId;
  const { title, content, category, image, tags } = req.body;

  try {
    // Validate required fields
    if (!title || !content || !category) {
      return HttpResponse(res, 400, true, 'Missing required fields');
    }

    // Upload image to Cloudinary if provided
    let imageUrl = null;
    if (image) {
      try {
        const uploadRes = await cloudinary.uploader.upload(image, {
          folder: 'synapse_blogs',
          resource_type: 'auto',
        });
        imageUrl = uploadRes.secure_url;
      } catch (uploadErr) {
        console.error('Cloudinary Upload Error:', uploadErr);
        return HttpResponse(res, 500, true, 'Image upload failed');
      }
    }

    // Create blog
    const newBlog = await Blog.create({
      title,
      content,
      category,
      author: userId,
      image: imageUrl,
      tags: tags || [],
    });

    // Populate author info
    await newBlog.populate('author', 'name email avatar');

    return HttpResponse(res, 201, false, 'Blog created successfully', newBlog);
  } catch (error) {
    console.error('Error in CreateBlog:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};

// Get All Blogs (with filters and pagination)
export const GetAllBlogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      search,
      tags,
      authorId,
    } = req.query;

    // Build filter query
    const filter = { isPublished: true };

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    if (tags) {
      const tagArray = tags.split(',').map((tag) => tag.trim());
      filter.tags = { $in: tagArray };
    }

    if (authorId) {
      filter.author = authorId;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const blogs = await Blog.find(filter)
      .populate('author', 'name email avatar')
      .populate('commentCount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Blog.countDocuments(filter);

    return HttpResponse(res, 200, false, 'Blogs fetched successfully', {
      blogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalBlogs: total,
        blogsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Error in GetAllBlogs:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};

// Get Single Blog
export const GetSingleBlog = async (req, res) => {
  const { id } = req.params;

  try {
    const blog = await Blog.findById(id)
      .populate('author', 'name email avatar')
      .populate('commentCount');

    if (!blog) {
      return HttpResponse(res, 404, true, 'Blog not found');
    }

    if (!blog.isPublished) {
      return HttpResponse(res, 403, true, 'This blog is not published');
    }

    return HttpResponse(res, 200, false, 'Blog fetched successfully', blog);
  } catch (error) {
    console.error('Error in GetSingleBlog:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};

// Update Blog
export const UpdateBlog = async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  const updateData = req.body;

  try {
    // Find blog
    const blog = await Blog.findById(id);
    if (!blog) {
      return HttpResponse(res, 404, true, 'Blog not found');
    }

    // Check if user is the author
    if (blog.author.toString() !== userId) {
      return HttpResponse(res, 403, true, 'You are not authorized to update this blog');
    }

    // Handle image upload if provided
    if (updateData.image && updateData.image.startsWith('data:image')) {
      try {
        const uploadRes = await cloudinary.uploader.upload(updateData.image, {
          folder: 'synapse_blogs',
          resource_type: 'auto',
        });
        updateData.image = uploadRes.secure_url;
      } catch (uploadErr) {
        console.error('Cloudinary Upload Error:', uploadErr);
        return HttpResponse(res, 500, true, 'Image upload failed');
      }
    }

    // Update blog
    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('author', 'name email avatar')
      .populate('commentCount');

    return HttpResponse(res, 200, false, 'Blog updated successfully', updatedBlog);
  } catch (error) {
    console.error('Error in UpdateBlog:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};

// Delete Blog
export const DeleteBlog = async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  try {
    // Find blog
    const blog = await Blog.findById(id);
    if (!blog) {
      return HttpResponse(res, 404, true, 'Blog not found');
    }

    // Check if user is the author
    if (blog.author.toString() !== userId) {
      return HttpResponse(res, 403, true, 'You are not authorized to delete this blog');
    }

    // Delete all comments associated with this blog
    await BlogComment.deleteMany({ blogId: id });

    // Delete blog
    await Blog.findByIdAndDelete(id);

    return HttpResponse(res, 200, false, 'Blog and associated comments deleted successfully');
  } catch (error) {
    console.error('Error in DeleteBlog:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};

// Toggle Like on Blog
export const ToggleLikeBlog = async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  try {
    // Find blog
    const blog = await Blog.findById(id);
    if (!blog) {
      return HttpResponse(res, 404, true, 'Blog not found');
    }

    // Check if user already liked
    const hasLiked = blog.likes.includes(userId);

    let updatedBlog;
    if (hasLiked) {
      // Unlike
      updatedBlog = await Blog.findByIdAndUpdate(
        id,
        { $pull: { likes: userId } },
        { new: true }
      )
        .populate('author', 'name email avatar')
        .populate('commentCount');
    } else {
      // Like
      updatedBlog = await Blog.findByIdAndUpdate(
        id,
        { $addToSet: { likes: userId } },
        { new: true }
      )
        .populate('author', 'name email avatar')
        .populate('commentCount');
    }

    return HttpResponse(
      res,
      200,
      false,
      hasLiked ? 'Blog unliked successfully' : 'Blog liked successfully',
      updatedBlog
    );
  } catch (error) {
    console.error('Error in ToggleLikeBlog:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};

// Increment View Count
export const IncrementBlogView = async (req, res) => {
  const { id } = req.params;

  try {
    const blog = await Blog.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('author', 'name email avatar')
      .populate('commentCount');

    if (!blog) {
      return HttpResponse(res, 404, true, 'Blog not found');
    }

    return HttpResponse(res, 200, false, 'View count updated', blog);
  } catch (error) {
    console.error('Error in IncrementBlogView:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};

// Get User's Blogs
export const GetMyBlogs = async (req, res) => {
  const userId = req.userId;

  try {
    const blogs = await Blog.find({ author: userId })
      .populate('author', 'name email avatar')
      .populate('commentCount')
      .sort({ createdAt: -1 });

    return HttpResponse(res, 200, false, 'Your blogs fetched successfully', blogs);
  } catch (error) {
    console.error('Error in GetMyBlogs:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};

// Get Popular Blogs (by likes and views)
export const GetPopularBlogs = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const blogs = await Blog.aggregate([
      { $match: { isPublished: true } },
      {
        $addFields: {
          likeCount: { $size: '$likes' },
          popularity: { $add: [{ $size: '$likes' }, { $divide: ['$views', 10] }] },
        },
      },
      { $sort: { popularity: -1 } },
      { $limit: parseInt(limit) },
    ]);

    // Populate author info
    await Blog.populate(blogs, { path: 'author', select: 'name email avatar' });

    return HttpResponse(res, 200, false, 'Popular blogs fetched successfully', blogs);
  } catch (error) {
    console.error('Error in GetPopularBlogs:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};
