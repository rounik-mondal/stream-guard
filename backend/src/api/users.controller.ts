// src/api/users.controller.ts
import { Request, Response } from 'express';
import prisma from '../db';

// --- Profile ---

export const updateMe = async (req: Request, res: Response) => {
  try {
    const { bio, avatarUrl } = req.body;
    // @ts-ignore
    const userId = req.user.id;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        bio,
        avatarUrl,
      },
      select: { id: true, email: true, username: true, bio: true, avatarUrl: true },
    });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ detail: 'Server error updating profile' });
  }
};

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ detail: 'Search query "q" is required' });
    }

    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: query,
          mode: 'insensitive', // Case-insensitive search
        },
      },
      select: { id: true, username: true, avatarUrl: true },
      take: 10,
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ detail: 'Server error' });
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        bio: true,
        avatarUrl: true,
        _count: {
          select: { followers: true, following: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ detail: 'Server error' });
  }
};



// src/api/users.controller.ts
// ... (imports)

// ... (keep your other functions: updateMe, searchUsers, getUserProfile, etc.)

export const getUserByUsername = async (req: Request, res: Response) => {
   try {
    const username = req.params.username;
    
    // This query now selects all the data your profile page needs
    const user = await prisma.user.findUnique({
      where: { username },
      select: { 
        id: true, 
        email: true, 
        username: true, 
        bio: true, // This is where "full_name" is stored
        avatarUrl: true,
        isVerified: true, // Send this field
        createdAt: true, // Send this field
        stream: { // Send stream object
          select: {
            id: true 
          }
        },
        _count: { // Send counts
          select: {
            followers: true,
            following: true
          }
        }
      },
    });

    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }
    
    // We must manually add stream_count because Prisma can't count one-to-one
    const formattedUser = {
      ...user,
      stream_count: user.stream ? 1 : 0 
    };
    
    res.status(200).json(formattedUser);
    
  } catch (error) {
    res.status(500).json({ detail: 'Server error' });
  }
}

// ... (keep your other functions: followUser, unfollowUser, etc.)

// --- Follows ---

export const followUser = async (req: Request, res: Response) => {
  try {
    const idToFollow = parseInt(req.params.id);
    // @ts-ignore
    const currentUserId = req.user.id;

    if (idToFollow === currentUserId) {
      return res.status(400).json({ detail: 'You cannot follow yourself' });
    }

    await prisma.follow.create({
      data: {
        followerId: currentUserId,
        followingId: idToFollow,
      },
    });
    res.status(204).send();
  } catch (error) {
     res.status(500).json({ detail: 'Server error or already following' });
  }
};

export const unfollowUser = async (req: Request, res: Response) => {
  try {
    const idToUnfollow = parseInt(req.params.id);
    // @ts-ignore
    const currentUserId = req.user.id;

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: idToUnfollow,
        },
      },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ detail: 'Server error or not following' });
  }
};

export const getFollowers = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const follows = await prisma.follow.findMany({
      where: { followingId: id },
      include: {
        follower: { // Get the user data of the follower
          select: { id: true, username: true, avatarUrl: true }
        }
      }
    });
    // Return just the user data
    res.status(200).json(follows.map(f => f.follower));
  } catch (error) {
     res.status(500).json({ detail: 'Server error' });
  }
};

export const getFollowing = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const follows = await prisma.follow.findMany({
      where: { followerId: id },
      include: {
        following: { // Get the user data of the person being followed
          select: { id: true, username: true, avatarUrl: true }
        }
      }
    });
    res.status(200).json(follows.map(f => f.following));
  } catch (error) {
     res.status(500).json({ detail: 'Server error' });
  }
};

// --- Blocks ---

export const blockUser = async (req: Request, res: Response) => {
  try {
    const idToBlock = parseInt(req.params.id);
    // @ts-ignore
    const currentUserId = req.user.id;

    if (idToBlock === currentUserId) {
      return res.status(400).json({ detail: 'You cannot block yourself' });
    }

    await prisma.block.create({
      data: {
        blockerId: currentUserId,
        blockedId: idToBlock,
      },
    });
    res.status(204).send();
  } catch (error) {
     res.status(500).json({ detail: 'Server error or already blocked' });
  }
};

export const unblockUser = async (req: Request, res: Response) => {
  try {
    const idToUnblock = parseInt(req.params.id);
    // @ts-ignore
    const currentUserId = req.user.id;

    await prisma.block.delete({
      where: {
        blockerId_blockedId: {
          blockerId: currentUserId,
          blockedId: idToUnblock,
        },
      },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ detail: 'Server error or not blocked' });
  }
};


// src/api/users.controller.ts
// ... (at the end of the file)

export const isFollowing = async (req: Request, res: Response) => {
  try {
    const idToFollow = parseInt(req.params.id);
    // @ts-ignore
    const currentUserId = req.user.id;

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: idToFollow,
        },
      },
    });

    res.status(200).json({ is_following: !!follow });

  } catch (error) {
     res.status(500).json({ detail: 'Server error' });
  }
};