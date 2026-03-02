import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String },
  duration: { type: String },
  notes: { type: String },
});

const medicineScheduleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    hospital: { type: String },
    doctor: { type: String },
    date: { type: String },
    diagnosis: { type: String },
    medicines: [medicineSchema],
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

medicineScheduleSchema.index({ author: 1, createdAt: -1 });

const MedicineSchedule = mongoose.model('MedicineSchedule', medicineScheduleSchema);
export default MedicineSchedule;
