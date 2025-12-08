import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { HttpResponse } from '../utils/HttpResponse.js';
import {
  generateTokenandSetCookie,
  generateVerficationToken,
} from '../utils/utils.js';

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
    generateTokenandSetCookie(res, newUser._id);

    return HttpResponse(res, 201, false, 'User registered successfully', {
      user: { ...newUser._doc, password: undefined },
      VerficationToken,
    });
  } catch (error) {
    console.error('Error during signup:', error);
    return HttpResponse(res, 500, true, 'Internal Server Error');
  }
};

export const login = async (req, res) => {
  return HttpResponse(res, 200, false, 'Login Route Accessed');
};

export const logout = async (req, res) => {
  return HttpResponse(res, 200, false, 'Logout Route Accessed');
};
