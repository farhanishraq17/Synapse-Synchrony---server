import express from 'express';
import { VerifyToken } from '../middlewares/VeriyToken.js';
import {
  extractAndSaveMedicineSchedule,
  getMyMedicineSchedules,
  getMedicineScheduleById,
  updateMedicineSchedule,
  deleteMedicineSchedule,
} from '../controllers/MedicineScheduleController.js';

const router = express.Router();

router.post('/extract', VerifyToken, extractAndSaveMedicineSchedule);
router.get('/my-schedules', VerifyToken, getMyMedicineSchedules);
router.get('/:id', VerifyToken, getMedicineScheduleById);
router.put('/:id', VerifyToken, updateMedicineSchedule);
router.delete('/:id', VerifyToken, deleteMedicineSchedule);

export default router;
