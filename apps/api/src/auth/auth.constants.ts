export const ACCESS_TOKEN_EXPIRES_IN = '15m';
export const REFRESH_TOKEN_EXPIRES_IN = '7d';
export const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
export const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const getAccessTokenSecret = (): string =>
  process.env.JWT_ACCESS_SECRET ?? 'access-secret';

export const getRefreshTokenSecret = (): string =>
  process.env.JWT_REFRESH_SECRET ?? 'refresh-secret';
