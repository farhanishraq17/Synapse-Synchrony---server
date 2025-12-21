import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { validateChatParticipant } from '../controllers/ChatController.js';

let io = null;
const onlineUsers = new Map();

export const initializesockeet = (httpServer) => {
  // io.origins('http://localhost:5173');
  io = new Server(httpServer, {
    cors: {
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const rawCookie = socket.handshake.headers.cookie;
      if (!rawCookie) {
        console.log('No cookie found, disconnecting');
        socket.disconnect(true);
        return;
      }

      const token = rawCookie.split('=')?.[1]?.trim();
      if (!token) {
        console.log('No token found, disconnecting');
        socket.disconnect(true);
        return;
      }

      console.log('Raw Cookie:', rawCookie); // Log the raw cookie
      console.log('Extracted Token:', token); // Log the extracted token
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded Token:', decodedToken); // Check if userId exists in decodedToken
      if (!decodedToken) {
        console.log('Invalid token, disconnecting');
        socket.disconnect(true);
        return;
      }

      socket.userId = decodedToken.id;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      socket.disconnect(true); // Disconnect the socket if authentication fails
    }
  });

  io.on('connection', (socket) => {
    if (!socket.userId) {
      socket.disconnect(true); // Disconnect if userId is not present
      return;
    }
    const userId = socket.userId;
    const newSocketId = socket.id;

    console.log('Socket connected ', { userId, newSocketId });

    // Register Socket for the User
    onlineUsers.set(userId, newSocketId);

    // Emit the list of online users
    io.emit('online:users', Array.from(onlineUsers.keys()));

    // Create personal room for user
    socket.join(`user:${userId}`);

    socket.on('chat:join', async (chatId, callback) => {
      try {
        await validateChatParticipant(chatId, userId);
        socket.join(`chat:${chatId}`);
        console.log(`User ${userId} joined room chat:${chatId}`);
        callback?.();
      } catch (error) {
        console.error(`Error joining chat: ${error.message}`);
        callback?.(`Error joining chat: ${error.message}`);
      }
    });

    socket.on('chat:leave', (chatId) => {
      if (chatId) {
        socket.leave(`chat:${chatId}`);
        console.log(`User ${userId} left room chat:${chatId}`);
      }
    });

    // Disconnect logic when the socket disconnects
    socket.on('disconnect', () => {
      if (onlineUsers.get(userId) === newSocketId) {
        onlineUsers.delete(userId);
        io.emit('online:users', Array.from(onlineUsers.keys()));
      }
      console.log('socket disconnected', { userId, newSocketId });
    });
  });
};

// Helper to get IO instance
function getIO() {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

// Emit new chat to participants
export const emitNewChatToParticipants = (participants, chat) => {
  const io = getIO();
  for (const participantId of participants) {
    // Changed to use 'participants' parameter
    io.to(`user:${participantId}`).emit('chat:new', chat);
  }
};

// Emit new message to chat room
export const emitNewMessageToChatRoom = (senderId, chatId, message) => {
  const io = getIO();
  const senderSocketId = onlineUsers.get(senderId?.toString());

  console.log(senderId, 'senderId');
  console.log(senderSocketId, 'sender socketId exists');
  console.log('All online users:', Object.fromEntries(onlineUsers));

  if (senderSocketId) {
    io.to(`chat:${chatId}`).except(senderSocketId).emit('message:new', message); // Sender is excluded from receiving their own message
  } else {
    io.to(`chat:${chatId}`).emit('message:new', message); // Broadcast to the chat if sender is offline
  }
};

// Emit last message update to participants
export const emitLastMessageToParticipants = (
  participantIds,
  chatId,
  lastMessage
) => {
  const io = getIO();
  const payload = { chatId, lastMessage };

  for (const participantId of participantIds) {
    io.to(`user:${participantId}`).emit('chat:update', payload);
  }
};
