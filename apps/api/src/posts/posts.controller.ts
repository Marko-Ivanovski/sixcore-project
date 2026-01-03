import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async getTimeline(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('type') type: 'all' | 'following' = 'all',
    @Req() req: Request,
  ) {
    if (limit < 1 || limit > 100) limit = 20;
    if (offset < 0) offset = 0;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (req as any).user?.sub;
    const normalizedType = type === 'following' ? 'following' : 'all';
    return this.postsService.getTimeline(limit, offset, userId, normalizedType);
  }

  @Get('feed')
  @UseGuards(OptionalJwtAuthGuard)
  async getFeed(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Req() req: Request,
  ) {
    if (limit < 1 || limit > 100) limit = 20;
    if (offset < 0) offset = 0;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (req as any).user?.sub;
    return this.postsService.getTimeline(limit, offset, userId, 'all');
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createPost(@Body() dto: CreatePostDto, @Req() req: Request) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (req as any).user.sub;
    return this.postsService.createPost(userId, dto);
  }

  @Patch(':postId')
  @UseGuards(JwtAuthGuard)
  async updatePost(
    @Param('postId') postId: string,
    @Body() dto: UpdatePostDto,
    @Req() req: Request,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (req as any).user.sub;
    return this.postsService.updatePost(postId, userId, dto);
  }

  @Delete(':postId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param('postId') postId: string, @Req() req: Request) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (req as any).user.sub;
    await this.postsService.deletePost(postId, userId);
  }

  @Get(':postId')
  @UseGuards(OptionalJwtAuthGuard)
  async getPost(@Param('postId') postId: string, @Req() req: Request) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (req as any).user?.sub;
    return this.postsService.getPostById(postId, userId);
  }

  @Post(':postId/like')
  @UseGuards(JwtAuthGuard)
  async likePost(@Param('postId') postId: string, @Req() req: Request) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (req as any).user.sub;
    return this.postsService.likePost(postId, userId);
  }

  @Delete(':postId/like')
  @UseGuards(JwtAuthGuard)
  async unlikePost(@Param('postId') postId: string, @Req() req: Request) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (req as any).user.sub;
    return this.postsService.unlikePost(postId, userId);
  }

  @Post(':postId/retweet')
  @UseGuards(JwtAuthGuard)
  async retweetPost(@Param('postId') postId: string, @Req() req: Request) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (req as any).user.sub;
    return this.postsService.retweetPost(postId, userId);
  }

  @Delete(':postId/retweet')
  @UseGuards(JwtAuthGuard)
  async unretweetPost(@Param('postId') postId: string, @Req() req: Request) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (req as any).user.sub;
    return this.postsService.unretweetPost(postId, userId);
  }

  @Get(':postId/comments')
  @UseGuards(OptionalJwtAuthGuard)
  async getComments(
    @Param('postId') postId: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Req() req: Request,
  ) {
    if (limit < 1 || limit > 100) limit = 20;
    if (offset < 0) offset = 0;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (req as any).user?.sub;
    return this.postsService.getComments(postId, limit, offset, userId);
  }

  @Post(':postId/comments')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async addComment(
    @Param('postId') postId: string,
    @Body() dto: CreateCommentDto,
    @Req() req: Request,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (req as any).user.sub;
    return this.postsService.addComment(postId, userId, dto);
  }
}
