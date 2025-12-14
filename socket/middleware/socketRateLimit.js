
/**
 * Socket Rate Limiting Middleware
 * Prevents spam and abuse of socket events
 */

// Store rate limit data per user/event
const rateLimits = new Map();

/**
 * Rate limiter configuration
 */
const RATE_LIMIT_CONFIG = {
  'message:send': {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  'typing:start': {
    maxRequests: 5,
    windowMs: 10 * 1000, // 10 seconds
  },
  'typing:stop': {
    maxRequests: 5,
    windowMs: 10 * 1000,
  },
  'conversation:join': {
    maxRequests: 20,
    windowMs: 60 * 1000,
  },
  'message:read': {
    maxRequests: 30,
    windowMs: 60 * 1000,
  },
};

/**
 * Create rate limit key
 * @param {String} userId - User ID
 * @param {String} event - Event name
 * @returns {String} - Rate limit key
 */
const getRateLimitKey = (userId, event) => {
  return `${userId}:${event}`;
};

/**
 * Check if request is within rate limit
 * @param {String} userId - User ID
 * @param {String} event - Event name
 * @returns {Object} - { allowed: Boolean, retryAfter: Number }
 */
export const checkRateLimit = (userId, event) => {
  const config = RATE_LIMIT_CONFIG[event];
  
  if (!config) {
    // No rate limit configured for this event
    return { allowed: true, retryAfter: 0 };
  }

  const key = getRateLimitKey(userId, event);
  const now = Date.now();

  // Get or initialize rate limit data
  if (!rateLimits.has(key)) {
    rateLimits.set(key, {
      count: 0,
      resetTime: now + config.windowMs,
    });
  }

  const limitData = rateLimits.get(key);

  // Reset if window expired
  if (now > limitData.resetTime) {
    limitData.count = 0;
    limitData.resetTime = now + config.windowMs;
  }

  // Check if limit exceeded
  if (limitData.count >= config.maxRequests) {
    const retryAfter = Math.ceil((limitData.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Increment count
  limitData.count++;

  return { allowed: true, retryAfter: 0 };
};

/**
 * Rate limit middleware wrapper
 * @param {String} event - Event name
 * @param {Function} handler - Event handler
 * @returns {Function} - Wrapped handler
 */
export const rateLimit = (event) => {
  return (handler) => {
    return async function(data, callback) {
      const { allowed, retryAfter } = checkRateLimit(this.userId, event);

      if (!allowed) {
        console.log(`⚠️  Rate limit exceeded: ${this.user.name} - ${event} (retry after ${retryAfter}s)`);
        
        const error = {
          success: false,
          message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter,
        };
        
        return callback ? callback(error) : null;
      }

      // Execute handler
      return await handler.call(this, data, callback);
    };
  };
};

/**
 * Clean up expired rate limit entries (run periodically)
 */
export const cleanupRateLimits = () => {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, data] of rateLimits.entries()) {
    if (now > data.resetTime + 60000) { // Clean up 1 minute after reset
      rateLimits.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} expired rate limit entries`);
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupRateLimits, 5 * 60 * 1000);
