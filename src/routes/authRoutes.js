import express from 'express';
import { HttpResponse } from '../utils/HttpResponse.js';
import { login, logout, signup, VerifyEmail } from '../controllers/authController.js';


const router = express.Router();

router.post('/signup', signup);
router.get('/login', login);
router.get('/logout', logout);
router.post('/verify-email', VerifyEmail);
export default router;
