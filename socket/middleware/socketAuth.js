import jwt from 'jsonwebtoken';
import User from '../../models/User.js';

/**
 * Socket Authentication Middleware
 * Verifies JWT token at socket handshake
 */
export const socketAuth = async (socket, next) => {
  try {
    // Get token from auth or query params
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      const error = new Error('No token provided');
      error.data = { code: 'NO_TOKEN' };
      return next(error);
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
      const error = new Error(err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token');
      error.data = { code: err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN' };
      return next(error);
    }

    // Get user from database
    const user = await User.findById(decoded.userId).select('name email avatar isActive roles');

    if (!user) {
      const error = new Error('User not found');
      error.data = { code: 'USER_NOT_FOUND' };
      return next(error);
    }

    if (!user.isActive) {
      const error = new Error('Account is deactivated');
      error.data = { code: 'ACCOUNT_INACTIVE' };
      return next(error);
    }

    // Attach user data to socket
    socket.userId = user._id.toString();
    socket.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      roles: user.roles,
    };

    next();
  } catch (error) {
    console.error('Socket auth error:', error);
    const err = new Error('Authentication failed');
    err.data = { code: 'AUTH_FAILED' };
    next(err);
  }
};
