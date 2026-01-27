import MedilinkSession from "../models/MedilinkSession.js";
import MoodEntry from "../models/MoodEntry.js";
import StressEntry from "../models/StressEntry.js";
import WellnessSuggestion from "../models/WellnessSuggestion.js";
import User from "../models/User.js";
import { v4 as uuidv4 } from "uuid";
import { Groq } from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// System prompt for the AI therapist
const SYSTEM_PROMPT = `You are "Medilink AI", an empathetic and professional AI mental health assistant.
Your role is to:
1. Provide empathetic and supportive responses.
2. Use evidence-based therapeutic techniques (CBT, Mindfulness).
3. Maintain professional boundaries (you are an AI, not a doctor).
4. Monitor for risk factors (self-harm, etc.) and advise seeking professional help if needed.
5. Guide users toward their therapeutic goals.
Keep responses concise, warm, and helpful.`;

export const createSession = async (req, res) => {
  try {
    const userId = req.userId;
    const sessionId = uuidv4();

    const session = new MedilinkSession({
      userId,
      sessionId,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
      ],
    });

    await session.save();

    res.status(201).json({
      success: true,
      message: "Medilink session created successfully",
      sessionId: session.sessionId,
    });
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ success: false, message: "Error creating session" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;
    const userId = req.userId;

    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const session = await MedilinkSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    if (session.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // Add user message to history
    session.messages.push({
      role: "user",
      content: message,
      timestamp: new Date(),
    });

    // Prepare context for Groq
    const validRoles = ["system", "user", "assistant"];
    const messagesForAI = session.messages
      .filter(m => validRoles.includes(m.role))
      .map(m => ({
        role: m.role,
        content: m.content,
      }));

    // Step 1: Get therapeutic response
    const completion = await groq.chat.completions.create({
      messages: messagesForAI,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_completion_tokens: 1024,
      top_p: 1,
      stop: null,
      stream: false,
    });

    const aiResponseContent = completion.choices[0]?.message?.content || "I'm listening. Please go on.";

    // Step 2: Generate Mood Report
    let moodReport = null;
    try {
      const moodPrompt = [
        { role: "system", content: "You are a mental health expert analyzing mood. Output JSON only." },
        { 
          role: "user", 
          content: `Analyze the mood from this user message: "${message}".
          
Return strictly valid JSON:
{
  "mood": "string (e.g., happy, sad, anxious, angry, neutral, stressed, depressed, excited, calm)",
  "intensity": number (1-10, where 1 is very mild and 10 is very intense),
  "emotions": ["array", "of", "emotions"],
  "indicators": ["why you assessed this mood"]
}` 
        }
      ];

      const moodCompletion = await groq.chat.completions.create({
        messages: moodPrompt,
        model: "llama-3.3-70b-versatile",
        temperature: 0.2,
        response_format: { type: "json_object" }
      });

      moodReport = JSON.parse(moodCompletion.choices[0]?.message?.content || "{}");
      
      // Save Mood Entry to Database
      const moodEntry = new MoodEntry({
        userId,
        sessionId,
        moodRating: moodReport.intensity || 5,
        emotions: moodReport.emotions || [moodReport.mood || "neutral"],
        notes: moodReport.indicators?.join(", ") || "",
        timestamp: new Date(),
      });
      await moodEntry.save();

    } catch (err) {
      console.warn("Mood analysis failed:", err);
      moodReport = { mood: "unknown", intensity: 5, emotions: [], indicators: [] };
    }

    // Step 3: Generate Stress Report
    let stressReport = null;
    try {
      const stressPrompt = [
        { role: "system", content: "You are a stress assessment expert. Output JSON only." },
        { 
          role: "user", 
          content: `Analyze the stress level from this user message: "${message}".

Return strictly valid JSON:
{
  "stressLevel": number (0-10, where 0 is no stress and 10 is extreme stress),
  "stressors": ["array", "of", "identified", "stressors"],
  "physiologicalSigns": ["fatigue", "headache", "etc"],
  "emotionalSigns": ["worry", "irritability", "etc"],
  "behavioralSigns": ["avoidance", "procrastination", "etc"]
}` 
        }
      ];

      const stressCompletion = await groq.chat.completions.create({
        messages: stressPrompt,
        model: "llama-3.3-70b-versatile",
        temperature: 0.2,
        response_format: { type: "json_object" }
      });

      stressReport = JSON.parse(stressCompletion.choices[0]?.message?.content || "{}");

      // Save Stress Entry to Database
      const stressEntry = new StressEntry({
        userId,
        sessionId,
        stressLevel: stressReport.stressLevel || 0,
        stressors: stressReport.stressors || [],
        physiologicalSigns: stressReport.physiologicalSigns || [],
        emotionalSigns: stressReport.emotionalSigns || [],
        behavioralSigns: stressReport.behavioralSigns || [],
        context: message.substring(0, 200),
        timestamp: new Date(),
      });
      await stressEntry.save();

    } catch (err) {
      console.warn("Stress analysis failed:", err);
      stressReport = { stressLevel: 0, stressors: [], physiologicalSigns: [], emotionalSigns: [], behavioralSigns: [] };
    }

    // Step 4: Generate Wellness Suggestions (if mood is low or stress is high)
    let suggestions = null;
    const shouldGenerateSuggestions = 
      (moodReport?.intensity && moodReport.intensity <= 4) || 
      (stressReport?.stressLevel && stressReport.stressLevel >= 6);

    if (shouldGenerateSuggestions) {
      try {
        const suggestionPrompt = [
          { role: "system", content: "You are a mental health advisor providing practical coping strategies." },
          { 
            role: "user", 
            content: `Based on this user's state:
- Mood: ${moodReport.mood} (intensity: ${moodReport.intensity}/10)
- Stress Level: ${stressReport.stressLevel}/10
- Stressors: ${stressReport.stressors.join(", ")}
- Recent message: "${message}"

Provide 3-5 practical, immediate, and actionable coping strategies.
Make them specific, empathetic, and easy to do right now.

Return strictly valid JSON:
{
  "suggestions": ["array", "of", "suggestion", "strings"],
  "reasoning": "brief explanation of why these suggestions",
  "urgency": "low|moderate|high|critical"
}` 
          }
        ];

        const suggestionCompletion = await groq.chat.completions.create({
          messages: suggestionPrompt,
          model: "llama-3.3-70b-versatile",
          temperature: 0.7,
          response_format: { type: "json_object" }
        });

        suggestions = JSON.parse(suggestionCompletion.choices[0]?.message?.content || "{}");

        // Determine trigger reason
        let triggeredBy = "both";
        if (moodReport.intensity <= 4 && stressReport.stressLevel < 6) triggeredBy = "low_mood";
        else if (stressReport.stressLevel >= 6 && moodReport.intensity > 4) triggeredBy = "high_stress";

        // Determine urgency
        const urgency = suggestions.urgency || 
          (stressReport.stressLevel >= 8 || moodReport.intensity <= 2 ? "high" : "moderate");

        // Save Wellness Suggestions to Database
        const wellnessSuggestion = new WellnessSuggestion({
          userId,
          sessionId,
          suggestions: suggestions.suggestions || [],
          reasoning: suggestions.reasoning || "",
          triggeredBy,
          moodAtTime: {
            mood: moodReport.mood,
            intensity: moodReport.intensity,
          },
          stressAtTime: {
            level: stressReport.stressLevel,
            stressors: stressReport.stressors,
          },
          urgency,
          timestamp: new Date(),
        });
        await wellnessSuggestion.save();

      } catch (err) {
        console.warn("Suggestion generation failed:", err);
        suggestions = { suggestions: [], reasoning: "", urgency: "moderate" };
      }
    }

    // Add AI response to history with metadata
    session.messages.push({
      role: "assistant",
      content: aiResponseContent,
      timestamp: new Date(),
      metadata: {
        analysis: {
          mood: moodReport,
          stress: stressReport,
          suggestions: suggestions,
        }
      }
    });

    await session.save();

    // Prepare response
    const responseData = {
      response: aiResponseContent,
      moodReport: {
        mood: moodReport.mood,
        intensity: moodReport.intensity,
        emotions: moodReport.emotions,
        timestamp: new Date(),
      },
      stressReport: {
        level: stressReport.stressLevel,
        stressors: stressReport.stressors,
        timestamp: new Date(),
      },
    };

    // Add suggestions if generated
    if (suggestions && suggestions.suggestions?.length > 0) {
      responseData.suggestions = {
        items: suggestions.suggestions,
        reasoning: suggestions.reasoning,
        urgency: suggestions.urgency || "moderate",
      };
    }

    res.json({
      success: true,
      data: responseData,
    });

  } catch (error) {
    console.error("Error processing message:", error);
    res.status(500).json({ success: false, message: "Error processing message" });
  }
};

