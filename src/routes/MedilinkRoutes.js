import express from "express";
import { createSession, sendMessage, getSessionHistory, getAllSessions } from "../controllers/MedilinkController.js";
import { VerifyToken } from "../middlewares/VeriyToken.js"; 

const router = express.Router();

router.post("/session", VerifyToken, createSession);
router.post("/session/:sessionId/message", VerifyToken, sendMessage);
router.get("/session/:sessionId/history", VerifyToken, getSessionHistory);
router.get("/sessions", VerifyToken, getAllSessions);

export default router;
