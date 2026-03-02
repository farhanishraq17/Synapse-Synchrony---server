import express from 'express';
import { VerifyToken } from '../middlewares/VeriyToken.js';
import {
  extractAndSaveReport,
  getMyReports,
  getReportById,
  updateReport,
  deleteReport,
} from '../controllers/ReportController.js';

const router = express.Router();

router.post('/extract', VerifyToken, extractAndSaveReport);
router.get('/user/my-reports', VerifyToken, getMyReports);
router.get('/:id', VerifyToken, getReportById);
router.put('/:id', VerifyToken, updateReport);
router.delete('/:id', VerifyToken, deleteReport);

export default router;
