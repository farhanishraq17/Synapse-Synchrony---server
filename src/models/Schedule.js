// models/Schedule.js
import mongoose from 'mongoose';

const SlotSchema = new mongoose.Schema({
  slotNumber: { 
    type: Number, 
    required: true 
  },
  timeRange: { 
    type: String 
  },
  course: { 
    type: String 
  },
  courseTitle: { 
    type: String 
  },
  room: { 
    type: String 
  },
  teacher: { 
    type: String 
  },
  teacherName: { 
    type: String 
  },
  type: { 
    type: String, 
    enum: ['lecture', 'lab', 'break', 'exam'], 
    default: 'lecture' 
  }
});

const DayScheduleSchema = new mongoose.Schema({
  day: { 
    type: String, 
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], 
    required: true 
  },
  slots: [SlotSchema]
});

const ScheduleSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  title: { 
    type: String, 
    default: 'My Schedule' 
  },
  semester: { 
    type: String 
  },
  section: { 
    type: String 
  },
  weeklySchedule: [DayScheduleSchema],
  extractedFrom: { 
    type: String, 
    enum: ['image', 'manual'], 
    default: 'image' 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
}, { timestamps: true });

// Index for faster queries
ScheduleSchema.index({ user: 1, isActive: 1 });

export default mongoose.model('Schedule', ScheduleSchema);
