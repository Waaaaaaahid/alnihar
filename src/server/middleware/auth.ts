import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
<<<<<<< HEAD
import { User } from '../models/User';
=======
>>>>>>> 9a922357087256e67fe5d9e2a66ae9a1e58eec70

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

<<<<<<< HEAD
export const JWT_SECRET = process.env.JWT_SECRET || 'al-nihar-local-dev-secret-2026';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function generateToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, {
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
    const decoded = jwt.verify(token, JWT_SECRET) as any;
=======
export function generateToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
>>>>>>> 9a922357087256e67fe5d9e2a66ae9a1e58eec70
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

<<<<<<< HEAD
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
      const decoded = jwt.verify(token, JWT_SECRET) as any;
=======
export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
>>>>>>> 9a922357087256e67fe5d9e2a66ae9a1e58eec70
      req.userId = decoded.userId;
      req.userRole = decoded.role;
    } catch {
      // ignore invalid token for optional auth
    }
  }
  next();
}
