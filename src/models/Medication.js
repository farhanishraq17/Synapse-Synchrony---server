/**
 * @deprecated This model is no longer used as of the diagnosis system overhaul.
 * The AI no longer prescribes medications. Kept for backward compatibility
 * with existing database records. Do not use in new code.
 */
import mongoose from "mongoose";

const medicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sessionId: {
      type: String,
    },
    diagnosisSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiagnosisSession",
    },
    medicationName: {
      type: String,
      required: true,
    },
    brandName: {
      type: String,
    },
    genericName: {
      type: String,
    },
    manufacturer: {
      type: String,
    },
    purpose: {
      type: String,
    },
    dosage: {
      type: String,
    },
    frequency: {
      type: String,
    },
    duration: {
      type: String,
    },
    prescribedFor: {
      type: String, // Symptom/condition it was recommended for
    },
    sideEffects: [String],
    precautions: [String],
    status: {
      type: String,
      enum: ["suggested", "taken", "discontinued"],
      default: "suggested",
    },
    notes: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Medication = mongoose.model("Medication", medicationSchema);

export default Medication;
