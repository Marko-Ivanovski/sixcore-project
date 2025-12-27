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

type UserShape = {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export const toUserDto = (user: UserShape): UserDto => {
  const {
    id,
    email,
    username,
    displayName,
    bio,
    avatarUrl,
    createdAt,
    updatedAt,
  } = user;

  return {
    id,
    email,
    username,
    displayName: displayName ?? null,
    bio: bio ?? null,
    avatarUrl: avatarUrl ?? null,
    createdAt,
    updatedAt,
  };
};
