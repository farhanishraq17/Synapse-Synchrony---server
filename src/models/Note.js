// models/Note.js
import mongoose, { Schema } from 'mongoose';

const NoteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'private',
    },
  },
  {
    timestamps: true,
  }
);

NoteSchema.index({ author: 1, createdAt: -1 });
NoteSchema.index({ visibility: 1 });

const Note = mongoose.model('Note', NoteSchema, 'notes');
export default Note;
