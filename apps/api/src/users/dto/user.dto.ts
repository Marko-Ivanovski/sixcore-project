/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { User } from '@prisma/client';

export interface UserDto {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const toUserDto = (user: User): UserDto => ({
  id: user.id,
  email: user.email,
  username: user.username,
  displayName: user.displayName ?? null,
  bio: user.bio ?? null,
  avatarUrl: user.avatarUrl ?? null,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});
