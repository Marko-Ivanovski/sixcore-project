import { Request } from 'express';

export interface JwtPayload {
  sub: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}
