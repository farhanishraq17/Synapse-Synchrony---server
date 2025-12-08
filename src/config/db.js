// src/config/db.js

import mongoose from 'mongoose';

export const connectDB = async (req, res) => {
  try {
    await mongoose.connect(process.env.Mongo_URI);
    console.log('MONGODB CONNECTED SUCCESSFULLY ✅');
  } catch (error) {
    console.log('ERROR CONNECTING TO MONGODB', error);
    process.exit(1); // Exit with failure
  }
};
