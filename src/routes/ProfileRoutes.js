import express from 'express';
import { GetUserProfile, UpdateUserProfile, RefineBioWithAI } from '../controllers/ProfileController.js';
import { VerifyToken } from '../middlewares/VeriyToken.js';

const router = express.Router();

// All routes are protected with VerifyToken middleware
router.get('/', VerifyToken, GetUserProfile);
router.put('/', VerifyToken, UpdateUserProfile);
router.post('/ai/refine-bio', VerifyToken, RefineBioWithAI);

export default router;
