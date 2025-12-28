import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Req,
  NotFoundException,
  ParseIntPipe,
  DefaultValuePipe,
  ConflictException,
  Patch,
  Body,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import type { Request } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':username')
  async getUserProfile(
    @Param('username') username: string,
    @Req() req: Request,
  ) {
    // Extract viewerId from cookie if available (handled by guard usually, but this is public)
    // We can manually parse token or use a loose guard.
    // For now, let's assume we might have user on req if middleware ran, or we need to extract it.
    // Given scope "never trust client userId", we should rely on validated auth.
    // Helper/AUTH.md check might be useful but "Use auth cookies and derive viewerId" implies we should
    // be able to get it.
    const userId = (req as any).user?.sub;

    const profile = await this.usersService.getProfile(username, userId);
    if (!profile) {
      throw new NotFoundException('User not found');
    }
    return profile;
  }

  @Get(':username/posts')
  async getUserPosts(
    @Param('username') username: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Req() req: Request,
  ) {
    if (limit < 1 || limit > 100) limit = 20;
    if (offset < 0) offset = 0;

    const userId = (req as any).user?.sub;
    const result = await this.usersService.getUserPosts(
      username,
      limit,
      offset,
      userId,
    );
    if (!result) {
      throw new NotFoundException('User not found');
    }
    return result;
  }

  @Post(':username/follow')
  @UseGuards(JwtAuthGuard)
  async followUser(@Param('username') username: string, @Req() req: Request) {
    // AuthGuard ensures req.user is populated
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const followerId = (req as any).user.sub;
    const result = await this.usersService.followUser(followerId, username);

    if (result.notFound) {
      throw new NotFoundException('User not found');
    }
    if (result.selfFollow) {
      throw new ConflictException('Cannot follow yourself');
    }
    if (result.alreadyFollowing) {
      // Requirement says: "200 with {isFollowing} or 409".
      // Let's return 409 as requested by prompt "409 on conflict".
      throw new ConflictException('Already following');
    }

    return { isFollowing: true };
  }

  @Delete(':username/follow')
  @UseGuards(JwtAuthGuard)
  async unfollowUser(@Param('username') username: string, @Req() req: Request) {
    const followerId = (req as any).user.sub;
    const result = await this.usersService.unfollowUser(followerId, username);

    if (result.notFound) {
      throw new NotFoundException('User not found');
    }

    return { isFollowing: false };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async patchUser(@Body() dto: UpdateUserDto, @Req() req: Request) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (req as any).user.sub;

    try {
      const user = await this.usersService.updateUser(userId, dto);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...result } = user;
      return result;
    } catch (error: any) {
      if (error.message === 'Email already in use' || error.message === 'Username already in use') {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }
}
