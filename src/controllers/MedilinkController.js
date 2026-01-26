import MedilinkSession from "../models/MedilinkSession.js";
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

    // Prapare context for Groq
    // Filter out metadata for the API call to save tokens/complexity, keep only role and content
    const validRoles = ["system", "user", "assistant"];
    
    // Convert 'system' to 'system' (Groq supports it usually, or we prepend to first user message)
    // LLaMA models typically support 'system' role.
    const messagesForAI = session.messages
      .filter(m => validRoles.includes(m.role))
      .map(m => ({
        role: m.role,
        content: m.content,
      }));

    // 1. Analyze input (Optional parallel call or single prompt)
    // We will do a single call for response to encourage speed, but we can do a second one for analysis if needed.
    // For now, let's just get the therapeutic response to match standard flow.
    // The reference separated analysis and response. We can try to do that too if needed, but let's start with response.

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

    // 2. Perform Analysis (Separate light call to categorization)
    // We can do this asynchronously or skip if speed is key. Let's do a simple one.
    // We'll skip deep JSON analysis for now to ensure reliability of the main chat, 
    // but we can add it if the user specifically requested the "analysis" features.
    // The user asked for "same functionalities", so we SHOULD include analysis.

    let analysisData = {};
    try {
        const analysisPrompt = [
            { role: "system", content: "Analyze the user's message. Output JSON only." },
            { role: "user", content: `Analyze the therapeutic context of this message: "${message}".
            Return strictly valid JSON:
            {
              "emotionalState": "string (e.g. anxious, calm)",
              "riskLevel": number (0-10),
              "themes": ["string"]
            }` }
        ];
        
        const analysisCompletion = await groq.chat.completions.create({
             messages: analysisPrompt,
             model: "llama-3.3-70b-versatile",
             temperature: 0.1,
             response_format: { type: "json_object" }
        });
        
        analysisData = JSON.parse(analysisCompletion.choices[0]?.message?.content || "{}");
    } catch (err) {
        console.warn("Analysis failed", err);
        analysisData = { emotionalState: "unknown", riskLevel: 0, themes: [] };
    }

    // Add AI response to history
    session.messages.push({
      role: "assistant",
      content: aiResponseContent,
      timestamp: new Date(),
      metadata: {
        analysis: analysisData
      }
    });

    await session.save();

    res.json({
      success: true,
      data: {
        response: aiResponseContent,
        analysis: analysisData,
      },
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
