// src/api/chat.controller.ts
// import { Request, Response } from 'express';
// import prisma from '../db';
// Import the broadcast helper from your WS service
// import { broadcastToStream } from '../websocket.service';

// Re-use the same logic from the websocket service
// const analyzeMessage = (content: string) => {
//   const badWords = ['examplebadword', 'danger', 'toxicword', 'hate'];
//   let isToxic = false;
//   let reason = null;
//   for (const word of badWords) {
//     if (content.toLowerCase().includes(word)) {
//       isToxic = true;
//       reason = 'Message contains forbidden word';
//       break;
//     }
//   }
//   return { isToxic, reason };
// };

// export const handleAnalyze = (req: Request, res: Response) => {
//   const { message } = req.body;
//   if (!message) {
//     return res.status(400).json({ detail: 'No message provided' });
//   }
//   const result = analyzeMessage(message);
//   res.status(200).json(result);
// };

// export const getMessages = async (req: Request, res: Response) => {
//   try {
//     const streamId = parseInt(req.params.streamId);
//     const messages = await prisma.message.findMany({
//       where: {
//         streamId,
//         isDeleted: false,
//         isFlagged: false, // By default, don't show flagged messages to viewers
//       },
//       orderBy: { createdAt: 'asc' },
//       take: 50, // Get last 50 messages
//       include: {
//         author: {
//           select: { id: true, username: true, avatarUrl: true },
//         },
//       },
//     });
//     res.status(200).json(messages);
//   } catch (error) {
//     res.status(500).json({ detail: 'Server error' });
//   }
// };

// // This endpoint is for non-websocket users (e.g., mobile app)
// export const sendMessage = async (req: Request, res: Response) => {
//   try {
//     const { content, streamId } = req.body;
//     // @ts-ignore
//     const authorId = req.user.id;

//     if (!content || !streamId) {
//       return res.status(400).json({ detail: 'content and streamId required' });
//     }
    
//     // *** RUN STREAM GUARD ***
//     const analysis = analyzeMessage(content);
//     if (analysis.isToxic) {
//       return res.status(400).json({ detail: 'Message violates guidelines' });
//     }

//     const savedMessage = await prisma.message.create({
//       data: {
//         content,
//         authorId,
//         streamId: parseInt(streamId),
//         isFlagged: analysis.isToxic,
//       },
//       include: {
//         author: { select: { id: true, username: true, avatarUrl: true } },
//       },
//     });

//     // *** BROADCAST TO WEBSOCKET ***
//     broadcastToStream(parseInt(streamId), {
//       type: 'new_message',
//       payload: savedMessage,
//     });

//     res.status(201).json(savedMessage);

//   } catch (error) {
//      res.status(500).json({ detail: 'Server error' });
//   }
// };


// src/api/chat.controller.ts

import { Request, Response } from 'express';
import prisma from '../db';
import { broadcastToStream } from '../websocket.service';
import { analyzeMessage } from '../services/ai.service'; // <-- 1. IMPORT new function

// 2. The old, simple analyzeMessage function is DELETED

export const handleAnalyze = async (req: Request, res: Response) => { // <-- 3. Add 'async'
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ detail: 'No message provided' });
  }
  // 4. Add 'await'
  const result = await analyzeMessage(message); 
  res.status(200).json(result);
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const streamId = parseInt(req.params.streamId);
    const messages = await prisma.message.findMany({
      where: {
        streamId,
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
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ detail: 'Server error' });
  }
};

export const sendMessage = async (req: Request, res: Response) => { // (Already async)
  try {
    const { content, streamId } = req.body;
    // @ts-ignore
    const authorId = req.user.id;

    if (!content || !streamId) {
      return res.status(400).json({ detail: 'content and streamId required' });
    }
    
    // 5. Add 'await'
    const analysis = await analyzeMessage(content);
    if (analysis.isToxic) {
      // Send back the AI's reason
      return res.status(400).json({ detail: analysis.reason || 'Message violates guidelines' });
    }

    const savedMessage = await prisma.message.create({
      data: {
        content,
        authorId,
        streamId: parseInt(streamId),
        isFlagged: analysis.isToxic, // This will be false
      },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    broadcastToStream(parseInt(streamId), {
      type: 'new_message',
      payload: savedMessage,
    });

    res.status(201).json(savedMessage);

  } catch (error) {
     res.status(500).json({ detail: 'Server error' });
  }
};

// ... (keep all your other functions: deleteMessage, reportMessage, getChatStats)

export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const messageId = parseInt(req.params.messageId);
    // @ts-ignore
    const currentUserId = req.user.id;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { stream: true },
    });

    if (!message) {
      return res.status(404).json({ detail: 'Message not found' });
    }

    // Check if user is author OR stream owner
    const isAuthor = message.authorId === currentUserId;
    const isStreamOwner = message.stream.userId === currentUserId;

    if (!isAuthor && !isStreamOwner) {
      return res.status(403).json({ detail: 'You cannot delete this message' });
    }

    // Soft delete the message
    await prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true },
    });

    // Broadcast the deletion
    broadcastToStream(message.streamId, {
      type: 'delete_message',
      payload: { messageId },
    });

    res.status(204).send();

  } catch (error) {
     res.status(500).json({ detail: 'Server error' });
  }
};

export const reportMessage = async (req: Request, res: Response) => {
  try {
    const messageId = parseInt(req.params.messageId);
    // @ts-ignore
    const reporterId = req.user.id;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ detail: 'Reason is required' });
    }

    await prisma.report.create({
      data: {
        reason,
        reporterId,
        messageId,
      },
    });

    res.status(201).json({ detail: 'Report submitted' });
  } catch (error) {
    res.status(500).json({ detail: 'Server error' });
  }
};

export const getChatStats = async (req: Request, res: Response) => {
  try {
    // This is a simple stats endpoint. You can make this query
    // as complex as you need (e.g., filter by date, by user).
    const totalMessages = await prisma.message.count();
    const flaggedMessages = await prisma.message.count({
      where: { isFlagged: true },
    });
    const totalReports = await prisma.report.count();

    res.status(200).json({
      totalMessages,
      flaggedMessages,
      totalReports,
    });
  } catch (error) {
    res.status(500).json({ detail: 'Server error' });
  }
};