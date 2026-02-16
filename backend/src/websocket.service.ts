// src/websocket.service.ts
import { WebSocket } from 'ws';
import jwt, { JwtPayload } from 'jsonwebtoken';
import prisma from './db';
import { analyzeMessage } from './services/ai.service'; // <-- 1. IMPORT new function

// This map stores all active connections, grouped by streamId
// Key: streamId, Value: Set of connected clients (WebSockets)
const streams = new Map<number, Set<WebSocket>>();

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
          streams.set(currentStreamId, new Set());
        }
        streams.get(currentStreamId)!.add(ws);

        console.log(`User ${currentUserId} joined stream ${currentStreamId}`);
        ws.send(JSON.stringify({ type: 'join_success', payload: { streamId } }));
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
          // Send "blocked" message ONLY to the sender
          ws.send(JSON.stringify({
              type: 'message_blocked',
              // FIXED: Use the dynamic reason from the AI
              payload: { reason: analysis.reason || 'Message violates community guidelines.' }, 
            }));
          // Broadcast the toxic message ONLY to the stream owner (moderator)
          // TODO: Add logic to find stream owner's WebSocket and send
        } else {
          // Broadcast the clean message to everyone
          broadcastToStream(currentStreamId, {
            type: 'new_message',
            payload: savedMessage,
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
    if (currentStreamId && streams.has(currentStreamId)) {
      streams.get(currentStreamId)!.delete(ws);
      console.log(`User ${currentUserId} left stream ${currentStreamId}`);
    }
  });
};