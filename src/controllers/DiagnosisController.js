import DiagnosisSession from "../models/DiagnosisSession.js";
import { v4 as uuidv4 } from "uuid";
import {
  sendDiagnosisMessage,
  getInitialGreeting,
} from "../config/MedicalAI.js";
import axios from "axios";

// Create a new diagnosis session
export const createDiagnosisSession = async (req, res) => {
  try {
    const userId = req.userId;
    const sessionId = uuidv4();

    // Create session with the AI's greeting already in it
    const greeting = getInitialGreeting();

    const session = new DiagnosisSession({
      userId,
      sessionId,
      sessionType: "medical_diagnosis",
      phase: "intake",
      questionsAsked: 1,
      messages: [greeting],
    });

    await session.save();

    res.status(201).json({
      success: true,
      message: "Diagnosis session created successfully",
      sessionId: session.sessionId,
      greeting: greeting,
    });
  } catch (error) {
    console.error("Error creating diagnosis session:", error);
    res.status(500).json({
      success: false,
      message: "Error creating diagnosis session",
    });
  }
};

// Send a message in the diagnosis conversation
export const sendMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;
    const userId = req.userId;

    // Validate input
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty",
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

    // Verify ownership
    if (session.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to this session",
      });
    }

    // Add user message to session
    session.messages.push({
      role: "user",
      content: message.trim(),
      timestamp: new Date(),
    });

    // Build conversation history for AI (only role + content)
    const conversationHistory = session.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Send to AI
    console.log(
      `Diagnosis session ${sessionId} — sending message #${session.messages.length}`
    );
    const aiResponse = await sendDiagnosisMessage(conversationHistory);

    // Handle error responses from AI
    if (aiResponse.type === "error") {
      session.messages.push({
        role: "assistant",
        content: aiResponse.message,
        timestamp: new Date(),
      });
      await session.save();

      return res.json({
        success: true,
        data: {
          type: "error",
          message: aiResponse.message,
        },
      });
    }

    // Update session phase and question count
    if (aiResponse.questionsAskedSoFar) {
      session.questionsAsked = aiResponse.questionsAskedSoFar;
    }

    if (aiResponse.type === "assessment") {
      session.phase = "assessed";
      session.status = "assessed";
    } else if (aiResponse.type === "follow_up") {
      session.phase = "follow_up";
    } else {
      session.phase = "questioning";
    }

    // Build the assistant message to store
    const assistantMessage = {
      role: "assistant",
      content: aiResponse.message,
      timestamp: new Date(),
    };

    // If this is an assessment, attach the structured data
    if (aiResponse.assessment) {
      assistantMessage.assessment = {
        possibleConditions: aiResponse.assessment.possibleConditions || [],
        primaryCondition: aiResponse.assessment.primaryCondition || "",
        confidence: aiResponse.assessment.confidence || "low",
        severity: aiResponse.assessment.severity || "mild",
        urgency: aiResponse.assessment.urgency || "non-urgent",
        shouldVisitDoctor: aiResponse.assessment.shouldVisitDoctor ?? true,
        visitTimeframe: aiResponse.assessment.visitTimeframe || "",
        reliefSuggestions: aiResponse.assessment.reliefSuggestions || [],
        warningSignsToWatch: aiResponse.assessment.warningSignsToWatch || [],
        disclaimer:
          aiResponse.assessment.disclaimer ||
          "This is an AI-generated assessment. Always consult a healthcare professional.",
      };
    }

    session.messages.push(assistantMessage);
    await session.save();

    // Return response to client
    res.json({
      success: true,
      data: {
        type: aiResponse.type,
        message: aiResponse.message,
        questionsAskedSoFar:
          aiResponse.questionsAskedSoFar || session.questionsAsked,
        isReadyToAssess: aiResponse.isReadyToAssess || false,
        assessment: aiResponse.assessment || null,
        sessionPhase: session.phase,
      },
    });
  } catch (error) {
    console.error("Error in diagnosis sendMessage:", error);
    res.status(500).json({
      success: false,
      message: "Error processing your message. Please try again.",
      error: error.message,
    });
  }
};

