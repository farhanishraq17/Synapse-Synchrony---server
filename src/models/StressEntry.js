import mongoose from "mongoose";

const stressEntrySchema = new mongoose.Schema(
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
    stressLevel: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    stressors: [String], // e.g., ["exams", "relationships", "sleep"]
    physiologicalSigns: [String], // e.g., ["fatigue", "headache"]
    emotionalSigns: [String], // e.g., ["irritability", "worry"]
    behavioralSigns: [String], // e.g., ["procrastination", "avoidance"]
    context: String, // Brief context from the conversation
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
stressEntrySchema.index({ userId: 1, timestamp: -1 });
stressEntrySchema.index({ sessionId: 1, timestamp: -1 });

const StressEntry = mongoose.model("StressEntry", stressEntrySchema);

export default StressEntry;
