// src/api/admin.controller.ts
import { Request, Response } from 'express';
import prisma from '../db';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ detail: 'Access denied: Admins only' });
    }

    const totalUsers = await prisma.user.count();
    const totalStreams = await prisma.stream.count();
    const liveStreams = await prisma.stream.count({ where: { status: 'LIVE' } });
    
    const totalMessages = await prisma.message.count();
    const blockedMessages = await prisma.message.count({ where: { isFlagged: true } });
    
    // Get top toxic users
    const toxicUsers = await prisma.user.findMany({
      where: { toxicScore: { gt: 0 } },
      orderBy: { toxicScore: 'desc' },
      take: 10,
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        toxicScore: true,
        isBanned: true,
      }
    });

    return res.status(200).json({
      platform: { totalUsers, totalStreams, liveStreams },
      moderation: { totalMessages, blockedMessages, blockRate: totalMessages > 0 ? (blockedMessages / totalMessages) * 100 : 0 },
      toxicUsers,
    });
  } catch (error) {
    console.error('Admin Dashboard Error:', error);
    return res.status(500).json({ detail: 'Server error' });
  }
};

export const banUser = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ detail: 'Access denied' });
    }

    const { id } = req.params;
    const numericId = Number(id);

    await prisma.user.update({
      where: { id: numericId },
      data: { isBanned: true },
    });

    return res.status(200).json({ detail: 'User banned successfully' });
  } catch (error) {
    console.error('Ban Error:', error);
    return res.status(500).json({ detail: 'Server error' });
  }
};
