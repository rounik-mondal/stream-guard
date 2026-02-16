// src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid'; // Import uuid

// Import Routers
import authRoutes from './api/auth.routes';
import userRoutes from './api/users.routes';
import streamRoutes from './api/streams.routes';
import chatRoutes from './api/chat.routes';

// Import WS handler
import { handleWebSocketConnection } from './websocket.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// --- Global Middleware ---
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

// --- API Routes ---
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', streamRoutes);
app.use('/api', chatRoutes);

// --- Test Route ---
app.get('/', (req, res) => {
  res.send('Stream Guard API is running!');
});

// --- Create HTTP Server ---
const server = http.createServer(app);

// --- Create WebSocket Server ---
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Client connected via WebSocket');
  handleWebSocketConnection(ws);
});

// --- Start Server ---
server.listen(PORT, () => {
  console.log(`🚀 Server (HTTP & WS) running on http://localhost:${PORT}`);
});