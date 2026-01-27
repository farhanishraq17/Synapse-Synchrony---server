import mongoose from "mongoose";

const wellnessSuggestionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sessionId: {
      type: String,
      ref: "MedilinkSession",
      required: true,
    },
    suggestions: [String], // Array of suggestion strings
    reasoning: String, // Why these suggestions were generated
    triggeredBy: {
      type: String,
      enum: ["low_mood", "high_stress", "high_risk", "both"],
      required: true,
    },
    moodAtTime: {
      mood: String,
      intensity: Number,
    },
    stressAtTime: {
      level: Number,
      stressors: [String],
    },
    urgency: {
      type: String,
      enum: ["low", "moderate", "high", "critical"],
      default: "moderate",
    },
    isViewed: {
      type: Boolean,
      default: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
wellnessSuggestionSchema.index({ userId: 1, timestamp: -1 });
wellnessSuggestionSchema.index({ sessionId: 1, timestamp: -1 });
wellnessSuggestionSchema.index({ urgency: 1, isViewed: 1 });

const WellnessSuggestion = mongoose.model(
  "WellnessSuggestion",
  wellnessSuggestionSchema
);

export default WellnessSuggestion;
