import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import prisma from '../db';

// ===============================
// JWT PAYLOAD TYPE
// ===============================
interface CustomJwtPayload extends JwtPayload {
  id: number;
}

// ===============================
// EXPRESS AUGMENTATION
// ===============================
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        username: string;
        bio: string | null;
        avatarUrl: string | null;
        stream: { id: number } | null;
        _count: {
          followers: number;
          following: number;
        };
      };
    }
  }
}

// ===============================
// PROTECT MIDDLEWARE
// ===============================
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  // ✅ Check header first
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Not authorized, no token' });
  }

  const token = authHeader.split(' ')[1];

  // ✅ HARD guard for token (fixes TS2769)
  if (!token) {
    return res.status(401).json({ detail: 'Not authorized, token missing' });
  }

  const secret = process.env.JWT_SECRET;

  // ✅ HARD guard for secret (fixes TS2769)
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in .env file');
  }

  try {
    // ✅ verify WITHOUT casting
    const decoded = jwt.verify(token, secret);

    // ✅ narrow type properly (fixes TS2352)
    if (typeof decoded === 'string') {
      return res.status(401).json({ detail: 'Not authorized, token invalid' });
    }

    if (!('id' in decoded)) {
      return res.status(401).json({ detail: 'Invalid token payload' });
    }

    const payload = decoded as CustomJwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        username: true,
        bio: true,
        avatarUrl: true,
        stream: {
          select: { id: true },
        },
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ detail: 'User not found' });
    }

    req.user = user;
    return next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ detail: 'Not authorized, token failed' });
  }
};
