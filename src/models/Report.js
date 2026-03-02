import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    extractedText: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ['image', 'pdf'],
    },
    mimeType: {
      type: String,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

reportSchema.index({ author: 1, createdAt: -1 });

const Report = mongoose.model('Report', reportSchema);
export default Report;
