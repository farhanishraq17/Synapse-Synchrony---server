import mongoose from "mongoose";

const activityRecSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    type: {
      type: String,
      enum: ["mindfulness", "exercise", "journaling", "social", "other"],
      default: "other",
    },
    durationMinutes: Number,
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    generatedReason: String, // Why AI recommended this
  },
  { timestamps: true }
);

const ActivityRec = mongoose.model("ActivityRec", activityRecSchema);

export default ActivityRec;
