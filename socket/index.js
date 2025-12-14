import { socketAuth } from './middleware/socketAuth.js';
import { rateLimit } from './middleware/socketRateLimit.js';
import {
  handleJoinConversation,
  handleLeaveConversation,
  handleDisconnect,
} from './handlers/connectionHandler.js';
import {
  handleSendMessage,
  handleEditMessage,
  handleDeleteMessage,
} from './handlers/messageHandler.js';
import {
  handleTypingStart,
  handleTypingStop,
  clearUserTypingIndicators,
} from './handlers/typingHandler.js';
import {
  handleUserOnline,
  handleUserOffline,
  handleGetOnlineStatus,
} from './handlers/presenceHandler.js';
import {
  handleMarkAsRead,
  handleGetUnreadCount,
  handleGetAllUnreadCounts,
} from './handlers/readReceiptHandler.js';

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

    // Mark user as online
    handleUserOnline(io, socket);

    // ==========================================
    // CONNECTION EVENTS
    // ==========================================

    /**
     * Join a conversation room
     * Event: conversation:join
     * Data: { conversationId }
     */
    socket.on('conversation:join', rateLimit('conversation:join')((data, callback) => {
      handleJoinConversation(socket, data, callback);
    }));

    /**
     * Leave a conversation room
     * Event: conversation:leave
     * Data: { conversationId }
     */
    socket.on('conversation:leave', (data, callback) => {
      handleLeaveConversation(socket, data, callback);
    });

    // ==========================================
    // MESSAGE EVENTS
    // ==========================================

    /**
     * Send a new message
     * Event: message:send
     * Data: { conversationId, content, type, attachments }
     */
    socket.on('message:send', rateLimit('message:send')((data, callback) => {
      handleSendMessage(io, socket, data, callback);
    }));

    /**
     * Edit a message
     * Event: message:edit
     * Data: { messageId, conversationId, content }
     */
    socket.on('message:edit', (data, callback) => {
      handleEditMessage(io, socket, data, callback);
    });

    /**
     * Delete a message
     * Event: message:delete
     * Data: { messageId, conversationId }
     */
    socket.on('message:delete', (data, callback) => {
      handleDeleteMessage(io, socket, data, callback);
    });

    // ==========================================
    // TYPING INDICATORS
    // ==========================================

    /**
     * User started typing
     * Event: typing:start
     * Data: { conversationId }
     */
    socket.on('typing:start', rateLimit('typing:start')((data, callback) => {
      handleTypingStart(io, socket, data, callback);
    }));

    /**
     * User stopped typing
     * Event: typing:stop
     * Data: { conversationId }
     */
    socket.on('typing:stop', rateLimit('typing:stop')((data, callback) => {
      handleTypingStop(io, socket, data, callback);
    }));

    // ==========================================
    // PRESENCE
    // ==========================================

    /**
     * Get online status of users
     * Event: presence:get
     * Data: { userIds: [] }
     */
    socket.on('presence:get', (data, callback) => {
      handleGetOnlineStatus(io, socket, data, callback);
    });

    // ==========================================
    // READ RECEIPTS
    // ==========================================

    /**
     * Mark messages as read
     * Event: message:read
     * Data: { conversationId, messageId }
     */
    socket.on('message:read', rateLimit('message:read')((data, callback) => {
      handleMarkAsRead(io, socket, data, callback);
    }));

    /**
     * Get unread count for conversation
     * Event: unread:get
     * Data: { conversationId }
     */
    socket.on('unread:get', (data, callback) => {
      handleGetUnreadCount(socket, data, callback);
    });

    /**
     * Get all unread counts
     * Event: unread:getAll
     * Data: { conversationIds: [] }
     */
    socket.on('unread:getAll', (data, callback) => {
      handleGetAllUnreadCounts(socket, data, callback);
    });

    // ==========================================
    // UTILITY EVENTS
    // ==========================================

    /**
     * Ping-pong test
     * Event: ping
     */
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

    // ==========================================
    // DISCONNECTION
    // ==========================================

    socket.on('disconnect', (reason) => {
      // Clear typing indicators
      clearUserTypingIndicators(io, socket);
      
      // Mark user as offline
      handleUserOffline(io, socket);
      
      // Handle disconnection
      handleDisconnect(socket);
      
      console.log(`❌ Socket disconnected: ${socket.user.name} (${socket.id}) - Reason: ${reason}`);
    });

    // ==========================================
    // ERROR HANDLING
    // ==========================================

    socket.on('error', (error) => {
      console.error(`⚠️  Socket error: ${socket.user.name}`, error);
    });
  });

  console.log('✅ Socket handlers initialized');
};
