import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';

/**
 * Generate JWT Access Token (Short-lived)
 * @param {string} userId - User's MongoDB ID
 * @returns {string} JWT token
 */
const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' } // 15 minutes
  );
};

/**
 * Generate JWT Refresh Token (Long-lived)
 * @param {string} userId - User's MongoDB ID
 * @returns {string} JWT token
 */
const generateRefreshToken = (userId) => {
 
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' } // 7 days
  );
};

/**
 * Set refresh token as HttpOnly cookie
 * @param {object} res - Express response object
 * @param {string} token - Refresh token
 */
const setRefreshTokenCookie = (res, token) => {
  const cookieOptions = {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };

  // In production: secure + none for cross-origin
  // In development: lax (no secure needed for localhost)
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
    cookieOptions.sameSite = 'none';
  } else {
    cookieOptions.sameSite = 'lax';
  }

  console.log('🍪 SETTING COOKIE:', {
    name: 'refreshToken',
    ...cookieOptions,
    token: token.substring(0, 20) + '...',
  });

  res.cookie('refreshToken', token, cookieOptions);
};




/**
 * CONTROLLER: Register new user with email and password
 * Route: POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    const { email, password, name, phoneNumber } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        ...(phoneNumber ? [{ phoneNumber }] : [])
      ]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email or phone number already exists',
      });
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password,
      name,
      phoneNumber,
      isVerified: false, // Require email verification
    });

    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    // Set refresh token cookie
    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          roles: user.roles,
          isVerified: user.isVerified,
        },
        accessToken,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
    });
  }
};

/**
 * CONTROLLER: Login with email/password
 * Route: POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.',
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // Increment login attempts
      await user.incLoginAttempts();
      
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Set refresh token cookie
    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          roles: user.roles,
          isVerified: user.isVerified,
        },
        accessToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
};

/**
 * CONTROLLER: Refresh access token
 * Route: POST /api/auth/refresh
 */
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
     console.log('cookies in /refresh:', req.cookies);

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not provided',
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Find user and verify refresh token matches
    const user = await User.findById(decoded.userId).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
      error: error.message,
    });
  }
};

/**
 * CONTROLLER: Logout user
 * Route: POST /api/auth/logout
 */
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      // Verify and decode token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      // Remove refresh token from database
      await User.findByIdAndUpdate(decoded.userId, {
        $unset: { refreshToken: 1 },
      });
    }

    // Clear cookie
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear cookie even if there's an error
    res.clearCookie('refreshToken');
    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  }
};

/**
 * CONTROLLER: Send OTP to phone number
 * Route: POST /api/auth/otp/send
 */
export const sendOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    // Generate OTP using speakeasy (time-based)
    const secret = speakeasy.generateSecret({ length: 20 });
    const otp = speakeasy.totp({
      secret: secret.base32,
      encoding: 'base32',
      digits: 6,
      step: 300, // 5 minutes validity
    });

    // Calculate expiry time (5 minutes from now)
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    // Find or create user with phone number
    let user = await User.findOne({ phoneNumber });

    if (user) {
      // Update existing user's OTP
      user.otpSecret = secret.base32;
      user.otpExpires = otpExpires;
      await user.save();
    } else {
      // Create new user for OTP login
      user = new User({
        phoneNumber,
        email: `${phoneNumber}@temp.synapse.com`, // Temporary email
        otpSecret: secret.base32,
        otpExpires,
        isVerified: false,
      });
      await user.save();
    }

    // TODO: Integrate with Twilio or SMS service
    // For development, log OTP to console
    console.log(`📱 OTP for ${phoneNumber}: ${otp}`);
    console.log(`⏰ Valid until: ${otpExpires.toLocaleString()}`);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        phoneNumber,
        expiresIn: 300, // seconds
        // REMOVE IN PRODUCTION - Only for development
        ...(process.env.NODE_ENV === 'development' && { otp }),
      },
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message,
    });
  }
};

/**
 * CONTROLLER: Verify OTP and login/register
 * Route: POST /api/auth/otp/verify
 */
export const verifyOTP = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    // Find user with phone number and include OTP fields
    const user = await User.findOne({ phoneNumber })
      .select('+otpSecret +otpExpires');

    if (!user || !user.otpSecret) {
      return res.status(404).json({
        success: false,
        message: 'No OTP request found for this phone number',
      });
    }

    // Check if OTP has expired
    if (user.otpExpires < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
    }

    // Verify OTP using speakeasy
    const isValid = speakeasy.totp.verify({
      secret: user.otpSecret,
      encoding: 'base32',
      token: otp,
      step: 300,
      window: 1, // Allow 1 step before/after for clock skew
    });

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid OTP',
      });
    }

    // OTP verified successfully
    user.isVerified = true;
    user.otpSecret = undefined; // Clear OTP secret
    user.otpExpires = undefined;
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Set refresh token cookie
    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        user: {
          id: user._id,
          phoneNumber: user.phoneNumber,
          name: user.name,
          roles: user.roles,
          isVerified: user.isVerified,
        },
        accessToken,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed',
      error: error.message,
    });
  }
};

/**
 * CONTROLLER: Google OAuth Success Callback
 * Route: GET /api/auth/google/callback
 */
export const googleAuthCallback = async (req, res) => {
  try {
    // User is attached to req by Passport
    const user = req.user;

    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Set refresh token cookie
    setRefreshTokenCookie(res, refreshToken);

    // Redirect to frontend with access token
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${accessToken}`);
  } catch (error) {
    console.error('Google auth callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
  }
};

/**
 * CONTROLLER: Get current user profile
 * Route: GET /api/auth/me
 */
export const getCurrentUser = async (req, res) => {
  try {
    // User ID is attached to req by auth middleware
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          phoneNumber: user.phoneNumber,
          avatar: user.avatar,
          roles: user.roles,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user data',
      error: error.message,
    });
  }
};
