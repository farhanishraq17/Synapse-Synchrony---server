// routes/ScheduleRoutes.js
import express from 'express';
import { VerifyToken } from '../middlewares/VeriyToken.js';
import {
  ExtractScheduleFromImage,
  GetMySchedule,
  GetScheduleById,
  UpdateSchedule,
  DeleteSchedule,
} from '../controllers/ScheduleController.js';

const router = express.Router();

router.post('/extract', VerifyToken, ExtractScheduleFromImage);
router.get('/my-schedule', VerifyToken, GetMySchedule);
router.get('/:id', VerifyToken, GetScheduleById);
router.put('/:id', VerifyToken, UpdateSchedule);
router.delete('/:id', VerifyToken, DeleteSchedule);

export default router;
