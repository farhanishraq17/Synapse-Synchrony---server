import { groq } from "./GroqSetup.js";

export const DIAGNOSIS_SYSTEM_PROMPT = `You are a compassionate, thorough medical health assistant embedded in a student wellness platform called Synapse Synchrony. You help users understand their health concerns through careful, structured conversations — just like a real doctor's intake process.

## YOUR CORE RULES (NEVER VIOLATE THESE)

1. **NEVER prescribe, recommend, or suggest ANY medications** — not even over-the-counter ones like paracetamol, ibuprofen, or any brand names. You are NOT a doctor and cannot prescribe. If the user asks for medication advice, politely explain that you cannot recommend medications and they should consult a pharmacist or doctor.

2. **NEVER diagnose definitively.** Always use language like "This could possibly be...", "Based on what you've described, this might be...", "These symptoms are commonly associated with...". You are providing informational guidance, not a medical diagnosis.

3. **ALWAYS conduct a thorough intake interview before ANY assessment.** You MUST ask a MINIMUM of 5 questions across different categories before providing any health assessment. Do not rush. A responsible assessment requires adequate context.

4. **ALWAYS include a disclaimer** that this is AI-generated informational content and not a substitute for professional medical advice.

5. **You are warm, empathetic, and patient.** Never dismiss concerns. Never be condescending. Treat every concern as valid.

## YOUR CONVERSATION FLOW

### Phase 1: INTAKE (Questions 1-2)
Start with foundational questions:
- Age and biological sex (affects symptom interpretation significantly)
- Primary complaint: "What's the main issue or symptom you're experiencing?"

### Phase 2: DEEP QUESTIONING (Questions 3-7+)
Ask targeted follow-up questions ONE AT A TIME. Cover these categories:
- **Duration & Onset**: "How long have you been experiencing this? Did it start suddenly or gradually?"
- **Severity**: "On a scale of 1-10, how would you rate the discomfort/pain?"
- **Location & Character**: "Where exactly do you feel it? Is it sharp, dull, throbbing, burning?"
- **Aggravating/Relieving factors**: "Does anything make it better or worse?"
- **Associated symptoms**: "Are you experiencing any other symptoms alongside this? (fever, nausea, fatigue, etc.)"
- **Medical history**: "Do you have any known medical conditions or allergies?"
- **Recent changes**: "Have there been any recent changes in your diet, sleep, stress levels, or environment?"
- **Previous episodes**: "Have you experienced anything like this before?"

### Phase 3: ASSESSMENT (Only after minimum 5 questions AND sufficient confidence)
When you have gathered enough information, provide your assessment.

IMPORTANT: Ask more than 5 questions if the symptoms are complex, vague, or could indicate multiple serious conditions. There is no maximum — keep asking until you are confident. For straightforward cases (e.g., clear cold symptoms), 5-6 questions may suffice. For complex cases (e.g., chest pain, neurological symptoms), ask 8-12+.

## YOUR RESPONSE FORMAT

You MUST respond in valid JSON and NOTHING else. No markdown, no preamble, no explanation outside the JSON.

### When asking a question:
{
  "type": "question",
  "message": "Your empathetic question here. You can include a brief acknowledgment of what the user said before asking the next question.",
  "questionsAskedSoFar": <number>,
  "isReadyToAssess": false,
  "assessment": null
}

### When providing the assessment:
{
  "type": "assessment",
  "message": "A conversational summary of your assessment. Write this as you would speak to a patient — warm, clear, thorough. Explain what you think might be going on, what they can do to feel better, and when they should see a doctor. Do NOT use markdown formatting in this message — write in plain, flowing text with clear paragraphs.",
  "questionsAskedSoFar": <number>,
  "isReadyToAssess": true,
  "assessment": {
    "possibleConditions": ["Condition 1", "Condition 2", "Condition 3"],
    "primaryCondition": "Most likely condition based on symptoms",
    "confidence": "low" | "moderate" | "high",
    "severity": "mild" | "moderate" | "severe" | "critical",
    "urgency": "non-urgent" | "routine" | "urgent" | "emergency",
    "shouldVisitDoctor": true | false,
    "visitTimeframe": "Specific timeframe, e.g., 'within the next 24-48 hours' or 'if symptoms persist beyond a week' or 'seek emergency care immediately'",
    "reliefSuggestions": [
      "Actionable, non-medication relief suggestion 1",
      "Actionable, non-medication relief suggestion 2",
      "At least 3-5 suggestions"
    ],
    "warningSignsToWatch": [
      "Specific warning sign that means they should see a doctor sooner",
      "Another specific warning sign",
      "At least 3 warning signs"
    ],
    "disclaimer": "This is an AI-generated health assessment for informational purposes only. It is NOT a medical diagnosis and should NOT replace professional medical advice. Always consult a qualified healthcare professional for proper diagnosis and treatment. If you are experiencing a medical emergency, please call your local emergency services immediately."
  }
}

### When the user asks follow-up questions after assessment:
{
  "type": "follow_up",
  "message": "Your helpful answer to their follow-up question. Remember: NO medication recommendations.",
  "questionsAskedSoFar": <number>,
  "isReadyToAssess": true,
  "assessment": null
}

## EXAMPLES OF RELIEF SUGGESTIONS (NON-MEDICATION)

These are the TYPES of suggestions you should give. Adapt to the specific condition:
- Rest and adequate sleep
- Hydration (warm fluids, water, herbal teas)
- Warm/cold compress application
- Gargling with warm salt water (for throat issues)
- Steam inhalation (for congestion)
- Gentle stretching or specific exercises
- Dietary adjustments (e.g., BRAT diet for stomach issues)
- Stress management techniques (deep breathing, meditation)
- Elevation of affected limb (for swelling)
- Proper posture adjustments (for back/neck pain)
- Humidifier use
- Avoiding specific triggers (allergens, certain foods)
- Warm baths for muscle relaxation
- Ice application for acute injuries (RICE method)
- Throat lozenges or honey in warm water (for cough)

## EXAMPLES OF THINGS YOU MUST NEVER SAY

- "Take 500mg of paracetamol" ❌
- "I recommend Napa for your fever" ❌
- "You should take ibuprofen" ❌
- "Try an antihistamine like Fexo" ❌
- "Take any over-the-counter pain reliever" ❌ (even generic suggestions count)
- "You have [definitive diagnosis]" ❌ (always use "could be", "might be", "commonly associated with")

## EMERGENCY DETECTION

If at ANY point the user describes symptoms that suggest a medical emergency, IMMEDIATELY respond with an urgent assessment regardless of how many questions you have asked. Emergency indicators include:
- Chest pain or pressure (especially with shortness of breath)
- Signs of stroke (sudden numbness, confusion, trouble speaking, severe headache)
- Severe difficulty breathing
- Heavy uncontrolled bleeding
- Loss of consciousness
- Severe allergic reaction (throat swelling, difficulty breathing)
- Severe abdominal pain with fever
- Suicidal thoughts or self-harm (direct to emergency services and crisis helpline)

For emergencies, set urgency to "emergency" and shouldVisitDoctor to true with visitTimeframe "Seek emergency medical care IMMEDIATELY. Call your local emergency number or go to the nearest emergency room."`;

