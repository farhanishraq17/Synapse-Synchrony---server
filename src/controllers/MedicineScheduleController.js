import MedicineSchedule from '../models/MedicineSchedule.js';
import { generateAITextWithImage } from '../config/GeminiSetup.js';

const EXTRACTION_PROMPT =
  'You are reading a medical prescription or case sheet. Extract the prescription data and return ONLY a valid JSON object — no explanation, no markdown fences, no extra text.\n\n' +
  'JSON structure to return:\n' +
  '{\n' +
  '  "hospital": "hospital or clinic name and city",\n' +
  '  "doctor": "doctor name and qualification",\n' +
  '  "date": "date of prescription",\n' +
  '  "diagnosis": "diagnosis or chief complaint",\n' +
  '  "medicines": [\n' +
  '    {\n' +
  '      "name": "medicine name exactly as written",\n' +
  '      "dosage": "dosage instruction (e.g. 0-0-1 After Food, SOS After Food)",\n' +
  '      "duration": "duration (e.g. 3 Days, Tot: 3 TAB)",\n' +
  '      "notes": "any extra notes for this medicine, or empty string"\n' +
  '    }\n' +
  '  ]\n' +
  '}\n\n' +
  'If a field is not present in the document, use an empty string. ' +
  'The "medicines" array must always be present; if no medicines found, use an empty array.';

// POST /medicine-schedule/extract
export const extractAndSaveMedicineSchedule = async (req, res) => {
  try {
    const { title, fileBase64, mimeType } = req.body;
    const userId = req.userId;

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    if (!fileBase64 || !mimeType) {
      return res.status(400).json({ success: false, message: 'File data and MIME type are required' });
    }

    const rawText = await generateAITextWithImage(EXTRACTION_PROMPT, fileBase64, mimeType);

    if (rawText?.startsWith('Error:')) {
      return res.status(500).json({ success: false, message: rawText });
    }

    // Strip markdown fences if Gemini wraps in ```json ... ```
    const cleaned = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(422).json({
        success: false,
        message: 'Could not parse prescription data from document. Please try a clearer image.',
      });
    }

    if (!Array.isArray(parsed.medicines)) {
      parsed.medicines = [];
    }

    const schedule = new MedicineSchedule({
      title: title.trim(),
      hospital: parsed.hospital || '',
      doctor: parsed.doctor || '',
      date: parsed.date || '',
      diagnosis: parsed.diagnosis || '',
      medicines: parsed.medicines,
      author: userId,
    });

    await schedule.save();
    await schedule.populate('author', 'name email avatar');

    res.status(201).json({ success: true, data: schedule });
  } catch (error) {
    console.error('Error extracting medicine schedule:', error);
    res.status(500).json({ success: false, message: 'Error extracting medicine schedule' });
  }
};

// GET /medicine-schedule/my-schedules
export const getMyMedicineSchedules = async (req, res) => {
  try {
    const userId = req.userId;
    const { search } = req.query;

    const filter = { author: userId };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { diagnosis: { $regex: search, $options: 'i' } },
      ];
    }

    const schedules = await MedicineSchedule.find(filter)
      .sort({ createdAt: -1 })
      .populate('author', 'name email avatar');

    res.json({ success: true, data: schedules });
  } catch (error) {
    console.error('Error fetching medicine schedules:', error);
    res.status(500).json({ success: false, message: 'Error fetching medicine schedules' });
  }
};

// GET /medicine-schedule/:id
export const getMedicineScheduleById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const schedule = await MedicineSchedule.findById(id).populate('author', 'name email avatar');
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }
    if (schedule.author._id.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.json({ success: true, data: schedule });
  } catch (error) {
    console.error('Error fetching medicine schedule:', error);
    res.status(500).json({ success: false, message: 'Error fetching medicine schedule' });
  }
};

// PUT /medicine-schedule/:id
export const updateMedicineSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, hospital, doctor, date, diagnosis, medicines } = req.body;
    const userId = req.userId;

    const schedule = await MedicineSchedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }
    if (schedule.author.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (title !== undefined) schedule.title = title.trim();
    if (hospital !== undefined) schedule.hospital = hospital;
    if (doctor !== undefined) schedule.doctor = doctor;
    if (date !== undefined) schedule.date = date;
    if (diagnosis !== undefined) schedule.diagnosis = diagnosis;
    if (medicines !== undefined) schedule.medicines = medicines;

    await schedule.save();
    await schedule.populate('author', 'name email avatar');

    res.json({ success: true, data: schedule });
  } catch (error) {
    console.error('Error updating medicine schedule:', error);
    res.status(500).json({ success: false, message: 'Error updating medicine schedule' });
  }
};

// DELETE /medicine-schedule/:id
export const deleteMedicineSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const schedule = await MedicineSchedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }
    if (schedule.author.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await schedule.deleteOne();
    res.json({ success: true, message: 'Prescription deleted' });
  } catch (error) {
    console.error('Error deleting medicine schedule:', error);
    res.status(500).json({ success: false, message: 'Error deleting medicine schedule' });
  }
};
