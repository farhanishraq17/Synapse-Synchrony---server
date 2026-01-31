// controllers/ProfileController.js
import User from '../models/User.js';
import { HttpResponse } from '../utils/HttpResponse.js';
import cloudinary from '../config/cloudinary.js';
import { Groq } from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Get User Profile
export const GetUserProfile = async (req, res) => {
  const userId = req.userId;

  try {
    const user = await User.findById(userId).select('-password -resetPasswordToken -resetPasswordExpiresAt -verificationToken -verificationTokenExpiresAt');

    if (!user) {
      return HttpResponse(res, 404, true, 'User not found');
    }

    return HttpResponse(res, 200, false, 'Profile retrieved successfully', user);
  } catch (error) {
    console.error('Error in GetUserProfile:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};

// Update User Profile
export const UpdateUserProfile = async (req, res) => {
  const userId = req.userId;
  const {
    name,
    avatar,
    bio,
    phone,
    dateOfBirth,
    gender,
    emergencyContact,
    address,
  } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return HttpResponse(res, 404, true, 'User not found');
    }

    // Upload avatar to Cloudinary if provided and it's a base64 string
    let avatarUrl = user.avatar;
    if (avatar && avatar.startsWith('data:image')) {
      try {
        const uploadRes = await cloudinary.uploader.upload(avatar, {
          folder: 'synapse_avatars',
          resource_type: 'auto',
        });
        avatarUrl = uploadRes.secure_url;
      } catch (uploadErr) {
        console.error('Cloudinary Upload Error:', uploadErr);
        return HttpResponse(res, 500, true, 'Avatar upload failed');
      }
    }

    // Update fields
    if (name !== undefined) user.name = name;
    if (avatarUrl !== user.avatar) user.avatar = avatarUrl;
    if (bio !== undefined) user.bio = bio;
    if (phone !== undefined) user.phone = phone;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (gender !== undefined) user.gender = gender;
    if (emergencyContact !== undefined) user.emergencyContact = emergencyContact;
    if (address !== undefined) user.address = address;

    await user.save();

    // Return updated user without sensitive fields
    const updatedUser = await User.findById(userId).select('-password -resetPasswordToken -resetPasswordExpiresAt -verificationToken -verificationTokenExpiresAt');

    return HttpResponse(res, 200, false, 'Profile updated successfully', updatedUser);
  } catch (error) {
    console.error('Error in UpdateUserProfile:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};

// Refine Bio with AI
export const RefineBioWithAI = async (req, res) => {
  const { bio } = req.body;

  try {
    if (!bio || !bio.trim()) {
      return HttpResponse(res, 400, true, 'Bio text is required');
    }

    const prompt = `Refine the following bio into a professional, concise, and well-structured format (maximum 500 characters). Maintain the core message and personality while improving clarity and formality. Return only the refined bio text without any additional commentary or explanations.

Bio to refine:
${bio}

Refined Bio:`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 500,
    });

    const refinedBio = chatCompletion.choices[0]?.message?.content?.trim();

    if (!refinedBio) {
      return HttpResponse(res, 500, true, 'Failed to generate refined bio');
    }

    return HttpResponse(res, 200, false, 'Bio refined successfully', { refinedBio });
  } catch (error) {
    console.error('Error in RefineBioWithAI:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};
