import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { HttpResponse } from '../utils/HttpResponse.js';
import {
  generateTokenandSetCookie,
  generateVerficationToken,
} from '../utils/utils.js';
import { sendVerificationEmail, sendWelcomeEmail } from '../mailtrap/emails.js';

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
    return HttpResponse(res, 200, false, 'Email verified successfully');
  } catch (error) {
    console.error('Error during email verification:', error);
    return HttpResponse(res, 500, true, 'Internal Server Error');
  }
};

export const login = async (req, res) => {
  return HttpResponse(res, 200, false, 'Login Route Accessed');
};

export const logout = async (req, res) => {
  return HttpResponse(res, 200, false, 'Logout Route Accessed');
};
