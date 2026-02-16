// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import prisma from '../db';

interface CustomJwtPayload extends JwtPayload {
  id: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;
  
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in .env file');
  }

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, secret) as CustomJwtPayload;

      if (typeof decoded === 'string' || !decoded.id) {
        return res.status(401).json({ detail: 'Not authorized, token invalid' });
      }

      // --- THIS IS THE UPDATED PART ---
      // src/middleware/auth.middleware.ts

// ... (inside your 'protect' function, in the 'try' block)

req.user = await prisma.user.findUnique({
  where: { id: decoded.id },
  select: { 
    id: true, 
    email: true, 
    username: true, 
    bio: true, 
    avatarUrl: true,
    
    // 1. ADD THIS BLOCK to select the one-to-one relation
    stream: {
      select: {
        id: true // We just need to know if it exists
      }
    },
    
    // 2. FIX THIS BLOCK
    _count: {
      select: {
        // stream: true, // <-- REMOVE THIS LINE
        followers: true,
        following: true
      }
    }
  },
});

// ... (rest of the function)
      // --- END OF UPDATE ---

      if (!req.user) {
         return res.status(401).json({ detail: 'User not found' });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ detail: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ detail: 'Not authorized, no token' });
  }
};