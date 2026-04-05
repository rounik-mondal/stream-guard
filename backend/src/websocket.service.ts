// src/websocket.service.ts
import { WebSocket } from 'ws';
import jwt, { JwtPayload } from 'jsonwebtoken';
import prisma from './db';
import { analyzeMessage } from './services/ai.service'; // <-- 1. IMPORT new function

// This map stores all active connections, grouped by streamId
// Key: streamId, Value: Map of userId -> WebSocket
const streams = new Map<number, Map<number, WebSocket>>();

/**
 * Sends a JSON payload to every connected client in a specific stream.
 */
export const broadcastToStream = (streamId: number, payload: any) => {
  const clients = streams.get(streamId);
  if (clients) {
    const message = JSON.stringify(payload);
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
};

/**
 * Sends a JSON payload to a specific user in a stream.
 */
export const sendToUserInStream = (streamId: number, userId: number, payload: any) => {
  const clients = streams.get(streamId);
  if (clients) {
    const client = clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(payload));
    }
  }
};

interface CustomJwtPayload extends JwtPayload {
  id: number;
}

// Main function to handle a new connection
export const handleWebSocketConnection = (ws: WebSocket) => {
  let currentStreamId: number | null = null;
  let currentUserId: number | null = null;

  ws.on('message', async (message) => { // (Already async)
    try {
      const data = JSON.parse(message.toString());
      
      // --- Message Type: JOIN_STREAM ---
      if (data.type === 'join_stream') {
        const { streamId, token } = data.payload;

        // 1. GET THE SECRET AND CHECK IT
        const secret = process.env.JWT_SECRET;
        if (!secret) {
          throw new Error('JWT_SECRET is not defined');
        }

        // 2. VERIFY THE TOKEN
        const decoded = jwt.verify(token, secret) as CustomJwtPayload;
        
        if (typeof decoded === 'string' || !decoded.id) {
          return ws.send(JSON.stringify({ type: 'error', payload: 'Invalid token' }));
        }

        currentUserId = decoded.id;
        currentStreamId = parseInt(streamId);

        if (!streams.has(currentStreamId)) {
          streams.set(currentStreamId, new Map());
        }
        streams.get(currentStreamId)!.set(currentUserId, ws);

        // Increment database viewerCount for lifetime views
        try {
          await prisma.stream.update({
            where: { id: currentStreamId },
            data: { viewerCount: { increment: 1 } },
          });
        } catch (dbErr) {
          console.error("DB Error incrementing viewer count", dbErr);
        }

        console.log(`User ${currentUserId} joined stream ${currentStreamId}`);
        ws.send(JSON.stringify({ type: 'join_success', payload: { streamId } }));

        // Broadcast active viewer count
        broadcastToStream(currentStreamId, {
          type: 'viewer_count_update',
          payload: { liveViewers: streams.get(currentStreamId)!.size }
        });
      }

      // --- Message Type: SEND_MESSAGE ---
      if (data.type === 'send_message') {
        if (!currentStreamId || !currentUserId) {
          return ws.send(JSON.stringify({ type: 'error', payload: 'Not authorized' }));
        }

        const { content } = data.payload;

        // *** RUN STREAM GUARD (GEMINI) ***
        // FIXED: Added 'await' for the async Gemini API call
        const analysis = await analyzeMessage(content); 

        // Save to database, flagging if toxic
        const savedMessage = await prisma.message.create({
          data: {
            content,
            authorId: currentUserId,
            streamId: currentStreamId,
            isFlagged: analysis.isToxic, // Save analysis result
          },
          include: {
            author: { select: { id: true, username: true, avatarUrl: true } },
          },
        });

        if (analysis.isToxic) {
          // Increment user's toxic score
          await prisma.user.update({
            where: { id: currentUserId },
            data: { toxicScore: { increment: 1 } },
          });

          // Send "blocked" message ONLY to the sender
          ws.send(JSON.stringify({
              type: 'message_blocked',
              payload: { reason: analysis.reason || 'Message violates community guidelines.' }, 
            }));
        } else {
          // Broadcast the clean message to everyone
          broadcastToStream(currentStreamId, {
            type: 'new_message',
            payload: savedMessage,
          });
        }
      }

      // --- WebRTC Signaling ---
      if (['webrtc_offer', 'webrtc_answer', 'webrtc_ice_candidate', 'webrtc_viewer_join'].includes(data.type)) {
        if (!currentStreamId || !currentUserId) return;
        
        const { targetUserId } = data.payload;
        // If there's a specific target, send only to them. Otherwise broadcast.
        if (targetUserId) {
          sendToUserInStream(currentStreamId, targetUserId, {
            type: data.type,
            payload: { ...data.payload, senderId: currentUserId }
          });
        } else {
          broadcastToStream(currentStreamId, {
            type: data.type,
            payload: { ...data.payload, senderId: currentUserId }
          });
        }
      }
    } catch (error) {
      console.error('WS Error:', error);
      ws.send(JSON.stringify({ type: 'error', payload: 'Invalid message or token' }));
    }
  });

  ws.on('close', () => {
    // Remove client from the "room"
    if (currentStreamId && currentUserId && streams.has(currentStreamId)) {
      streams.get(currentStreamId)!.delete(currentUserId);
      console.log(`User ${currentUserId} left stream ${currentStreamId}`);
      
      // Broadcast updated count
      const updatedSize = streams.get(currentStreamId)!.size;
      broadcastToStream(currentStreamId, {
        type: 'viewer_count_update',
        payload: { liveViewers: updatedSize }
      });
      
      // Optional: Cleanup empty maps
      if (updatedSize === 0) {
        streams.delete(currentStreamId);
      }
    }
  });
};