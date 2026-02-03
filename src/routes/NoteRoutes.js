// routes/NoteRoutes.js
import express from 'express';
import { VerifyToken } from '../middlewares/VeriyToken.js';
import {
  CreateNote,
  GetMyNotes,
  GetNoteById,
  UpdateNote,
  DeleteNote,
  GenerateNoteWithAI,
  ExtractTextFromImage,
} from '../controllers/NoteController.js';

const router = express.Router();

router.post('/', VerifyToken, CreateNote);
router.get('/user/my-notes', VerifyToken, GetMyNotes);
router.get('/:id', VerifyToken, GetNoteById);
router.put('/:id', VerifyToken, UpdateNote);
router.delete('/:id', VerifyToken, DeleteNote);
router.post('/ai/generate', VerifyToken, GenerateNoteWithAI);
router.post('/ocr/extract', VerifyToken, ExtractTextFromImage);

export default router;