export const getSessionHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId;

    const session = await MedilinkSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    if (session.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    res.json({
      success: true,
      data: session.messages,
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ success: false, message: "Error fetching history" });
  }
};

export const getAllSessions = async (req, res) => {
  try {
    const userId = req.userId;

    const sessions = await MedilinkSession.find({ userId })
      .sort({ updatedAt: -1 })
      .select('sessionId messages startTime updatedAt createdAt');

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ success: false, message: "Error fetching sessions" });
  }
};

// NEW: Get Mood History for a User
export const getMoodHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const { sessionId, limit = 50, days = 30 } = req.query;

    const query = { userId };
    
    // Optional: filter by session
    if (sessionId) {
      query.sessionId = sessionId;
    }

    // Optional: filter by time range
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - parseInt(days));
    query.timestamp = { $gte: dateLimit };

    const moodEntries = await MoodEntry.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    // Calculate statistics
    const totalEntries = moodEntries.length;
    const avgMood = totalEntries > 0
      ? moodEntries.reduce((sum, entry) => sum + entry.moodRating, 0) / totalEntries
      : 0;

    const moodDistribution = {};
    moodEntries.forEach(entry => {
      entry.emotions.forEach(emotion => {
        moodDistribution[emotion] = (moodDistribution[emotion] || 0) + 1;
      });
    });

    res.json({
      success: true,
      data: {
        entries: moodEntries,
        statistics: {
          totalEntries,
          averageMoodRating: parseFloat(avgMood.toFixed(2)),
          moodDistribution,
          timeRange: `Last ${days} days`,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching mood history:", error);
    res.status(500).json({ success: false, message: "Error fetching mood history" });
  }
};

// NEW: Get Stress History for a User
export const getStressHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const { sessionId, limit = 50, days = 30 } = req.query;

    const query = { userId };
    
    if (sessionId) {
      query.sessionId = sessionId;
    }

    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - parseInt(days));
    query.timestamp = { $gte: dateLimit };

    const stressEntries = await StressEntry.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    // Calculate statistics
    const totalEntries = stressEntries.length;
    const avgStress = totalEntries > 0
      ? stressEntries.reduce((sum, entry) => sum + entry.stressLevel, 0) / totalEntries
      : 0;

    const stressorFrequency = {};
    stressEntries.forEach(entry => {
      entry.stressors.forEach(stressor => {
        stressorFrequency[stressor] = (stressorFrequency[stressor] || 0) + 1;
      });
    });

    const highStressCount = stressEntries.filter(e => e.stressLevel >= 7).length;

    res.json({
      success: true,
      data: {
        entries: stressEntries,
        statistics: {
          totalEntries,
          averageStressLevel: parseFloat(avgStress.toFixed(2)),
          highStressInstances: highStressCount,
          commonStressors: stressorFrequency,
          timeRange: `Last ${days} days`,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching stress history:", error);
    res.status(500).json({ success: false, message: "Error fetching stress history" });
  }
};

// NEW: Get Wellness Suggestions for a User
export const getWellnessSuggestions = async (req, res) => {
  try {
    const userId = req.userId;
    const { sessionId, limit = 20, unreadOnly = false } = req.query;

    const query = { userId };
    
    if (sessionId) {
      query.sessionId = sessionId;
    }

    if (unreadOnly === 'true') {
      query.isViewed = false;
    }

    const suggestions = await WellnessSuggestion.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        suggestions,
        totalCount: suggestions.length,
        unreadCount: suggestions.filter(s => !s.isViewed).length,
      },
    });
  } catch (error) {
    console.error("Error fetching wellness suggestions:", error);
    res.status(500).json({ success: false, message: "Error fetching wellness suggestions" });
  }
};

