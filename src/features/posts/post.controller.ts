import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { PostService } from './post.service';
import { ApiResponse } from '../../utils/response';
import { asyncHandler } from '../../middleware/async.middleware';
import { config } from '../../config';

const postService = new PostService();

export class PostController {
  createPost = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authorId = req.user!._id.toString();
    let { content, images, videos } = req.body;

    // Initialize arrays
    images = images || [];
    videos = videos || [];

    // ✅ Handle Cloudinary uploads
    if (req.files && typeof req.files === 'object') {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      // Process images - Cloudinary URLs are in file.path
      if (files.images && files.images.length > 0) {
        images = files.images.map((file: any) => {
          console.log('🖼️ Image uploaded to Cloudinary:', file.path);
          return file.path; // Cloudinary URL
        });
      }

      // Process videos - Cloudinary URLs are in file.path
      if (files.videos && files.videos.length > 0) {
        videos = files.videos.map((file: any) => {
          console.log('🎬 Video uploaded to Cloudinary:', file.path);
          return file.path; // Cloudinary URL
        });
      }
    }

    // Handle single image/video URLs from body
    if (typeof images === 'string') images = [images];
    if (typeof videos === 'string') videos = [videos];

    const post = await postService.createPost(authorId, content, images, videos);

    ApiResponse.success(res, post, 'Post created successfully', 201);
  });

  updatePost = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!._id.toString();
    const { id } = req.params;
    const updates = req.body;

    // ✅ Handle Cloudinary uploads for update
    if (req.files && typeof req.files === 'object') {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      // Process images
      if (files.images && files.images.length > 0) {
        updates.images = files.images.map((file: any) => file.path);
      }

      // Process videos
      if (files.videos && files.videos.length > 0) {
        updates.videos = files.videos.map((file: any) => file.path);
      }
    }

    const post = await postService.updatePost(id, userId, updates);

    ApiResponse.success(res, post, 'Post updated successfully');
  });


  getPostById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const post = await postService.getPostById(id);

    ApiResponse.success(res, post, 'Post retrieved successfully');
  });


  deletePost = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!._id.toString();
    const { id } = req.params;

    await postService.deletePost(id, userId);

    ApiResponse.success(res, null, 'Post deleted successfully');
  });

  likePost = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!._id.toString();
    const { id } = req.params;

    const post = await postService.likePost(id, userId);

    ApiResponse.success(res, post, 'Post liked successfully');
  });

  unlikePost = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!._id.toString();
    const { id } = req.params;

    const post = await postService.unlikePost(id, userId);

    ApiResponse.success(res, post, 'Post unliked successfully');
  });

  getFeed = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!._id.toString();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await postService.getFeed(userId, page, limit);

    ApiResponse.paginated(
      res,
      result.posts,
      result.page,
      result.limit,
      result.total,
      'Feed retrieved successfully'
    );
  });

  getExplorePosts = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await postService.getExplorePosts(page, limit);

    ApiResponse.paginated(
      res,
      result.posts,
      result.page,
      result.limit,
      result.total,
      'Explore posts retrieved successfully'
    );
  });

  getUserPosts = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await postService.getUserPosts(userId, page, limit);

    ApiResponse.paginated(
      res,
      result.posts,
      result.page,
      result.limit,
      result.total,
      'User posts retrieved successfully'
    );
  });

  getTrendingPosts = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const limit = parseInt(req.query.limit as string) || 20;

    const posts = await postService.getTrendingPosts(limit);

    ApiResponse.success(res, posts, 'Trending posts retrieved successfully');
  });

  searchPosts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const query = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await postService.searchPosts(query, page, limit);

    // result.posts, result.page, result.limit, result.total
    res.json({
      posts: result.posts,
      page: result.page,
      limit: result.limit,
      total: result.total,
    });
  });

}
