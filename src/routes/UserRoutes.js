import express from 'express';
import { HttpResponse } from '../utils/HttpResponse.js';
import { GetAllUsers } from '../controllers/UserController.js';
import { VerifyToken } from '../middlewares/VeriyToken.js';


const router = express.Router();

router.get('/get-users', VerifyToken, GetAllUsers);


export default router;
