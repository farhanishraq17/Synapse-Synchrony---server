// controllers/ScheduleController.js
import Schedule from '../models/Schedule.js';
import { HttpResponse } from '../utils/HttpResponse.js';
import { generateAITextWithImage } from '../config/GeminiSetup.js';

// Extract schedule from image using Gemini Vision
export const ExtractScheduleFromImage = async (req, res) => {
  const userId = req.userId;
  const { imageBase64, mimeType } = req.body;

  try {
    if (!imageBase64) {
      return HttpResponse(res, 400, true, 'Image data is required');
    }

    const validMimeType = mimeType || 'image/jpeg';
    
    const prompt = `You are analyzing a class schedule/timetable image. 

Extract ALL information and return ONLY valid JSON (no markdown, no extra text, no code blocks) in this exact structure:

{
  "title": "extracted title or course info",
  "semester": "extracted semester if visible",
  "section": "extracted section if visible",
  "days": [
    {
      "day": "Monday",
      "slots": [
        {
          "slotNumber": 1,
          "timeRange": "8:00 - 9:15",
          "course": "CSE 4511",
          "courseTitle": "course title if visible",
          "room": "R-302",
          "teacher": "AA",
          "teacherName": "full name if in legend",
          "type": "lecture"
        }
      ]
    }
  ]
}

Rules:
- Extract day names as full words (Monday, Tuesday, etc.)
- Capture exact time ranges from the schedule
- Include course codes, rooms, and teacher codes/initials
- If a slot is lunch/break, set type: "break"
- If no data for a field, omit it or set to empty string
- Be thorough and accurate
- Return ONLY the JSON object, no markdown formatting, no backticks, no extra text`;

    const extractedText = await generateAITextWithImage(
      prompt,
      imageBase64,
      validMimeType
    );

    if (extractedText.startsWith('Error:')) {
      return HttpResponse(res, 500, true, 'Schedule extraction failed', { error: extractedText });
    }

    // Clean the response - remove markdown code blocks if present
    let cleanedText = extractedText.trim();
    cleanedText = cleanedText.replace(/```json\n?/g, '');
    cleanedText = cleanedText.replace(/```\n?/g, '');
    cleanedText = cleanedText.trim();

    // Parse JSON
    let scheduleData;
    try {
      scheduleData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw response:', extractedText);
      return HttpResponse(res, 500, true, 'Failed to parse extracted schedule data', { 
        error: parseError.message,
        rawResponse: extractedText.substring(0, 500) // First 500 chars for debugging
      });
    }

    // Validate and format the schedule data
    if (!scheduleData.days || !Array.isArray(scheduleData.days)) {
      return HttpResponse(res, 400, true, 'Invalid schedule format: missing days array');
    }

    // Transform to match our schema
    const weeklySchedule = scheduleData.days.map(day => ({
      day: day.day,
      slots: day.slots.map(slot => ({
        slotNumber: slot.slotNumber || 0,
        timeRange: slot.timeRange || '',
        course: slot.course || '',
        courseTitle: slot.courseTitle || '',
        room: slot.room || '',
        teacher: slot.teacher || '',
        teacherName: slot.teacherName || '',
        type: slot.type || 'lecture'
      }))
    }));

    // Deactivate any existing active schedules for this user
    await Schedule.updateMany(
      { user: userId, isActive: true },
      { isActive: false }
    );

    // Create new schedule
    const newSchedule = await Schedule.create({
      user: userId,
      title: scheduleData.title || 'My Schedule',
      semester: scheduleData.semester || '',
      section: scheduleData.section || '',
      weeklySchedule,
      extractedFrom: 'image',
      isActive: true,
    });

    await newSchedule.populate('user', 'name email avatar');

    return HttpResponse(res, 201, false, 'Schedule extracted and saved successfully', newSchedule);
  } catch (error) {
    console.error('Error in ExtractScheduleFromImage:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};

// Get user's active schedule
export const GetMySchedule = async (req, res) => {
  const userId = req.userId;

  try {
    const schedule = await Schedule.findOne({ user: userId, isActive: true })
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 });

    if (!schedule) {
      return HttpResponse(res, 404, true, 'No active schedule found');
    }

    return HttpResponse(res, 200, false, 'Schedule fetched successfully', schedule);
  } catch (error) {
    console.error('Error in GetMySchedule:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};

// Get schedule by ID
export const GetScheduleById = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const schedule = await Schedule.findById(id).populate('user', 'name email avatar');

    if (!schedule) {
      return HttpResponse(res, 404, true, 'Schedule not found');
    }

    if (schedule.user._id.toString() !== userId) {
      return HttpResponse(res, 403, true, 'You do not have access to this schedule');
    }

    return HttpResponse(res, 200, false, 'Schedule fetched successfully', schedule);
  } catch (error) {
    console.error('Error in GetScheduleById:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};

// Update schedule
export const UpdateSchedule = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  const { title, semester, section, weeklySchedule } = req.body;

  try {
    const schedule = await Schedule.findById(id);

    if (!schedule) {
      return HttpResponse(res, 404, true, 'Schedule not found');
    }

    if (schedule.user.toString() !== userId) {
      return HttpResponse(res, 403, true, 'You are not authorized to edit this schedule');
    }

    if (title !== undefined) schedule.title = title;
    if (semester !== undefined) schedule.semester = semester;
    if (section !== undefined) schedule.section = section;
    if (weeklySchedule !== undefined) schedule.weeklySchedule = weeklySchedule;

    await schedule.save();
    await schedule.populate('user', 'name email avatar');

    return HttpResponse(res, 200, false, 'Schedule updated successfully', schedule);
  } catch (error) {
    console.error('Error in UpdateSchedule:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};

// Delete schedule (soft delete)
export const DeleteSchedule = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const schedule = await Schedule.findById(id);

    if (!schedule) {
      return HttpResponse(res, 404, true, 'Schedule not found');
    }

    if (schedule.user.toString() !== userId) {
      return HttpResponse(res, 403, true, 'You are not authorized to delete this schedule');
    }

    schedule.isActive = false;
    await schedule.save();

    return HttpResponse(res, 200, false, 'Schedule deleted successfully');
  } catch (error) {
    console.error('Error in DeleteSchedule:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};
