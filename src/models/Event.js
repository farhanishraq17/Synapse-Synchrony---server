// models/Event.js
import mongoose, { Schema } from 'mongoose';

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    eventType: {
      type: String,
      enum: ['workshop', 'seminar', 'extracurricular', 'academic', 'social'],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    organizer: {
      name: {
        type: String,
        required: true,
      },
      contact: {
        type: String,
      },
    },
    image: {
      type: String, // Cloudinary URL
      default: null,
    },
    capacity: {
      type: Number,
      default: null, // null means unlimited
    },
    registeredUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
EventSchema.index({ startDate: 1, status: 1 });
EventSchema.index({ eventType: 1 });
EventSchema.index({ tags: 1 });

// Virtual for checking if event is full
EventSchema.virtual('isFull').get(function () {
  if (this.capacity === null) return false;
  return this.registeredUsers.length >= this.capacity;
});

// Virtual for registered count
EventSchema.virtual('registeredCount').get(function () {
  return this.registeredUsers.length;
});

// Ensure virtuals are included in JSON
EventSchema.set('toJSON', { virtuals: true });
EventSchema.set('toObject', { virtuals: true });

const Event = mongoose.model('Event', EventSchema, 'events');
export default Event;
