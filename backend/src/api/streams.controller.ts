// src/api/streams.controller.ts
import { Request, Response } from 'express';
import prisma from '../db';

/**
 * This helper function takes the raw data from Prisma and
 * formats it to *exactly* match what your StreamPage.tsx expects.
 * It maps camelCase (backend) to snake_case (frontend)
 * and renames `user` to `streamer`.
 */
const formatStreamForFrontend = (stream: any) => {
  // Destructure all the parts from the full stream object
  const {
    user,
    _count,
    chatEnabled,
    toxicFilterEnabled,
    viewerCount,
    maxViewerCount,
    likeCount,
    endedAt,
    createdAt,
    ...restOfStream
  } = stream;

  // 1. Create the 'streamer' object
  const streamer = {
    id: user.id,
    username: user.username,
    avatar_url: user.avatarUrl, // Map to snake_case
    is_verified: user.isVerified, // Map
    follower_count: user._count.followers, // Map
  };

  // 2. Calculate duration
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

  // 3. Return the complete, formatted object
  return {
    ...restOfStream,
    chat_enabled: chatEnabled,
    toxic_filter_enabled: toxicFilterEnabled,
    viewer_count: viewerCount,
    max_viewer_count: maxViewerCount,
    like_count: likeCount,
    comment_count: _count.messages, // Get from _count
    duration_minutes: duration_minutes,
    streamer: streamer, // Add the nested streamer object
    tags: stream.tags || [], // Ensure tags is always an array
    createdAt,
    endedAt,
  };
};

// --- UPDATED CONTROLLERS ---

export const getStream = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const stream = await prisma.stream.findUnique({
      where: { id },
      include: {
        // Include the user...
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            isVerified: true,
            _count: { select: { followers: true } }, // ...and their follower count
          },
        },
        // Include the message count
        _count: {
          select: { messages: true },
        },
      },
    });

    if (!stream) {
      return res.status(404).json({ detail: 'Stream not found' });
    }

    // Format and send the data
    const formattedStream = formatStreamForFrontend(stream);
    res.status(200).json(formattedStream);
  } catch (error) {
    console.error('Error in getStream:', error);
    res.status(500).json({ detail: 'Server error' });
  }
};

export const createStream = async (req: Request, res: Response) => {
  try {
    const { title, description } = req.body;
    // @ts-ignore
    const userId = req.user.id;

    const existingStream = await prisma.stream.findUnique({ where: { userId } });
    if (existingStream) {
      return res
        .status(409)
        .json({ detail: 'User already has a stream.' });
    }

    const stream = await prisma.stream.create({
      data: {
        title,
        description,
        userId,
        status: 'OFFLINE', // Set new defaults
        tags: [],
      },
      include: { // Must include the same data as getStream
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

    // Format and send the data
    const formattedStream = formatStreamForFrontend(stream);
    res.status(201).json(formattedStream);
  } catch (error) {
    console.error('Error in createStream:', error);
    res.status(500).json({ detail: 'Server error' });
  }
};

// --- (Keep all your other stream controllers: listStreams, updateStream, etc.) ---
// You should update them to use formatStreamForFrontend() as well
// for consistency.

// src/api/streams.controller.ts
// ... (imports)
// ... (keep your formatStreamForFrontend helper function)

export const listStreams = async (req: Request, res: Response) => {
  try {
    // Check for the 'streamer' query param from your ProfilePage
    const streamerUsername = req.query.streamer as string;

    let whereClause = {};

    if (streamerUsername) {
      // Find the user ID from the username
      const user = await prisma.user.findUnique({
        where: { username: streamerUsername },
      });

      if (!user) {
        return res.status(200).json([]); // Return empty array if user not found
      }
      // Set the where clause to filter by this user's ID
      whereClause = { userId: user.id };
    }

    const streams = await prisma.stream.findMany({
      where: whereClause, // Apply the filter
      include: {
        user: { 
           select: { 
            id: true, 
            username: true, 
            avatarUrl: true, 
            isVerified: true,
            _count: { select: { followers: true } }
          }
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedStreams = streams.map(formatStreamForFrontend);
    res.status(200).json(formattedStreams);

  } catch (error) {
    res.status(500).json({ detail: 'Server error' });
  }
};

// ... (keep all your other stream functions)

export const listLiveStreams = async (req: Request, res: Response) => {
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
            _count: { select: { followers: true } }
          }
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedStreams = streams.map(formatStreamForFrontend);
    res.status(200).json(formattedStreams);
    
  } catch (error) {
    res.status(500).json({ detail: 'Server error' });
  }
};

// ... (your other functions: updateStream, deleteStream, startStream, etc.) ...
// Make sure to copy/paste your remaining functions back into this file.
// For example:

export const updateStream = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    // @ts-ignore
    const userId = req.user.id;
    const { title, description } = req.body;

    // ... (your checkStreamOwnership logic)

    const stream = await prisma.stream.update({
      where: { id },
      data: { title, description },
      include: { // Include data for formatting
        user: { 
           select: { 
            id: true, 
            username: true, 
            avatarUrl: true, 
            isVerified: true,
            _count: { select: { followers: true } }
          }
        },
        _count: {
          select: { messages: true }
        }
      }
    });
    
    const formattedStream = formatStreamForFrontend(stream);
    res.status(200).json(formattedStream);
    
  } catch (error) {
    res.status(500).json({ detail: 'Server error' });
  }
};

// (Helper function to check ownership)
const checkStreamOwnership = async (userId: number, streamId: number) => {
  const stream = await prisma.stream.findUnique({
    where: { id: streamId },
  });
  if (!stream) return { error: 'Stream not found', owned: false };
  if (stream.userId !== userId)
    return { error: 'You do not own this stream', owned: false };
  return { error: null, owned: true };
};

// (Your other functions: delete, start, end, view, leave)
export const deleteStream = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    // @ts-ignore
    const userId = req.user.id;

    const { error, owned } = await checkStreamOwnership(userId, id);
    if (!owned) {
      return res.status(404).json({ detail: error });
    }
    
    await prisma.message.deleteMany({ where: { streamId: id } }); // Also delete messages
    await prisma.stream.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ detail: 'Server error' });
  }
};

export const startStream = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    // @ts-ignore
    const userId = req.user.id;

    const { error, owned } = await checkStreamOwnership(userId, id);
    if (!owned) {
      return res.status(404).json({ detail: error });
    }

    await prisma.stream.update({
      where: { id },
      data: { status: 'LIVE', endedAt: null }, // Use status enum
    });
    res.status(200).json({ detail: 'Stream started' });
  } catch (error) {
    res.status(500).json({ detail: 'Server error' });
  }
};

export const endStream = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    // @ts-ignore
    const userId = req.user.id;

    const { error, owned } = await checkStreamOwnership(userId, id);
    if (!owned) {
      return res.status(404).json({ detail: error });
    }

    await prisma.stream.update({
      where: { id },
      data: { status: 'ENDED', endedAt: new Date() }, // Use status enum
    });
    res.status(200).json({ detail: 'Stream ended' });
  } catch (error) {
    res.status(500).json({ detail: 'Server error' });
  }
};

export const viewStream = async (req: Request, res: Response) => {
  res.status(200).json({ detail: 'View logged' });
};

export const leaveStream = async (req: Request, res: Response) => {
  res.status(200).json({ detail: 'Leave logged' });
};