// src/api/auth.controller.ts
import { Request, Response } from 'express';
import prisma from '../db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import jwt, { JwtPayload, SignOptions, Secret } from 'jsonwebtoken';

const signToken = (
  id: number,
  secret: Secret,
  expiresIn?: SignOptions['expiresIn']
): string => {
  const options: SignOptions = {};

  if (expiresIn !== undefined) {
    options.expiresIn = expiresIn;
  }

  return jwt.sign({ id }, secret, options);
};

export const register = async (req: Request, res: Response) => {
  try {
    // 1. Destructure all fields from the frontend
    const { email, username, password, full_name } = req.body;

    if (!email || !username || !password) {
      return res
        .status(400)
        .json({ detail: 'Please provide email, username, and password' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        bio: full_name || undefined, // 2. Save full_name to the bio field
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);

  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ detail: 'Email or username already exists' });
    }
    res.status(500).json({ detail: 'Server error during registration' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. CHECK FOR ENV VARIABLES
    const accessSecret = process.env.JWT_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!accessSecret || !refreshSecret) {
      // This will make the error show up in your backend console
      console.error('FATAL ERROR: JWT secrets not configured in .env file or server not restarted.');
      throw new Error('Server error: JWT secrets not configured');
    }

    // 2. Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ detail: 'Invalid credentials' });
    }

    // 3. Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ detail: 'Invalid credentials' });
    }

    // 4. Create tokens
    const accessToken = signToken(user.id, accessSecret, '2d');
    const refreshToken = signToken(user.id, refreshSecret, '7d');

    res.status(200).json({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  } catch (error: any) { // This is the crucial part for debugging
    console.error('--- LOGIN FAILED ---');
    console.error(error.message); // Log the specific error
    res.status(500).json({ detail: 'Server error during login' });
  }
};
// src/api/auth.controller.ts

export const guest = async (req: Request, res: Response) => {
  try {
    // 1. CHECK FOR ENV VARIABLES
    const accessSecret = process.env.JWT_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!accessSecret || !refreshSecret) {
      console.error('FATAL ERROR: JWT secrets not configured');
      throw new Error('Server error: JWT secrets not configured');
    }

    // Create a guest user
    const guestUsername = `Guest_${uuidv4().split('-')[0]}`;
    const guestEmail = `${guestUsername}@guest.com`;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(uuidv4(), salt);

    const user = await prisma.user.create({
      data: {
        email: guestEmail,
        username: guestUsername,
        password: hashedPassword,
        bio: 'I am a guest user!',
      },
    });

    // Log them in (now with safe variables)
    const accessToken = signToken(user.id, accessSecret, '15m');
    const refreshToken = signToken(user.id, refreshSecret, '7d');

    res.status(200).json({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  } catch (error) {
    console.error('Guest login error:', error);
    res.status(500).json({ detail: 'Server error creating guest user' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  // @ts-ignore
  const user = req.user;
  res.status(200).json(user);
};
// ... (other functions: register, login, etc.)

// Define a custom type for your payload (can be in a shared file)
interface CustomJwtPayload extends JwtPayload {
  id: number;
}

export const refreshToken = (req: Request, res: Response) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(401).json({ detail: 'Refresh token required' });
  }

  // 1. GET THE SECRETS AND CHECK THEM
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  const accessSecret = process.env.JWT_SECRET;
  if (!refreshSecret || !accessSecret) {
    throw new Error('JWT secrets are not defined in .env file');
  }

  try {
    // 2. VERIFY THE REFRESH TOKEN
    const decoded = jwt.verify(refresh_token, refreshSecret) as CustomJwtPayload;

    if (typeof decoded === 'string' || !decoded.id) {
      return res.status(401).json({ detail: 'Invalid refresh token payload' });
    }

    // Issue a new access token
    const accessToken = signToken(decoded.id, accessSecret, '15m');
    res.status(200).json({ access_token: accessToken });

  } catch (error) {
    return res.status(401).json({ detail: 'Invalid or expired refresh token' });
  }
};

export const logout = (req: Request, res: Response) => {
  // With JWT, logout is mainly a client-side (deleting the token).
  // This endpoint is here to match the API. In a stateful system,
  // you might blacklist the token here.
  res.status(200).json({ detail: 'Logged out successfully' });
};