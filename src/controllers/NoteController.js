// controllers/NoteController.js
import Note from '../models/Note.js';
import { HttpResponse } from '../utils/HttpResponse.js';
import { generateAIText } from '../config/GroqSetup.js';
import { generateAITextWithImage } from '../config/GeminiSetup.js';

// Create Note
export const CreateNote = async (req, res) => {
  const userId = req.userId;
  const { title, content, visibility } = req.body;

  try {
    if (!title || content === undefined) {
      return HttpResponse(res, 400, true, 'Title and content are required');
    }

    const validVisibility = ['public', 'private'].includes(visibility)
      ? visibility
      : 'private';

    const newNote = await Note.create({
      title: title.trim(),
      content: content || '',
      author: userId,
      visibility: validVisibility,
    });

    await newNote.populate('author', 'name email avatar');

    return HttpResponse(res, 201, false, 'Note created successfully', newNote);
  } catch (error) {
    console.error('Error in CreateNote:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};

// Get My Notes
export const GetMyNotes = async (req, res) => {
  const userId = req.userId;
  const { visibility, search } = req.query;

  try {
    const filter = { author: userId };

    if (visibility && ['public', 'private'].includes(visibility)) {
      filter.visibility = visibility;
    }

    if (search && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { content: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const notes = await Note.find(filter)
      .populate('author', 'name email avatar')
      .sort({ createdAt: -1 });

    return HttpResponse(res, 200, false, 'Notes fetched successfully', notes);
  } catch (error) {
    console.error('Error in GetMyNotes:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};

// Get Note By Id
export const GetNoteById = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const note = await Note.findById(id).populate('author', 'name email avatar');

    if (!note) {
      return HttpResponse(res, 404, true, 'Note not found');
    }

    if (note.visibility === 'private' && note.author._id.toString() !== userId) {
      return HttpResponse(res, 403, true, 'You do not have access to this note');
    }

    return HttpResponse(res, 200, false, 'Note fetched successfully', note);
  } catch (error) {
    console.error('Error in GetNoteById:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};

// Update Note
export const UpdateNote = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  const { title, content, visibility } = req.body;

  try {
    const note = await Note.findById(id);

    if (!note) {
      return HttpResponse(res, 404, true, 'Note not found');
    }

    if (note.author.toString() !== userId) {
      return HttpResponse(res, 403, true, 'You are not authorized to edit this note');
    }

    if (title !== undefined) note.title = title.trim();
    if (content !== undefined) note.content = content;
    if (visibility !== undefined && ['public', 'private'].includes(visibility)) {
      note.visibility = visibility;
    }

    await note.save();
    await note.populate('author', 'name email avatar');

    return HttpResponse(res, 200, false, 'Note updated successfully', note);
  } catch (error) {
    console.error('Error in UpdateNote:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};

// Delete Note
export const DeleteNote = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const note = await Note.findById(id);

    if (!note) {
      return HttpResponse(res, 404, true, 'Note not found');
    }

    if (note.author.toString() !== userId) {
      return HttpResponse(res, 403, true, 'You are not authorized to delete this note');
    }

    await Note.findByIdAndDelete(id);

    return HttpResponse(res, 200, false, 'Note deleted successfully');
  } catch (error) {
    console.error('Error in DeleteNote:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};

// Generate Note Content With AI (plain text only)
export const GenerateNoteWithAI = async (req, res) => {
  const { title, additionalContext } = req.body;

  try {
    if (!title || !title.trim()) {
      return HttpResponse(res, 400, true, 'Title is required');
    }

    let prompt = `Generate note content for the following title. Write in clear, informative paragraphs. Output plain text only: do not use markdown (no #, *, -, 1. or bullet syntax). Use only line breaks between paragraphs.

Title: ${title.trim()}`;

    if (additionalContext && additionalContext.trim()) {
      prompt += `\n\nAdditional context: ${additionalContext.trim()}`;
    }

    const text = await generateAIText(prompt);

    if (!text || text.startsWith('Error:')) {
      return HttpResponse(res, 500, true, text || 'AI generation failed');
    }

    return HttpResponse(res, 200, false, 'Content generated', {
      content: text.trim(),
    });
  } catch (error) {
    console.error('Error in GenerateNoteWithAI:', error);
    return HttpResponse(res, 500, true, 'Failed to generate note with AI', error.message);
  }
};

// Extract text from image using Gemini Vision
export const ExtractTextFromImage = async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return HttpResponse(res, 400, true, 'Image data is required');
    }

    const validMimeType = mimeType || 'image/jpeg';
    
    const prompt = `Extract ALL text from this image. If it contains handwritten text, transcribe it accurately. If it contains printed text, extract it exactly as shown. Return ONLY the extracted text with no additional commentary. Preserve line breaks and formatting where appropriate.`;

    const extractedText = await generateAITextWithImage(
      prompt,
      imageBase64,
      validMimeType
    );

    if (extractedText.startsWith('Error:')) {
      return HttpResponse(res, 500, true, 'OCR failed', { error: extractedText });
    }

    return HttpResponse(res, 200, false, 'Text extracted successfully', {
      text: extractedText.trim(),
    });
  } catch (error) {
    console.error('Error in ExtractTextFromImage:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};
