import type { SyntheticEvent } from 'react';

const buildFallback = (username: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}`;

export const buildAvatarUrl = (
  avatarUrl: string | null | undefined,
  username: string,
) => {
  if (avatarUrl) {
    return encodeURI(avatarUrl);
  }
  return buildFallback(username);
};

export const setAvatarFallback = (
  event: SyntheticEvent<HTMLImageElement>,
  username: string,
) => {
  const target = event.currentTarget;
  target.onerror = null;
  target.src = buildFallback(username);
};
