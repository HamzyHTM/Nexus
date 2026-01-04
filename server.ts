
/**
 * NEXUS CHAT SERVER (REFERENCE IMPLEMENTATION)
 * This file provides the logic for a production Node.js environment.
 */
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json());

// Socket.IO Logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', (chatId) => {
    socket.join(chatId);
  });

  socket.on('send_message', (data) => {
    // Save to DB here
    io.to(data.chatId).emit('receive_message', data);
  });

  socket.on('typing', (data) => {
    socket.to(data.chatId).emit('user_typing', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
