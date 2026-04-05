import { Request, Response } from 'express';
import prisma from '../db';

// ===============================
// FORMAT HELPER
// ===============================
const formatStreamForFrontend = (stream: any) => {
  const {
    user,
    _count,
    chatEnabled,
    toxicFilterEnabled,
    isPublic,
    allowGuests,
    viewerCount,
    maxViewerCount,
    likeCount,
    endedAt,
    createdAt,
    ...restOfStream
  } = stream;

  const streamer = {
    id: user.id,
    username: user.username,
    avatar_url: user.avatarUrl,
    is_verified: user.isVerified,
    follower_count: user._count.followers,
  };

  let duration_minutes = 0;

  if (endedAt) {
    duration_minutes = Math.floor(
      (new Date(endedAt).getTime() - new Date(createdAt).getTime()) / 60000
    );
  } else if (stream.status === 'LIVE') {
    duration_minutes = Math.floor(
      (Date.now() - new Date(createdAt).getTime()) / 60000
    );
  }

  return {
    ...restOfStream,
    status: stream.status.toLowerCase(),
    category: stream.category,
    chat_enabled: chatEnabled,
    toxic_filter_enabled: toxicFilterEnabled,
    is_public: isPublic,
    allow_guests: allowGuests,
    viewer_count: viewerCount,
    max_viewer_count: maxViewerCount,
    like_count: likeCount,
    comment_count: _count.messages,
    duration_minutes,
    streamer,
    tags: stream.tags || [],
    createdAt,
    endedAt,
  };
};

// ===============================
// GET STREAM
// ===============================
export const getStream = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ detail: 'Stream id required' });
    }

    const numericId = Number(id);

    if (Number.isNaN(numericId)) {
      return res.status(400).json({ detail: 'Invalid stream id' });
    }

    const stream = await prisma.stream.findUnique({
      where: { id: numericId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            isVerified: true,
            _count: { select: { followers: true } },
          },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    if (!stream) {
      return res.status(404).json({ detail: 'Stream not found' });
    }

    return res.status(200).json(formatStreamForFrontend(stream));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Server error' });
  }
};

// ===============================
// CREATE STREAM
// ===============================
export const createStream = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ detail: 'Not authorized' });
    }

    const { title, description, category, chat_enabled, toxic_filter_enabled, is_public, allow_guests, tags } = req.body;

    const existingStream = await prisma.stream.findFirst({
      where: { 
        userId: req.user.id,
        status: {
          not: 'ENDED'
        }
      },
    });

    if (existingStream) {
      return res
        .status(409)
        .json({ detail: 'User already has an active stream.' });
    }

    const stream = await prisma.stream.create({
      data: {
        title,
        description,
        category: category || 'Other',
        userId: req.user.id,
        status: 'OFFLINE',
        tags: tags || [],
        chatEnabled: chat_enabled !== undefined ? chat_enabled : true,
        toxicFilterEnabled: toxic_filter_enabled !== undefined ? toxic_filter_enabled : true,
        isPublic: is_public !== undefined ? is_public : true,
        allowGuests: allow_guests !== undefined ? allow_guests : true,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            isVerified: true,
            _count: { select: { followers: true } },
          },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    return res.status(201).json(formatStreamForFrontend(stream));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Server error' });
  }
};

// ===============================
// LIST STREAMS
// ===============================
export const listStreams = async (req: Request, res: Response) => {
  try {
    const streamerUsername = req.query.streamer as string | undefined;
    const category = req.query.category as string | undefined;

    let whereClause: any = {};

    if (streamerUsername) {
      const user = await prisma.user.findUnique({
        where: { username: streamerUsername },
      });

      if (!user) {
        return res.status(200).json([]);
      }

      whereClause.userId = user.id;
    }

    if (category) {
      whereClause.category = category;
    }

    const streams = await prisma.stream.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            isVerified: true,
            _count: { select: { followers: true } },
          },
        },
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res
      .status(200)
      .json(streams.map(formatStreamForFrontend));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Server error' });
  }
};

// ===============================
// LIST LIVE STREAMS
// ===============================
export const listLiveStreams = async (_req: Request, res: Response) => {
  try {
    const streams = await prisma.stream.findMany({
      where: { status: 'LIVE' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            isVerified: true,
            _count: { select: { followers: true } },
          },
        },
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res
      .status(200)
      .json(streams.map(formatStreamForFrontend));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Server error' });
  }
};

// ===============================
// LIST TRENDING STREAMS
// ===============================
export const listTrendingStreams = async (_req: Request, res: Response) => {
  try {
    const streams = await prisma.stream.findMany({
      where: { status: 'LIVE' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            isVerified: true,
            _count: { select: { followers: true } },
          },
        },
        _count: { select: { messages: true } },
      },
      orderBy: { viewerCount: 'desc' },
      take: 10,
    });

    return res
      .status(200)
      .json(streams.map(formatStreamForFrontend));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Server error' });
  }
};