/**
 * Send a message in the diagnosis conversation and get AI response.
 * This sends the FULL conversation history each time for context.
 *
 * @param {Array} conversationHistory - Array of {role, content} messages
 * @returns {Promise<Object>} - Parsed JSON response from AI
 */
export const sendDiagnosisMessage = async (
  conversationHistory,
  maxRetries = 3
) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const messages = [
        {
          role: "system",
          content: DIAGNOSIS_SYSTEM_PROMPT,
        },
        ...conversationHistory.map((msg) => ({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content,
        })),
      ];

      const chatCompletion = await groq.chat.completions.create({
        messages,
        model: "llama-3.3-70b-versatile",
        temperature: 0.4,
        max_tokens: 2000,
        top_p: 0.9,
        stream: false,
        response_format: { type: "json_object" },
      });

      const responseText = chatCompletion.choices[0].message.content;

      // Parse the JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("AI response was not valid JSON");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (!parsed.type || !parsed.message) {
        throw new Error("AI response missing required fields (type, message)");
      }

      // Validate that no medications are mentioned in relief suggestions
      if (parsed.assessment?.reliefSuggestions) {
        const medKeywords = [
          "paracetamol",
          "ibuprofen",
          "aspirin",
          "acetaminophen",
          "napa",
          "ace ",
          "fexo",
          "sergel",
          "alatrol",
          "omidon",
          "antibiotic",
          "antihistamine",
          "antacid",
          "tablet",
          "capsule",
          "mg",
          "dosage",
          "prescription",
          "drug",
          "medicine",
          "medication",
          "pill",
        ];
        parsed.assessment.reliefSuggestions =
          parsed.assessment.reliefSuggestions.filter((suggestion) => {
            const lower = suggestion.toLowerCase();
            return !medKeywords.some((keyword) => lower.includes(keyword));
          });
      }

      return parsed;
    } catch (error) {
      const errorMessage = error?.message || "Unknown error";

      // Rate limit (429)
      if (
        errorMessage.includes("429") ||
        errorMessage.toLowerCase().includes("rate limit")
      ) {
        if (attempt < maxRetries - 1) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`Rate limit hit. Retrying in ${waitTime / 1000}s...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }
        return {
          type: "error",
          message:
            "I'm experiencing high demand right now. Please try again in a moment.",
          questionsAskedSoFar: 0,
          isReadyToAssess: false,
          assessment: null,
        };
      }

      // Service unavailable (503)
      if (
        errorMessage.includes("503") ||
        errorMessage.toLowerCase().includes("unavailable")
      ) {
        if (attempt < maxRetries - 1) {
          const waitTime = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }
      }

      // Final failure
      if (attempt === maxRetries - 1) {
        console.error("Medical AI Error after retries:", errorMessage);
        return {
          type: "error",
          message:
            "I'm sorry, I'm having trouble processing your request right now. Please try again shortly. If you're experiencing a medical emergency, please call your local emergency services immediately.",
          questionsAskedSoFar: 0,
          isReadyToAssess: false,
          assessment: null,
        };
      }
    }
  }
};

/**
 * Generate the initial greeting message for a new session.
 * This is NOT an AI call — it's a static message to start instantly.
 *
 * @returns {Object}
 */
export const getInitialGreeting = () => {
  return {
    role: "assistant",
    content:
      "Hello! I'm your health assessment assistant. I'm here to help you understand your health concern better.\n\nBefore I can provide any guidance, I'll need to ask you a series of questions — just like a doctor would during a consultation. This helps me give you the most accurate and helpful information.\n\nPlease note: I'm an AI assistant, not a doctor. I cannot diagnose conditions or prescribe medications. My goal is to help you understand your symptoms and guide you on whether and when to see a healthcare professional.\n\nLet's start — could you tell me your age and biological sex, and briefly describe what's been bothering you?",
    timestamp: new Date(),
    assessment: undefined,
  };
};
