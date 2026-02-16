import { Request, Response } from 'express';
import prisma from '../db';
import { broadcastToStream } from '../websocket.service';
import { analyzeMessage } from '../services/ai.service';

// ===============================
// ANALYZE MESSAGE
// ===============================
export const handleAnalyze = async (req: Request, res: Response) => {
  const { message } = req.body as { message?: string };

  if (!message) {
    return res.status(400).json({ detail: 'No message provided' });
  }

  const result = await analyzeMessage(message);
  return res.status(200).json(result);
};

// ===============================
// GET MESSAGES
// ===============================
export const getMessages = async (req: Request, res: Response) => {
  try {
    const { streamId } = req.params;

    if (!streamId) {
      return res.status(400).json({ detail: 'streamId required' });
    }

    const numericStreamId = Number(streamId);

    if (Number.isNaN(numericStreamId)) {
      return res.status(400).json({ detail: 'Invalid streamId' });
    }

    const messages = await prisma.message.findMany({
      where: {
        streamId: numericStreamId,
        isDeleted: false,
        isFlagged: false,
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
      include: {
        author: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });

    return res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Server error' });
  }
};

// ===============================
// SEND MESSAGE
// ===============================
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { content, streamId } = req.body as {
      content?: string;
      streamId?: string | number;
    };

    if (!req.user) {
      return res.status(401).json({ detail: 'Not authorized' });
    }

    if (!content || !streamId) {
      return res
        .status(400)
        .json({ detail: 'content and streamId required' });
    }

    const numericStreamId = Number(streamId);

    if (Number.isNaN(numericStreamId)) {
      return res.status(400).json({ detail: 'Invalid streamId' });
    }

    // 🔥 StreamGuard AI check
    const analysis = await analyzeMessage(content);

    if (analysis.isToxic) {
      return res.status(400).json({
        detail: analysis.reason || 'Message violates guidelines',
      });
    }

    const savedMessage = await prisma.message.create({
      data: {
        content,
        authorId: req.user.id,
        streamId: numericStreamId,
        isFlagged: false,
      },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    // 🔥 WebSocket broadcast
    broadcastToStream(numericStreamId, {
      type: 'new_message',
      payload: savedMessage,
    });

    return res.status(201).json(savedMessage);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Server error' });
  }
};

// ===============================
// DELETE MESSAGE
// ===============================
export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;

    if (!req.user) {
      return res.status(401).json({ detail: 'Not authorized' });
    }

    if (!messageId) {
      return res.status(400).json({ detail: 'messageId required' });
    }

    const numericMessageId = Number(messageId);

    if (Number.isNaN(numericMessageId)) {
      return res.status(400).json({ detail: 'Invalid messageId' });
    }

    const message = await prisma.message.findUnique({
      where: { id: numericMessageId },
      include: { stream: true },
    });

    if (!message) {
      return res.status(404).json({ detail: 'Message not found' });
    }

    const isAuthor = message.authorId === req.user.id;
    const isStreamOwner = message.stream.userId === req.user.id;

    if (!isAuthor && !isStreamOwner) {
      return res
        .status(403)
        .json({ detail: 'You cannot delete this message' });
    }

    await prisma.message.update({
      where: { id: numericMessageId },
      data: { isDeleted: true },
    });

    broadcastToStream(message.streamId, {
      type: 'delete_message',
      payload: { messageId: numericMessageId },
    });

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Server error' });
  }
};

// ===============================
// REPORT MESSAGE
// ===============================
export const reportMessage = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const { reason } = req.body as { reason?: string };

    if (!req.user) {
      return res.status(401).json({ detail: 'Not authorized' });
    }

    if (!messageId) {
      return res.status(400).json({ detail: 'messageId required' });
    }

    if (!reason) {
      return res.status(400).json({ detail: 'Reason is required' });
    }

    const numericMessageId = Number(messageId);

    if (Number.isNaN(numericMessageId)) {
      return res.status(400).json({ detail: 'Invalid messageId' });
    }

    await prisma.report.create({
      data: {
        reason,
        reporterId: req.user.id,
        messageId: numericMessageId,
      },
    });

    return res.status(201).json({ detail: 'Report submitted' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Server error' });
  }
};

// ===============================
// CHAT STATS
// ===============================
export const getChatStats = async (_req: Request, res: Response) => {
  try {
    const totalMessages = await prisma.message.count();
    const flaggedMessages = await prisma.message.count({
      where: { isFlagged: true },
    });
    const totalReports = await prisma.report.count();

    return res.status(200).json({
      totalMessages,
      flaggedMessages,
      totalReports,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Server error' });
  }
};