// ===============================
// GET STREAMER ANALYTICS
// ===============================
export const getStreamerAnalytics = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ detail: 'Not authorized' });
    }

    const { id } = req.user;

    // Get all streams for this user
    const streams = await prisma.stream.findMany({
      where: { userId: id },
      include: {
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalViews = streams.reduce((acc, curr) => acc + curr.viewerCount, 0);
    const totalLikes = streams.reduce((acc, curr) => acc + curr.likeCount, 0);
    const totalComments = streams.reduce((acc, curr) => acc + curr._count.messages, 0);

    const formattedStreams = streams.map(s => ({
      ...s,
      commentCount: s._count.messages,
      durationMinutes: s.endedAt ? Math.floor((new Date(s.endedAt).getTime() - new Date(s.createdAt).getTime()) / 60000) : 0
    }));

    return res.status(200).json({
      totalStreams: streams.length,
      totalViews,
      totalLikes,
      totalComments,
      streams: formattedStreams
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Server error' });
  }
};

// ===============================
// OWNERSHIP HELPER
// ===============================
const checkStreamOwnership = async (
  userId: number,
  streamId: number
) => {
  const stream = await prisma.stream.findUnique({
    where: { id: streamId },
  });

  if (!stream) return { error: 'Stream not found', owned: false };
  if (stream.userId !== userId)
    return { error: 'You do not own this stream', owned: false };

  return { error: null, owned: true };
};

// ===============================
// UPDATE STREAM
// ===============================
export const updateStream = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ detail: 'Not authorized' });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ detail: 'Stream id required' });
    }

    const numericId = Number(id);

    const { error, owned } = await checkStreamOwnership(
      req.user.id,
      numericId
    );

    if (!owned) {
      return res.status(404).json({ detail: error });
    }

    const { title, description } = req.body;

    const stream = await prisma.stream.update({
      where: { id: numericId },
      data: { title, description },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            isVerified: true,
            _count: { select: { followers: true } },
          },
        },
        _count: { select: { messages: true } },
      },
    });

    return res.status(200).json(formatStreamForFrontend(stream));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Server error' });
  }
};

// ===============================
// DELETE / START / END
// ===============================
export const deleteStream = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ detail: 'Not authorized' });
    }

    const { id } = req.params;
    if (!id) return res.status(400).json({ detail: 'Stream id required' });

    const numericId = Number(id);

    const { error, owned } = await checkStreamOwnership(
      req.user.id,
      numericId
    );

    if (!owned) {
      return res.status(404).json({ detail: error });
    }

    await prisma.message.deleteMany({ where: { streamId: numericId } });
    await prisma.stream.delete({ where: { id: numericId } });

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Server error' });
  }
};

export const startStream = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ detail: 'Not authorized' });
    }

    const { id } = req.params;
    if (!id) return res.status(400).json({ detail: 'Stream id required' });

    const numericId = Number(id);

    const { error, owned } = await checkStreamOwnership(
      req.user.id,
      numericId
    );

    if (!owned) {
      return res.status(404).json({ detail: error });
    }

    await prisma.stream.update({
      where: { id: numericId },
      data: { status: 'LIVE', endedAt: null },
    });

    return res.status(200).json({ detail: 'Stream started' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Server error' });
  }
};

export const endStream = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ detail: 'Not authorized' });
    }

    const { id } = req.params;
    if (!id) return res.status(400).json({ detail: 'Stream id required' });

    const numericId = Number(id);

    const { error, owned } = await checkStreamOwnership(
      req.user.id,
      numericId
    );

    if (!owned) {
      return res.status(404).json({ detail: error });
    }

    await prisma.stream.update({
      where: { id: numericId },
      data: { status: 'ENDED', endedAt: new Date() },
    });

    return res.status(200).json({ detail: 'Stream ended' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Server error' });
  }
};

export const viewStream = async (_req: Request, res: Response) => {
  return res.status(200).json({ detail: 'View logged' });
};

export const leaveStream = async (_req: Request, res: Response) => {
  return res.status(200).json({ detail: 'Leave logged' });
};
