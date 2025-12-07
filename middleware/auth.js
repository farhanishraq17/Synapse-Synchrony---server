import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Authentication Middleware
 * Verifies JWT access token and attaches user ID to request
 * 
 * Usage: Add to routes that require authentication
 * Example: router.get('/protected', authenticate, controller)
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token not provided',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Check if user still exists
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or account deactivated',
      });
    }

    // Attach user ID to request
    req.userId = decoded.userId;
    req.user = user;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid access token',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token expired',
      });
    }

    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message,
    });
  }
};

/**
 * Role-Based Authorization Middleware
 * Checks if authenticated user has required role(s)
 * 
 * Usage: authorize(['admin', 'moderator'])
 * Example: router.delete('/users/:id', authenticate, authorize(['admin']), controller)
 * 
 * @param {Array<string>} roles - Array of allowed roles
 * @returns {Function} Express middleware function
 */
export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Check if user has at least one of the required roles
    const hasRole = roles.some(role => req.user.roles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        required: roles,
        current: req.user.roles,
      });
    }

    next();
  };
};

/**
 * Optional Authentication Middleware
 * Attaches user to request if valid token provided, but doesn't reject if missing
 * Useful for routes that can be accessed by both authenticated and non-authenticated users
 */
export const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token, continue without authentication
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.userId);

    if (user && user.isActive) {
      req.userId = decoded.userId;
      req.user = user;
    }

    next();
  } catch (error) {
    // Silently fail and continue without authentication
    next();
  }
};
