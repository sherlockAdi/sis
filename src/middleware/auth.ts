import type { Request } from 'express';
import type { JwtPayload } from '../security/jwt';
import { verifyToken } from '../security/jwt';

export type RequestWithUser = Request & { user?: JwtPayload };

export function expressAuthentication(
  request: Request,
  securityName: string,
  _scopes?: string[]
): Promise<JwtPayload> {
  if (securityName !== 'jwt') {
    return Promise.reject(new Error(`Unknown security scheme: ${securityName}`));
  }

  const header = request.header('authorization') ?? request.header('Authorization');
  if (!header) return Promise.reject(new Error('Missing Authorization header'));

  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return Promise.reject(new Error('Invalid Authorization header (expected Bearer token)'));

  try {
    const payload = verifyToken(match[1]);
    (request as RequestWithUser).user = payload;
    return Promise.resolve(payload);
  } catch {
    return Promise.reject(new Error('Invalid or expired token'));
  }
}

