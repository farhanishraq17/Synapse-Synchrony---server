import mongoose from "mongoose";

const moodEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    moodRating: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    emotions: [String], // e.g., "Anxious", "Happy"
    notes: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
    // Optional link to a session if this mood was recorded during one
    sessionId: {
      type: String,
      ref: "MedilinkSession",
    },
  },
  { timestamps: true }
);

const MoodEntry = mongoose.model("MoodEntry", moodEntrySchema);

export default MoodEntry;