// Get diagnosis history for a session
export const getSessionHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId;

    const session = await DiagnosisSession.findOne({ sessionId });
    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    }

    if (session.userId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized" });
    }

    const messages = session.messages.filter((msg) => msg.role !== "system");

    res.json({
      success: true,
      data: {
        messages,
        sessionInfo: {
          sessionId: session.sessionId,
          startTime: session.startTime,
          status: session.status,
          phase: session.phase || "assessed",
          questionsAsked: session.questionsAsked || 0,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching diagnosis history:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching session history" });
  }
};

// Get all diagnosis sessions for a user
export const getAllDiagnosisSessions = async (req, res) => {
  try {
    const userId = req.userId;

    const sessions = await DiagnosisSession.find({ userId })
      .sort({ updatedAt: -1 })
      .select(
        "sessionId messages startTime updatedAt status phase questionsAsked"
      );

    const formattedSessions = sessions.map((session) => {
      const userMessages = session.messages.filter((m) => m.role === "user");
      // Check both new assessment and old diagnosis fields for backward compat
      const lastAssessment = session.messages
        .filter(
          (m) =>
            m.role === "assistant" &&
            (m.assessment?.primaryCondition || m.diagnosis?.primaryDiagnosis)
        )
        .pop();

      return {
        sessionId: session.sessionId,
        startTime: session.startTime,
        updatedAt: session.updatedAt,
        status: session.status,
        phase: session.phase || "assessed",
        questionsAsked: session.questionsAsked || 0,
        messageCount: session.messages.length,
        preview: {
          mainConcern: userMessages[0]?.content?.substring(0, 150) || "",
          primaryCondition:
            lastAssessment?.assessment?.primaryCondition ||
            lastAssessment?.diagnosis?.primaryDiagnosis ||
            "",
          severity:
            lastAssessment?.assessment?.severity ||
            lastAssessment?.diagnosis?.severity ||
            "",
          urgency:
            lastAssessment?.assessment?.urgency ||
            lastAssessment?.diagnosis?.urgency ||
            "",
          shouldVisitDoctor:
            lastAssessment?.assessment?.shouldVisitDoctor ??
            lastAssessment?.diagnosis?.needsDoctorImmediately ??
            null,
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
    res
      .status(500)
      .json({ success: false, message: "Error fetching sessions" });
  }
};

// Save user's location to a session
export const saveUserLocation = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { latitude, longitude, address } = req.body;
    const userId = req.userId;

    const session = await DiagnosisSession.findOne({ sessionId });
    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    }

    if (session.userId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized" });
    }

    session.userLocation = {
      latitude,
      longitude,
      address: address || "",
      sharedAt: new Date(),
    };

    await session.save();

    res.json({
      success: true,
      message: "Location saved successfully",
    });
  } catch (error) {
    console.error("Error saving user location:", error);
    res
      .status(500)
      .json({ success: false, message: "Error saving location" });
  }
};

// Get nearby hospitals/clinics using Overpass API (OpenStreetMap)
export const getNearbyFacilities = async (req, res) => {
  try {
    const { latitude, longitude, radius = 5000 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const rad = parseInt(radius);

    // Simplified Overpass API query - only hospitals and clinics for faster response
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["amenity"="hospital"](around:${rad},${lat},${lon});
        way["amenity"="hospital"](around:${rad},${lat},${lon});
        node["amenity"="clinic"](around:${rad},${lat},${lon});
        way["amenity"="clinic"](around:${rad},${lat},${lon});
      );
      out center body;
    `;

    console.log(`Fetching facilities within ${rad}m of (${lat}, ${lon})...`);

    const overpassResponse = await axios.get(
      "https://overpass-api.de/api/interpreter",
      {
        params: { data: overpassQuery },
        timeout: 45000, // Increased to 45 seconds
      }
    );

    console.log(`Overpass API returned ${overpassResponse.data.elements?.length || 0} facilities`);

    const elements = overpassResponse.data.elements || [];

    // Process and format results
    const facilities = elements
      .map((el) => {
        const facilityLat = el.lat || el.center?.lat;
        const facilityLon = el.lon || el.center?.lon;

        if (!facilityLat || !facilityLon) return null;

        // Calculate distance using Haversine formula
        const distance = haversineDistance(lat, lon, facilityLat, facilityLon);

        // Determine facility type - STRICT validation
        let type = null;
        const amenity = el.tags?.amenity;
        
        if (amenity === "hospital") {
          type = "hospital";
        } else if (amenity === "clinic") {
          type = "clinic";
        } else {
          // Log unexpected results for debugging
          console.warn(
            `Skipping non-medical facility: "${el.tags?.name || 'Unnamed'}" with amenity="${amenity}"`,
            { tags: el.tags }
          );
          return null; // FILTER OUT - only accept hospitals and clinics
        }

        return {
          name: el.tags?.name || el.tags?.["name:en"] || `Unnamed ${type}`,
          type,
          latitude: facilityLat,
          longitude: facilityLon,
          distance: Math.round(distance),
          address:
            el.tags?.["addr:full"] || el.tags?.["addr:street"] || "",
          phone: el.tags?.phone || el.tags?.["contact:phone"] || "",
          website: el.tags?.website || el.tags?.["contact:website"] || "",
          openingHours: el.tags?.opening_hours || "",
          emergency: el.tags?.emergency === "yes",
          googleMapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${facilityLat},${facilityLon}`,
        };
      })
      .filter(Boolean) // Remove nulls (invalid facilities)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 15);

    console.log(`Returning ${facilities.length} validated medical facilities`);

    res.json({
      success: true,
      data: {
        facilities,
        searchRadius: rad,
        totalFound: facilities.length,
        userLocation: { latitude: lat, longitude: lon },
      },
    });
  } catch (error) {
    console.error("Error fetching nearby facilities:", error.message);
    
    // Distinguish between timeout and other errors
    const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');
    
    // Return graceful error response
    res.status(200).json({
      success: false,
      data: {
        facilities: [],
        searchRadius: parseInt(req.query.radius) || 5000,
        totalFound: 0,
        errorType: isTimeout ? 'timeout' : 'api_error',
        error: isTimeout 
          ? "The hospital search is taking longer than expected. Please try again in a moment or search manually on Google Maps."
          : "Unable to fetch nearby facilities at the moment. Please try searching manually on Google Maps.",
        googleMapsSearchUrl: `https://www.google.com/maps/search/hospitals+near+me/@${req.query.latitude},${req.query.longitude},14z`,
      },
    });
  }
};

/**
 * Haversine formula to calculate distance between two lat/lon points
 * @returns {number} Distance in meters
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
