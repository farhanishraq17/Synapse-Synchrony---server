# So here is my entire User Data for you to debug

## User.js

```js
// models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: 'https://i.ibb.co.com/0yrpXd6k/Blank-Pfp.webp',
    },
    name: {
      type: String,
      required: true,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,
    verificationToken: String,
    verificationTokenExpiresAt: Date,
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

const User = mongoose.model('User', UserSchema, 'users');
export default User;
// users is the Collection Name

```

## AuthController.js

```js
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto'; // Make sure to import the crypto module
import { HttpResponse } from '../utils/HttpResponse.js';
import {
  generateTokenandSetCookie,
  generateVerficationToken,
} from '../utils/utils.js';
import {
  sendVerificationEmail,
  sendWelcomeEmail,
} from '../Brevo/Brevoemail.js';

export const signup = async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name)
    return HttpResponse(res, 400, true, 'All fields are required');
  try {
    const UserAlreadyExists = await User.findOne({ email: email });
    if (UserAlreadyExists) {
      return HttpResponse(res, 409, true, 'User already exists');
    }
    const HashedPassword = await bcrypt.hash(password, 10);
    const VerficationToken = generateVerficationToken();
    const newUser = new User({
      email,
      password: HashedPassword,
      name,
      verificationToken: VerficationToken,
      verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 Hours
    });
    await newUser.save();

    // Save the user Cookie
    await generateTokenandSetCookie(res, newUser._id);
    await sendVerificationEmail(newUser.email, VerficationToken);

    return HttpResponse(res, 201, false, 'User registered successfully', {
      user: { ...newUser._doc, password: undefined },
      VerficationToken,
    });
  } catch (error) {
    console.error('Error during signup:', error);
    return HttpResponse(res, 500, true, 'Internal Server Error');
  }
};

export const VerifyEmail = async (req, res) => {
  const { code } = req.body;

  try {
    const user = await User.findOne({
      verificationToken: code,
      verificationTokenExpiresAt: { $gt: new Date() },
    });
    if (!user) {
      return HttpResponse(
        res,
        400,
        true,
        'Invalid or expired verification token'
      );
    }
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save();
    await sendWelcomeEmail(user.email, user.name);
    return HttpResponse(res, 200, false, 'Email verified successfully', {
      user: { ...user._doc, password: undefined },
    });
  } catch (error) {
    console.error('Error during email verification:', error);
    return HttpResponse(res, 500, true, 'Internal Server Error');
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return HttpResponse(res, 400, true, 'Email and Password are required');
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return HttpResponse(res, 404, true, 'User not found');
    }
    const IsPasswordValid = await bcrypt.compare(password, user.password);
    if (!IsPasswordValid) {
      return HttpResponse(res, 401, true, 'Invalid credentials');
    }
    generateTokenandSetCookie(res, user._id);
    user.lastLogin = new Date();
    await user.save();
    return HttpResponse(res, 200, false, 'Login Successful', {
      user: { ...user._doc, password: undefined },
    });
  } catch (error) {
    console.error('Error during login:', error);
    return HttpResponse(res, 500, true, 'Internal Server Error');
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie('token');
    return HttpResponse(res, 200, false, 'Logged out successfully');
  } catch (error) {
    console.error('Error during logout:', error);
    return HttpResponse(res, 500, true, 'Internal Server Error');
  }
};

export const ForgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: 'User not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiresAt = resetTokenExpiresAt;

    await user.save();

    // send email
    // await sendPasswordResetEmail(
    //   user.email,
    //   `${process.env.CLIENT_URL}/reset-password/${resetToken}`
    // );

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email',
    });
  } catch (error) {
    console.log('Error in forgotPassword ', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const ResetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) return HttpResponse(res, 400, true, 'Token is required');
    const { password } = req.body;
    if (!password) return HttpResponse(res, 400, true, 'Password is required');
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiresAt: { $gt: new Date() },
    });
    if (!user) return HttpResponse(res, 400, true, 'Invalid or expired token');
    // Update the password, the user data and save those to the DB
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();
    // await sendResetSuccessEmail(user.email);
    return HttpResponse(res, 200, false, 'Password reset successful', user);
  } catch (error) {
    console.error('Error during password reset:', error);
    return HttpResponse(res, 500, true, 'Internal Server Error');
  }
};

export const CheckAuth = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.userId });
    if (!user) return HttpResponse(res, 404, true, 'User not found');
    return HttpResponse(
      res,
      200,
      false,
      'User Successfully Fetched and Authenticated',
      {
        user: { ...user._doc, password: undefined },
      }
    );
  } catch (error) {
    console.error('Error during auth check:', error);
    return HttpResponse(res, 500, true, 'Internal Server Error');
  }
};

```


## stream.js

```js
import { StreamChat } from 'stream-chat';
import 'dotenv/config';

const apiKey = process.env.STEAM_API_KEY;
const apiSecret = process.env.STEAM_API_SECRET;

if (!apiKey || !apiSecret) {
  console.error('Stream API key or Secret is missing');
}

const streamClient = StreamChat.getInstance(apiKey, apiSecret);

export const upsertStreamUser = async (userData) => {
  try {
    await streamClient.upsertUsers([userData]);
    return userData;
  } catch (error) {
    console.error('Error upserting Stream user:', error);
  }
};

export const generateStreamToken = (userId) => {
  try {
    // ensure userId is a string
    const userIdStr = userId.toString();
    return streamClient.createToken(userIdStr);
  } catch (error) {
    console.error('Error generating Stream token:', error);
  }
};

```

