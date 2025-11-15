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
    let { content, images } = req.body;

    // Handle file uploads if files are attached
    if (req.files && (req.files as Express.Multer.File[]).length > 0) {
      const files = req.files as Express.Multer.File[];
      const baseUrl = `${req.protocol}://${req.get('host')}`;

      images = files.map((file) => {
        if (config.upload.useCloudinary) {
          return (file as any).path; // Cloudinary URL
        } else {
          return `${baseUrl}/uploads/${file.filename}`;
        }
      });
    } else if (typeof images === 'string') {
      // Handle single image URL from body
      images = [images];
    } else if (!images) {
      images = [];
    }

    const post = await postService.createPost(authorId, content, images);

    ApiResponse.success(res, post, 'Post created successfully', 201);
  });

  getPostById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const post = await postService.getPostById(id);

    ApiResponse.success(res, post, 'Post retrieved successfully');
  });

  updatePost = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!._id.toString();
    const { id } = req.params;
    const updates = req.body;

    // Handle file uploads for update
    if (req.files && (req.files as Express.Multer.File[]).length > 0) {
      const files = req.files as Express.Multer.File[];
      const baseUrl = `${req.protocol}://${req.get('host')}`;

      updates.images = files.map((file) => {
        if (config.upload.useCloudinary) {
          return (file as any).path;
        } else {
          return `${baseUrl}/uploads/${file.filename}`;
        }
      });
    }

    const post = await postService.updatePost(id, userId, updates);

    ApiResponse.success(res, post, 'Post updated successfully');
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
