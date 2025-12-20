import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Initialize Socket.IO server
 * @param {Object} httpServer - HTTP server instance
 * @returns {Object} - Socket.IO instance
 */
export const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000, // 60 seconds
    pingInterval: 25000, // 25 seconds
  });

  console.log('✅ Socket.IO server initialized');

  return io;
};

/**
 * Authenticate socket connection
 * Verifies JWT token from handshake
 * @param {Object} socket - Socket instance
 * @param {Function} next - Next middleware
 */
export const authenticateSocket = async (socket, next) => {
  try {
    // Get token from handshake auth or query
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Check if user exists and is active
    const user = await User.findById(decoded.userId).select('name email avatar isActive roles');

    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    if (!user.isActive) {
      return next(new Error('Authentication error: Account deactivated'));
    }

    // Attach user to socket
    socket.userId = decoded.userId;
    socket.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      roles: user.roles,
    };

    console.log(`✅ Socket authenticated: ${user.name} (${socket.id})`);

    next();
  } catch (error) {
    console.error('Socket authentication error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return next(new Error('Authentication error: Invalid token'));
    }
    
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Authentication error: Token expired'));
    }

    return next(new Error('Authentication error: ' + error.message));
  }
};

/**
 * Log socket connection
 * @param {Object} socket - Socket instance
 */
export const logConnection = (socket) => {
  console.log(`📡 New connection: ${socket.user.name} (${socket.id})`);
  
  socket.on('disconnect', (reason) => {
    console.log(`📴 Disconnected: ${socket.user.name} (${socket.id}) - Reason: ${reason}`);
  });
};
