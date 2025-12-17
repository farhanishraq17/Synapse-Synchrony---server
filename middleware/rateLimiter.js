import rateLimit from 'express-rate-limit';

/**
 * Rate Limiter for Authentication Routes
 * Prevents brute-force attacks by limiting requests per IP
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // ✅ Increased from 10 to 50 for debugging
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});


/**
 * Rate Limiter for OTP Routes
 * More restrictive to prevent OTP spam
 */
export const otpRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Limit each IP to 3 OTP requests per 5 minutes
  message: {
    success: false,
    message: 'Too many OTP requests. Please try again in 5 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General API Rate Limiter
 * Applied to all API routes
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict Rate Limiter for Critical Operations
 * Use for password reset, email changes, etc.
 */
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per hour
  message: {
    success: false,
    message: 'Too many requests for this operation. Please try again in an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
