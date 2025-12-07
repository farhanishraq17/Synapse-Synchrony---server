import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

/**
 * User Schema - Supports multiple authentication methods
 * - Traditional Email/Password
 * - Google OAuth 2.0
 * - Phone Number/OTP
 */
const userSchema = new mongoose.Schema(
  {
    // Email Authentication
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },

    // Password for traditional login (hashed)
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Don't include password in queries by default
    },

    // Google OAuth
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows null values while maintaining uniqueness
    },

    // Phone Number Authentication
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    // OTP Management (Time-based)
    otpSecret: {
      type: String,
      select: false, // Security: Never include in regular queries
    },
    otpExpires: {
      type: Date,
      select: false,
    },

    // User Profile Information
    name: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String, // URL to profile picture
    },

    // Account Status
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // Role-Based Access Control (RBAC)
    roles: {
      type: [String],
      enum: ['user', 'admin', 'moderator', 'farmer', 'partner'],
      default: ['user'],
    },

    // Refresh Token for session management
    refreshToken: {
      type: String,
      select: false,
    },

    // Account metadata
    lastLogin: {
      type: Date,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

/**
 * PRE-SAVE HOOK: Hash password before saving
 * Only runs if password is modified or new
 */
userSchema.pre('save', async function (next) {
  try {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
      return next();
    }

    // Skip hashing if password is empty (OAuth users)
    if (!this.password) {
      return next();
    }

    // Generate salt and hash password
    const salt = await bcrypt.genSalt(12); // High salt rounds for security
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * INSTANCE METHOD: Compare password for login
 * @param {string} candidatePassword - Plain text password to compare
 * @returns {Promise<boolean>} - True if passwords match
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    // this.password might be undefined if select: false
    if (!this.password) {
      return false;
    }
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

/**
 * INSTANCE METHOD: Check if account is locked
 * @returns {boolean} - True if account is currently locked
 */
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

/**
 * INSTANCE METHOD: Increment login attempts
 */
userSchema.methods.incLoginAttempts = async function () {
  // If we have a previous lock that has expired, reset attempts
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Lock account after 5 failed attempts for 2 hours
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours

  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + LOCK_TIME };
  }

  return await this.updateOne(updates);
};

/**
 * INSTANCE METHOD: Reset login attempts on successful login
 */
userSchema.methods.resetLoginAttempts = async function () {
  return await this.updateOne({
    $set: { loginAttempts: 0, lastLogin: Date.now() },
    $unset: { lockUntil: 1 },
  });
};

/**
 * STATIC METHOD: Find user by credentials (email or phone)
 * @param {string} identifier - Email or phone number
 * @returns {Promise<User|null>}
 */
userSchema.statics.findByCredentials = async function (identifier) {
  // Check if identifier is email or phone
  const isEmail = /^\S+@\S+\.\S+$/.test(identifier);
  
  const query = isEmail
    ? { email: identifier.toLowerCase() }
    : { phoneNumber: identifier };

  return await this.findOne(query).select('+password');
};

// Create indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ phoneNumber: 1 });

const User = mongoose.model('User', userSchema);

export default User;