// NEW: Mark Suggestion as Viewed
export const markSuggestionViewed = async (req, res) => {
  try {
    const { suggestionId } = req.params;
    const userId = req.userId;

    const suggestion = await WellnessSuggestion.findOne({
      _id: suggestionId,
      userId,
    });

    if (!suggestion) {
      return res.status(404).json({ success: false, message: "Suggestion not found" });
    }

    suggestion.isViewed = true;
    await suggestion.save();

    res.json({
      success: true,
      message: "Suggestion marked as viewed",
    });
  } catch (error) {
    console.error("Error marking suggestion as viewed:", error);
    res.status(500).json({ success: false, message: "Error updating suggestion" });
  }
};

// NEW: Get Wellness Summary (Combined Mood + Stress Overview)
export const getWellnessSummary = async (req, res) => {
  try {
    const userId = req.userId;
    const { days = 7 } = req.query;

    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - parseInt(days));

    // Get mood data
    const moodEntries = await MoodEntry.find({
      userId,
      timestamp: { $gte: dateLimit },
    }).sort({ timestamp: -1 });

    // Get stress data
    const stressEntries = await StressEntry.find({
      userId,
      timestamp: { $gte: dateLimit },
    }).sort({ timestamp: -1 });

    // Get recent suggestions
    const recentSuggestions = await WellnessSuggestion.find({
      userId,
      timestamp: { $gte: dateLimit },
    })
      .sort({ timestamp: -1 })
      .limit(5);

    // Calculate mood statistics
    const avgMood = moodEntries.length > 0
      ? moodEntries.reduce((sum, e) => sum + e.moodRating, 0) / moodEntries.length
      : 0;

    const moodTrend = moodEntries.slice(0, 10).map(e => ({
      rating: e.moodRating,
      emotions: e.emotions,
      timestamp: e.timestamp,
    }));

    // Calculate stress statistics
    const avgStress = stressEntries.length > 0
      ? stressEntries.reduce((sum, e) => sum + e.stressLevel, 0) / stressEntries.length
      : 0;

    const stressTrend = stressEntries.slice(0, 10).map(e => ({
      level: e.stressLevel,
      stressors: e.stressors,
      timestamp: e.timestamp,
    }));

    // Overall wellness score (0-100)
    const wellnessScore = Math.round(
      ((10 - avgStress) / 10) * 50 + (avgMood / 10) * 50
    );

    res.json({
      success: true,
      data: {
        summary: {
          wellnessScore,
          averageMood: parseFloat(avgMood.toFixed(2)),
          averageStress: parseFloat(avgStress.toFixed(2)),
          timeRange: `Last ${days} days`,
          totalMoodEntries: moodEntries.length,
          totalStressEntries: stressEntries.length,
        },
        trends: {
          mood: moodTrend,
          stress: stressTrend,
        },
        recentSuggestions: recentSuggestions.map(s => ({
          suggestions: s.suggestions,
          urgency: s.urgency,
          triggeredBy: s.triggeredBy,
          timestamp: s.timestamp,
          isViewed: s.isViewed,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching wellness summary:", error);
    res.status(500).json({ success: false, message: "Error fetching wellness summary" });
  }
};
