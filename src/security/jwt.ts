import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export type JwtPayload = {
  user_id: number;
  role_id: number;
  username: string;
};

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET as jwt.Secret, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET as jwt.Secret) as JwtPayload;
}
