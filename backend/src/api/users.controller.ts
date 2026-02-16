import { Request, Response } from 'express';
import prisma from '../db';

// ===============================
// UPDATE ME
// ===============================
export const updateMe = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ detail: 'Not authorized' });
    }

    const { bio, avatarUrl } = req.body as {
      bio?: string | null;
      avatarUrl?: string | null;
    };

    // ✅ BUILD UPDATE OBJECT SAFELY
    const updateData: {
      bio?: string | null;
      avatarUrl?: string | null;
    } = {};

    if (bio !== undefined) {
      updateData.bio = bio;
    }

    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl;
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        bio: true,
        avatarUrl: true,
      },
    });

    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ detail: 'Server error updating profile' });
  }
};


// ===============================
// SEARCH USERS
// ===============================
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string | undefined;

    if (!query) {
      return res
        .status(400)
        .json({ detail: 'Search query "q" is required' });
    }

    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: query,
          mode: 'insensitive',
        },
      },
      select: { id: true, username: true, avatarUrl: true },
      take: 10,
    });

    return res.status(200).json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Server error' });
  }
};

// ===============================
// GET USER PROFILE (by id)
// ===============================
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ detail: 'User id required' });
    }

    const numericId = Number(id);

    if (Number.isNaN(numericId)) {
      return res.status(400).json({ detail: 'Invalid user id' });
    }

    const user = await prisma.user.findUnique({
      where: { id: numericId },
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

    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Server error' });
  }
};

// ===============================
// GET USER BY USERNAME
// ===============================
export const getUserByUsername = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({ detail: 'Username required' });
    }

    const user = await prisma.user.findUnique({
      where: { username }, // ✅ now guaranteed string
      select: {
        id: true,
        email: true,
        username: true,
        bio: true,
        avatarUrl: true,
        isVerified: true,
        createdAt: true,
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
      return res.status(404).json({ detail: 'User not found' });
    }

    const formattedUser = {
      ...user,
      stream_count: user.stream ? 1 : 0,
    };

    return res.status(200).json(formattedUser);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Server error' });
  }
};

// ===============================
// FOLLOW USER
// ===============================
export const followUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ detail: 'Not authorized' });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ detail: 'User id required' });
    }

    const idToFollow = Number(id);

    if (idToFollow === req.user.id) {
      return res
        .status(400)
        .json({ detail: 'You cannot follow yourself' });
    }

    await prisma.follow.create({
      data: {
        followerId: req.user.id,
        followingId: idToFollow,
      },
    });

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ detail: 'Server error or already following' });
  }
};

// ===============================
// UNFOLLOW USER
// ===============================
export const unfollowUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ detail: 'Not authorized' });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ detail: 'User id required' });
    }

    const idToUnfollow = Number(id);

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: req.user.id,
          followingId: idToUnfollow,
        },
      },
    });

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ detail: 'Server error or not following' });
  }
};

// ===============================
// FOLLOWERS
// ===============================
export const getFollowers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ detail: 'User id required' });
    }

    const numericId = Number(id);

    const follows = await prisma.follow.findMany({
      where: { followingId: numericId },
      include: {
        follower: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });

    return res.status(200).json(follows.map(f => f.follower));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Server error' });
  }
};

// ===============================
// FOLLOWING
// ===============================
export const getFollowing = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ detail: 'User id required' });
    }

    const numericId = Number(id);

    const follows = await prisma.follow.findMany({
      where: { followerId: numericId },
      include: {
        following: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });

    return res.status(200).json(follows.map(f => f.following));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Server error' });
  }
};

// ===============================
// IS FOLLOWING
// ===============================
export const isFollowing = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ detail: 'Not authorized' });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ detail: 'User id required' });
    }

    const idToFollow = Number(id);

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: req.user.id,
          followingId: idToFollow,
        },
      },
    });

    return res.status(200).json({ is_following: !!follow });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Server error' });
  }
};



// ===============================
// BLOCK USER
// ===============================
export const blockUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ detail: 'Not authorized' });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ detail: 'User id required' });
    }

    const idToBlock = Number(id);

    if (idToBlock === req.user.id) {
      return res
        .status(400)
        .json({ detail: 'You cannot block yourself' });
    }

    await prisma.block.create({
      data: {
        blockerId: req.user.id,
        blockedId: idToBlock,
      },
    });

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ detail: 'Server error or already blocked' });
  }
};

// ===============================
// UNBLOCK USER
// ===============================
export const unblockUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ detail: 'Not authorized' });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ detail: 'User id required' });
    }

    const idToUnblock = Number(id);

    await prisma.block.delete({
      where: {
        blockerId_blockedId: {
          blockerId: req.user.id,
          blockedId: idToUnblock,
        },
      },
    });

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ detail: 'Server error or not blocked' });
  }
};
