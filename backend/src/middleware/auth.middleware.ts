import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/generateToken';
import prisma from '../config/database';
import { isTokenBlacklisted } from '../utils/tokenUtils';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    serviceCompanyId?: string;
  };
}

// Authentication middleware with blacklist check
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.accessToken;

    if (!token) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    const decoded = verifyToken(token);
    const blacklisted = await isTokenBlacklisted(token);

    if (blacklisted) {
      res.status(401).json({
        message: 'Token has been revoked. Please login again.',
      });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user || !user.isActive) {
      res.status(401).json({ message: 'Invalid or expired token' });
      return;
    }

    if (decoded.tokenVersion === undefined || decoded.tokenVersion !== user.tokenVersion) {
      res.status(401).json({ message: 'Token has been revoked. Please login again.' });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};