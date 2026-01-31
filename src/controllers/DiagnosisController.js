import DiagnosisSession from "../models/DiagnosisSession.js";
import Medication from "../models/Medication.js";
import { v4 as uuidv4 } from "uuid";
import { diagnoseMedical, getMedicationInfo } from "../config/MedicalAI.js";
import { HttpResponse } from "../utils/HttpResponse.js";

// Create a new diagnosis session
export const createDiagnosisSession = async (req, res) => {
  try {
    const userId = req.userId;
    const sessionId = uuidv4();

    const session = new DiagnosisSession({
      userId,
      sessionId,
      sessionType: "medical_diagnosis",
      messages: [],
    });

    await session.save();

    res.status(201).json({
      success: true,
      message: "Diagnosis session created successfully",
      sessionId: session.sessionId,
    });
  } catch (error) {
    console.error("Error creating diagnosis session:", error);
    res.status(500).json({
      success: false,
      message: "Error creating diagnosis session",
    });
  }
};

// Submit symptoms and get diagnosis
export const submitSymptoms = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { symptoms } = req.body;
    const userId = req.userId;

    if (!symptoms || !symptoms.trim()) {
      return res.status(400).json({
        success: false,
        message: "Symptoms description is required",
      });
    }

    // Find the session
    const session = await DiagnosisSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    // Verify user owns this session
    if (session.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to this session",
      });
    }

    // Add user message to session
    session.messages.push({
      role: "user",
      content: symptoms,
      timestamp: new Date(),
    });

    // Get AI diagnosis
    console.log("🔍 Analyzing symptoms with Medical AI...");
    const diagnosis = await diagnoseMedical(symptoms);

    // Save medications to Medication collection
    if (diagnosis.medications && diagnosis.medications.length > 0) {
      const medicationsToSave = diagnosis.medications.map((med) => {
        // Parse medication string (e.g., "Napa 500mg" or "Ace Plus")
        const medName = med.split("-")[0].trim(); // Get first part before any dash
        
        return {
          userId,
          sessionId,
          diagnosisSessionId: session._id,
          medicationName: med,
          brandName: medName,
          purpose: diagnosis.primaryDiagnosis,
          prescribedFor: symptoms.substring(0, 200),
          status: "suggested",
          timestamp: new Date(),
        };
      });

      await Medication.insertMany(medicationsToSave);
    }

    // Add AI response with diagnosis to session
    session.messages.push({
      role: "assistant",
      content: `Based on your symptoms, here's my medical assessment:

**Primary Diagnosis:** ${diagnosis.primaryDiagnosis}
**Confidence:** ${diagnosis.confidence}
**Severity:** ${diagnosis.severity}
**Urgency:** ${diagnosis.urgency}

${diagnosis.needsDoctorImmediately ? "⚠️ **URGENT:** You should seek immediate medical attention!" : ""}

**Possible Conditions:**
${diagnosis.possibleDiseases.map((d, i) => `${i + 1}. ${d}`).join("\n")}

**Recommended Medications (Bangladesh-available):**
${diagnosis.medications.map((m, i) => `${i + 1}. ${m}`).join("\n")}

**Self-Care Recommendations:**
${diagnosis.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}

**Warning Signs - Seek Help If:**
${diagnosis.whenToSeekHelp.map((w, i) => `${i + 1}. ${w}`).join("\n")}

⚠️ **Important:** ${diagnosis.warning}

${diagnosis.disclaimer}`,
      timestamp: new Date(),
      diagnosis: {
        possibleDiseases: diagnosis.possibleDiseases,
        primaryDiagnosis: diagnosis.primaryDiagnosis,
        confidence: diagnosis.confidence,
        severity: diagnosis.severity,
        urgency: diagnosis.urgency,
        needsDoctorImmediately: diagnosis.needsDoctorImmediately,
        recommendations: diagnosis.recommendations,
        medications: diagnosis.medications,
        warning: diagnosis.warning,
        whenToSeekHelp: diagnosis.whenToSeekHelp,
        disclaimer: diagnosis.disclaimer,
      },
    });

    await session.save();

    // Return structured diagnosis
    res.json({
      success: true,
      data: {
        diagnosis: {
          possibleDiseases: diagnosis.possibleDiseases,
          primaryDiagnosis: diagnosis.primaryDiagnosis,
          confidence: diagnosis.confidence,
          severity: diagnosis.severity,
          urgency: diagnosis.urgency,
          needsDoctorImmediately: diagnosis.needsDoctorImmediately,
          recommendations: diagnosis.recommendations,
          medications: diagnosis.medications,
          warning: diagnosis.warning,
          whenToSeekHelp: diagnosis.whenToSeekHelp,
          disclaimer: diagnosis.disclaimer,
        },
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error("Error processing symptoms:", error);
    res.status(500).json({
      success: false,
      message: "Error processing symptoms",
      error: error.message,
    });
  }
};

// Get diagnosis history for a session
export const getDiagnosisHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId;

    const session = await DiagnosisSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    // Verify user owns this session
    if (session.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to this session",
      });
    }

    // Filter out system messages if any
    const messages = session.messages.filter((msg) => msg.role !== "system");

    res.json({
      success: true,
      data: {
        messages,
        sessionInfo: {
          sessionId: session.sessionId,
          startTime: session.startTime,
          status: session.status,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching diagnosis history:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching diagnosis history",
    });
  }
};

