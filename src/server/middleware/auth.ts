import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

// Backend-only secret: validate it when JWT functionality is actually used,
// not while Vite is merely importing the server module during a frontend build.
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured. Set JWT_SECRET in the server environment before starting the API.');
  }
  return secret;
}

export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function generateToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, getJWTSecret(), {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  const cookieToken = (req as any).cookies?.token;
  if (cookieToken) {
    return cookieToken;
  }
  return null;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, getJWTSecret()) as any;
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (err: any) {
    if (err?.message?.includes('JWT_SECRET is not configured')) {
      return res.status(500).json({ success: false, message: 'Server authentication is not configured' });
    }
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

export async function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // Verify against the live DB role instead of the (possibly stale) JWT role
    // claim, so an outdated token never locks a real admin out of the panel.
    const user = await User.findById(req.userId).select('role');
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    req.userRole = user.role;
    next();
  } catch {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    try {
      const decoded = jwt.verify(token, getJWTSecret()) as any;
      req.userId = decoded.userId;
      req.userRole = decoded.role;
    } catch {
      // Ignore invalid tokens for optional auth. Authentication remains unavailable
      // until the backend JWT_SECRET is configured.
    }
  }
  next();
}
