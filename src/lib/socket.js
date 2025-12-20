import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io = null;
const onlineUsers = new Map();

export const initializesockeet = (httpServer) => {
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
        socket.disconnect(true);
        return;
      }

      const token = rawCookie.split('=')?.[1]?.trim();
      if (!token) {
        socket.disconnect(true);
        return;
      }

      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      if (!decodedToken) {
        socket.disconnect(true);
        return;
      }

      socket.userId = decodedToken.userId;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
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
    io.emit("online:users", Array.from(onlineUsers.keys()));

    // Disconnect logic when the socket disconnects
    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      console.log('User disconnected: ', { userId, newSocketId });
      io.emit("online:users", Array.from(onlineUsers.keys()));
    });
  });
};