// Get all diagnosis sessions for a user
export const getAllDiagnosisSessions = async (req, res) => {
  try {
    const userId = req.userId;

    const sessions = await DiagnosisSession.find({ userId })
      .sort({ updatedAt: -1 })
      .select("sessionId messages startTime updatedAt status");

    // Format sessions with preview
    const formattedSessions = sessions.map((session) => {
      const userMessages = session.messages.filter((m) => m.role === "user");
      const lastDiagnosis = session.messages
        .filter((m) => m.role === "assistant" && m.diagnosis)
        .pop();

      return {
        sessionId: session.sessionId,
        startTime: session.startTime,
        updatedAt: session.updatedAt,
        status: session.status,
        messageCount: session.messages.length,
        preview: {
          symptoms: userMessages[0]?.content?.substring(0, 150) || "",
          diagnosis: lastDiagnosis?.diagnosis?.primaryDiagnosis || "",
          severity: lastDiagnosis?.diagnosis?.severity || "",
          urgency: lastDiagnosis?.diagnosis?.urgency || "",
        },
      };
    });

    res.json({
      success: true,
      data: formattedSessions,
      count: formattedSessions.length,
    });
  } catch (error) {
    console.error("Error fetching diagnosis sessions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching diagnosis sessions",
    });
  }
};

// Get all medications for a user
export const getUserMedications = async (req, res) => {
  try {
    const userId = req.userId;
    const { status, limit = 50 } = req.query;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const medications = await Medication.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate("diagnosisSessionId", "sessionId startTime");

    // Group by diagnosis session
    const grouped = medications.reduce((acc, med) => {
      const sessionId = med.sessionId || "unknown";
      if (!acc[sessionId]) {
        acc[sessionId] = [];
      }
      acc[sessionId].push(med);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        medications,
        grouped,
        totalCount: medications.length,
        byStatus: {
          suggested: medications.filter((m) => m.status === "suggested").length,
          taken: medications.filter((m) => m.status === "taken").length,
          discontinued: medications.filter((m) => m.status === "discontinued")
            .length,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user medications:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching medications",
    });
  }
};

// Update medication status
export const updateMedicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.userId;

    if (!["suggested", "taken", "discontinued"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const medication = await Medication.findOne({ _id: id, userId });
    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Medication not found",
      });
    }

    medication.status = status;
    if (notes) {
      medication.notes = notes;
    }

    await medication.save();

    res.json({
      success: true,
      message: "Medication status updated",
      data: medication,
    });
  } catch (error) {
    console.error("Error updating medication status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating medication status",
    });
  }
};

// Add note to medication
export const addMedicationNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const userId = req.userId;

    const medication = await Medication.findOne({ _id: id, userId });
    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Medication not found",
      });
    }

    medication.notes = note;
    await medication.save();

    res.json({
      success: true,
      message: "Note added to medication",
      data: medication,
    });
  } catch (error) {
    console.error("Error adding medication note:", error);
    res.status(500).json({
      success: false,
      message: "Error adding note",
    });
  }
};

// Get detailed medication information
export const getMedicationDetails = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Medication name is required",
      });
    }

    console.log(`📊 Fetching medication info for: ${name}`);
    const medicationInfo = await getMedicationInfo(name);

    res.json({
      success: true,
      data: medicationInfo,
    });
  } catch (error) {
    console.error("Error fetching medication details:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching medication information",
      error: error.message,
    });
  }
};
