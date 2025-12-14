import { socketAuth } from './middleware/socketAuth.js';

/**
 * Initialize Socket.IO with authentication and handlers
 * @param {Object} io - Socket.IO instance
 */
export const initializeSocketHandlers = (io) => {
  // Apply authentication middleware
  io.use(socketAuth);

  // Handle connections
  io.on('connection', (socket) => {
    console.log(`✅ Socket connected: ${socket.user.name} (${socket.id})`);

    // Join user's personal room (for direct notifications)
    socket.join(`user:${socket.userId}`);
    console.log(`📥 User joined personal room: user:${socket.userId}`);

    // Test event
    socket.on('ping', (callback) => {
      console.log(`🏓 Ping received from ${socket.user.name}`);
      if (callback) {
        callback({
          success: true,
          message: 'pong',
          timestamp: new Date().toISOString(),
          user: socket.user,
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`❌ Socket disconnected: ${socket.user.name} (${socket.id}) - Reason: ${reason}`);
    });

    // Error handling
    socket.on('error', (error) => {
      console.error(`⚠️  Socket error: ${socket.user.name}`, error);
    });
  });

  console.log('✅ Socket handlers initialized');
};
