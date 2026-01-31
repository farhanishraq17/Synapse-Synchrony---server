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
        diagnosis: {
          possibleDiseases: [String],
          primaryDiagnosis: String,
          confidence: String,
          severity: String,
          urgency: String,
          needsDoctorImmediately: Boolean,
          recommendations: [String],
          medications: [String],
          warning: String,
          whenToSeekHelp: [String],
          disclaimer: String,
        },
      },
    ],
  },
  { timestamps: true }
);

const DiagnosisSession = mongoose.model("DiagnosisSession", diagnosisSessionSchema);

export default DiagnosisSession;
