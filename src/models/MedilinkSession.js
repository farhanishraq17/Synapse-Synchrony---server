import mongoose from "mongoose";

const medilinkSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "completed", "archived"],
      default: "active",
    },
    messages: [
      {
        role: {
          type: String,
          enum: ["user", "assistant", "system"],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        metadata: {
          analysis: {
            emotionalState: String,
            riskLevel: Number,
            themes: [String],
          },
        },
      },
    ],
    // Context memory for the AI
    memory: {
      userProfile: {
        emotionalState: [String],
        riskLevel: { type: Number, default: 0 },
        preferences: mongoose.Schema.Types.Mixed,
      },
      sessionContext: {
        conversationThemes: [String],
        currentTechnique: String,
      },
    },
  },
  { timestamps: true }
);

const MedilinkSession = mongoose.model("MedilinkSession", medilinkSessionSchema);

export default MedilinkSession;
