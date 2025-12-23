import dotenv from 'dotenv';
dotenv.config();
import User from '../models/User.js';
import { connectDB } from '../config/db.js';

export const CreateWhoopAI = async () => {
  let whoopAI = await User.findOne({ isAI: true });

  if (whoopAI) {
    console.log('✅ Whoop AI already exists');
    return whoopAI;
  }

  whoopAI = await User.create({
    name: 'Whoop AI',
    isAI: true,
    email: "WhopAI@gmail.com",
    password : "WHOPAI!@#$%#",
    avatar:
      'https://res.cloudinary.com/dp9vvlndo/image/upload/v1759925671/ai_logo_qqman8.png', // Your AI avatar URL
  });

  console.log('✅ Whoop AI created:', whoopAI._id);
  return whoopAI;
};


const seedWhoopAI = async () => {
  try {
    await connectDB();
    await CreateWhoopAI();
    console.log('Seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedWhoopAI();
