/**
 * Presence Handler
 * Manages online/offline status and presence tracking
 */

// Store online users: Map<userId, Set<socketId>>
const onlineUsers = new Map();

// Store user socket mapping: Map<socketId, userId>
const socketUserMap = new Map();

/**
 * Mark user as online
 * @param {Object} io - Socket.IO server instance
 * @param {Object} socket - Socket instance
 */
export const handleUserOnline = (io, socket) => {
  const userId = socket.userId;

  // Initialize user's socket set if not exists
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }

  // Add this socket to user's socket set
  onlineUsers.get(userId).add(socket.id);
  socketUserMap.set(socket.id, userId);

  // If this is the first socket for this user (they just came online)
  if (onlineUsers.get(userId).size === 1) {
    console.log(`🟢 User came online: ${socket.user.name}`);

    // Broadcast to user's personal room (for notifications)
    io.to(`user:${userId}`).emit('presence:online', {
      user: {
        id: socket.user.id,
        name: socket.user.name,
        avatar: socket.user.avatar,
      },
      timestamp: new Date().toISOString(),
    });
  }

  console.log(`📊 Online users: ${onlineUsers.size}, Total connections: ${io.engine.clientsCount}`);
};

/**
 * Mark user as offline
 * @param {Object} io - Socket.IO server instance
 * @param {Object} socket - Socket instance
 */
export const handleUserOffline = (io, socket) => {
  const userId = socketUserMap.get(socket.id);

  if (!userId) return;

  // Remove this socket from user's socket set
  if (onlineUsers.has(userId)) {
    onlineUsers.get(userId).delete(socket.id);

    // If user has no more sockets (they went offline)
    if (onlineUsers.get(userId).size === 0) {
      onlineUsers.delete(userId);
      console.log(`🔴 User went offline: ${socket.user.name}`);

      // Broadcast to user's personal room
      io.to(`user:${userId}`).emit('presence:offline', {
        user: {
          id: socket.user.id,
          name: socket.user.name,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Clean up socket mapping
  socketUserMap.delete(socket.id);

  console.log(`📊 Online users: ${onlineUsers.size}, Total connections: ${io.engine.clientsCount}`);
};

/**
 * Check if user is online
 * @param {String} userId - User ID to check
 * @returns {Boolean} - True if user is online
 */
export const isUserOnline = (userId) => {
  return onlineUsers.has(userId) && onlineUsers.get(userId).size > 0;
};

/**
 * Get all online users
 * @returns {Array} - Array of online user IDs
 */
export const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};

/**
 * Get online count
 * @returns {Number} - Number of online users
 */
export const getOnlineCount = () => {
  return onlineUsers.size;
};

/**
 * Get online users in a conversation
 * @param {Object} io - Socket.IO server instance
 * @param {String} conversationId - Conversation ID
 * @param {Array} memberIds - Array of member user IDs
 * @returns {Array} - Array of online member user IDs
 */
export const getOnlineUsersInConversation = (io, conversationId, memberIds) => {
  return memberIds.filter(memberId => isUserOnline(memberId));
};

/**
 * Handle request for online status
 * @param {Object} io - Socket.IO server instance
 * @param {Object} socket - Socket instance
 * @param {Object} data - { userIds }
 * @param {Function} callback - Acknowledgement callback
 */
export const handleGetOnlineStatus = (io, socket, data, callback) => {
  try {
    const { userIds } = data;

    if (!userIds || !Array.isArray(userIds)) {
      return callback({
        success: false,
        message: 'userIds array is required',
        code: 'INVALID_INPUT',
      });
    }

    const onlineStatus = {};
    userIds.forEach(userId => {
      onlineStatus[userId] = isUserOnline(userId);
    });

    callback({
      success: true,
      data: {
        onlineStatus,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Get online status error:', error);
    callback({
      success: false,
      message: error.message || 'Failed to get online status',
      code: 'STATUS_ERROR',
    });
  }
};

/**
 * Broadcast presence update to conversation members
 * @param {Object} io - Socket.IO server instance
 * @param {String} conversationId - Conversation ID
 * @param {String} userId - User ID
 * @param {String} status - 'online' or 'offline'
 * @param {Object} user - User data
 */
export const broadcastPresenceToConversation = (io, conversationId, userId, status, user) => {
  const roomName = `conversation:${conversationId}`;
  
  io.to(roomName).emit('presence:update', {
    conversationId,
    user: {
      id: userId,
      name: user.name,
      avatar: user.avatar,
    },
    status,
    timestamp: new Date().toISOString(),
  });
};
