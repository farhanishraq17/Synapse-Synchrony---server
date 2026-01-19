// routes/EventRoutes.js
import express from 'express';
import { VerifyToken } from '../middlewares/VeriyToken.js';
import {
  CreateEvent,
  GetAllEvents,
  GetSingleEvent,
  UpdateEvent,
  DeleteEvent,
  RegisterForEvent,
  UnregisterFromEvent,
  GetUpcomingEvents,
  GetMyRegisteredEvents,
  GetMyCreatedEvents,
} from '../controllers/EventController.js';

const router = express.Router();

// Public routes (anyone can view events)
router.get('/', GetAllEvents);
router.get('/upcoming', GetUpcomingEvents);
router.get('/:id', GetSingleEvent);

// Protected routes (require authentication)
router.post('/', VerifyToken, CreateEvent);
router.put('/:id', VerifyToken, UpdateEvent);
router.delete('/:id', VerifyToken, DeleteEvent);
router.post('/:id/register', VerifyToken, RegisterForEvent);
router.delete('/:id/register', VerifyToken, UnregisterFromEvent);
router.get('/user/registered', VerifyToken, GetMyRegisteredEvents);
router.get('/user/created', VerifyToken, GetMyCreatedEvents);

export default router;
