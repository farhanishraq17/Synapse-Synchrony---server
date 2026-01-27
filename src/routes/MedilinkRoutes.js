import express from "express";
import { 
  createSession, 
  sendMessage, 
  getSessionHistory, 
  getAllSessions,
  getMoodHistory,
  getStressHistory,
  getWellnessSuggestions,
  markSuggestionViewed,
  getWellnessSummary,
} from "../controllers/MedilinkController.js";
import { VerifyToken } from "../middlewares/VeriyToken.js"; 

const router = express.Router();

// Session management
router.post("/session", VerifyToken, createSession);
router.post("/session/:sessionId/message", VerifyToken, sendMessage);
router.get("/session/:sessionId/history", VerifyToken, getSessionHistory);
router.get("/sessions", VerifyToken, getAllSessions);

// Mood tracking
router.get("/mood-history", VerifyToken, getMoodHistory);

// Stress tracking
router.get("/stress-history", VerifyToken, getStressHistory);

// Wellness suggestions
router.get("/suggestions", VerifyToken, getWellnessSuggestions);
router.patch("/suggestions/:suggestionId/view", VerifyToken, markSuggestionViewed);

// Wellness summary (combined mood + stress)
router.get("/wellness-summary", VerifyToken, getWellnessSummary);

export default router;
