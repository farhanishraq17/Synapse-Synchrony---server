import express from 'express';
import { HttpResponse } from '../utils/HttpResponse.js';
import { login, logout, signup } from '../controllers/authController.js';

const router = express.Router();

router.get('/signup', signup);
router.get('/login', login);
router.get('/logout', logout);

export default router;
