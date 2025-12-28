import {
  Controller,
  Get,
  Query,
  Req,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import type { Request } from 'express';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
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
    return this.postsService.getTimeline(limit, offset, userId, type);
  }
}
