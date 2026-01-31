import express from "express";
import {
  createDiagnosisSession,
  submitSymptoms,
  getDiagnosisHistory,
  getAllDiagnosisSessions,
  getUserMedications,
  updateMedicationStatus,
  addMedicationNote,
  getMedicationDetails,
} from "../controllers/DiagnosisController.js";
import { VerifyToken } from "../middlewares/VeriyToken.js";

const router = express.Router();

// Diagnosis session management
router.post("/session", VerifyToken, createDiagnosisSession);
router.post("/session/:sessionId/message", VerifyToken, submitSymptoms);
router.get("/session/:sessionId/history", VerifyToken, getDiagnosisHistory);
router.get("/sessions", VerifyToken, getAllDiagnosisSessions);

// Medication management
router.get("/medications", VerifyToken, getUserMedications);
router.patch("/medications/:id/status", VerifyToken, updateMedicationStatus);
router.post("/medications/:id/note", VerifyToken, addMedicationNote);
router.get("/medication-info", VerifyToken, getMedicationDetails);

export default router;
