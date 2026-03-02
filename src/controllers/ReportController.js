import Report from '../models/Report.js';
import { generateAITextWithImage } from '../config/GeminiSetup.js';

const EXTRACTION_PROMPT =
  'You are reading a medical document (discharge summary, lab report, prescription, health record, etc.).\n' +
  'Produce a clean, organized plain-text summary containing ALL important information.\n\n' +
  'Output format rules:\n' +
  '1. First line: "Document: [document type]"\n' +
  '2. Second line: "Facility: [hospital or clinic name and location, if present]"\n' +
  '3. Leave a blank line, then write the following sections in order (include only sections that exist in the document):\n\n' +
  '   PATIENT DETAILS\n' +
  '   List every patient field as "Label: Value" on its own line.\n' +
  '   For 4-column grids with two label-value pairs per row, put each pair on a separate line.\n\n' +
  '   DIAGNOSIS\n' +
  '   List each diagnosis on its own numbered line.\n\n' +
  '   SURGERY / PROCEDURES\n' +
  '   List each procedure as "Procedure Name | Date" on its own line.\n\n' +
  '   MEDICATIONS\n' +
  '   List each as "Medicine Name — Dose — Frequency — Duration".\n\n' +
  '   TEST RESULTS\n' +
  '   List each result as "Test: Result (Reference range if shown)".\n\n' +
  '   DOCTOR / CONSULTANT\n' +
  '   Names and specialties.\n\n' +
  '   FOLLOW-UP / INSTRUCTIONS\n' +
  '   Any post-discharge instructions, follow-up dates, or advice.\n\n' +
  '   OTHER NOTES\n' +
  '   Anything important that does not fit the above sections.\n\n' +
  '4. Section headings must be written in ALL CAPS on their own line with a blank line before them.\n' +
  '5. Preserve all dates, IDs, dosages, and medical terms exactly as written.\n' +
  '6. Ignore logos, decorative lines, watermarks, and repeated page headers.\n' +
  '7. Plain text only — no markdown, no asterisks, no hyphens as list bullets.';

// POST /reports/extract
// Extracts text from uploaded image/PDF using Gemini Vision and saves as a report
export const extractAndSaveReport = async (req, res) => {
  try {
    const { title, fileBase64, mimeType } = req.body;
    const userId = req.userId;

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    if (!fileBase64 || !mimeType) {
      return res.status(400).json({ success: false, message: 'File data and MIME type are required' });
    }

    const fileType = mimeType === 'application/pdf' ? 'pdf' : 'image';

    const extractedText = await generateAITextWithImage(EXTRACTION_PROMPT, fileBase64, mimeType);

    if (extractedText?.startsWith('Error:')) {
      return res.status(500).json({ success: false, message: extractedText });
    }

    const report = new Report({
      title: title.trim(),
      extractedText,
      fileType,
      mimeType,
      author: userId,
    });

    await report.save();
    await report.populate('author', 'name email avatar');

    res.status(201).json({ success: true, data: report });
  } catch (error) {
    console.error('Error extracting report:', error);
    res.status(500).json({ success: false, message: 'Error extracting report' });
  }
};

// GET /reports/user/my-reports
export const getMyReports = async (req, res) => {
  try {
    const userId = req.userId;
    const { search } = req.query;

    const filter = { author: userId };
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .populate('author', 'name email avatar');

    res.json({ success: true, data: reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ success: false, message: 'Error fetching reports' });
  }
};

// GET /reports/:id
export const getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const report = await Report.findById(id).populate('author', 'name email avatar');
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    if (report.author._id.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ success: false, message: 'Error fetching report' });
  }
};

// PUT /reports/:id
export const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, extractedText } = req.body;
    const userId = req.userId;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    if (report.author.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (title !== undefined) report.title = title.trim();
    if (extractedText !== undefined) report.extractedText = extractedText;

    await report.save();
    await report.populate('author', 'name email avatar');

    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ success: false, message: 'Error updating report' });
  }
};

// DELETE /reports/:id
export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    if (report.author.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await report.deleteOne();
    res.json({ success: true, message: 'Report deleted' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ success: false, message: 'Error deleting report' });
  }
};
