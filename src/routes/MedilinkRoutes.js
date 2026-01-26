import express from "express";
import { createSession, sendMessage, getSessionHistory } from "../controllers/MedilinkController.js";
import { VerifyToken } from "../middlewares/VeriyToken.js"; 

const router = express.Router();

router.post("/session", VerifyToken, createSession);
router.post("/session/:sessionId/message", VerifyToken, sendMessage);
router.get("/session/:sessionId/history", VerifyToken, getSessionHistory);

export default router;
