import mongoose from "mongoose";

const diagnosisSessionSchema = new mongoose.Schema(
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
    sessionType: {
      type: String,
      default: "medical_diagnosis",
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "assessed", "completed"],
      default: "active",
    },
    phase: {
      type: String,
      enum: ["intake", "questioning", "assessing", "assessed", "follow_up"],
      default: "intake",
    },
    questionsAsked: {
      type: Number,
      default: 0,
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
        assessment: {
          possibleConditions: [String],
          primaryCondition: String,
          confidence: String,
          severity: String,
          urgency: String,
          shouldVisitDoctor: Boolean,
          visitTimeframe: String,
          reliefSuggestions: [String],
          warningSignsToWatch: [String],
          disclaimer: String,
        },
      },
    ],
    userLocation: {
      latitude: Number,
      longitude: Number,
      address: String,
      sharedAt: Date,
    },
  },
  { timestamps: true }
);

diagnosisSessionSchema.index({ userId: 1, updatedAt: -1 });
diagnosisSessionSchema.index({ sessionId: 1 });

const DiagnosisSession = mongoose.model(
  "DiagnosisSession",
  diagnosisSessionSchema
);

export default DiagnosisSession;
