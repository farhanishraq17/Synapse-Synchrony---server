import express from "express";
import {
  createDiagnosisSession,
  sendMessage,
  getSessionHistory,
  getAllDiagnosisSessions,
  saveUserLocation,
  getNearbyFacilities,
} from "../controllers/DiagnosisController.js";
import { VerifyToken } from "../middlewares/VeriyToken.js";

const router = express.Router();

// Timeout middleware for slow external API calls
const setLongTimeout = (req, res, next) => {
  req.setTimeout(60000); // 60 seconds
  res.setTimeout(60000);
  next();
};

// Session management
router.post("/session", VerifyToken, createDiagnosisSession);
router.post("/session/:sessionId/message", VerifyToken, sendMessage);
router.get("/session/:sessionId/history", VerifyToken, getSessionHistory);
router.get("/sessions", VerifyToken, getAllDiagnosisSessions);

// Location & nearby facilities (with extended timeout)
router.post("/session/:sessionId/location", VerifyToken, saveUserLocation);
router.get("/nearby-facilities", VerifyToken, setLongTimeout, getNearbyFacilities);

export default router;
