import { HfInference } from '@huggingface/inference';
import 'dotenv/config';

const hf = new HfInference(process.env.HUGGING_FACE_TOKEN);

/**
 * Medical diagnosis system using Hugging Face
 * Analyzes symptoms and provides diagnosis with Bangladesh-available medications
 * 
 * @param {string} symptoms - Patient's symptoms description
 * @returns {Promise<Object>} - Diagnosis results
 */
export const diagnoseMedical = async (symptoms) => {
  try {
    const prompt = `You are a medical AI assistant for patients in Bangladesh. Analyze the following symptoms and provide a structured response in JSON format.

Symptoms: "${symptoms}"

IMPORTANT: When recommending medications, PRIORITIZE these Bangladesh-available brands:
- Napa, Napa Extra, Napa Extend (Paracetamol 500mg) - for fever, pain
- Ace, Ace Plus (Paracetamol + Caffeine) - for headache, fever
- Fexo (Fexofenadine 120mg/180mg) - for allergies
- Sergel (Serratiopeptidase) - for inflammation, swelling
- Alatrol (Cetirizine 10mg) - for allergies, itching
- Omidon (Omeprazole 20mg) - for acidity, gastric issues
- Maxpro (Esomeprazole) - for GERD, heartburn
- Entacyd (Antacid) - for acidity

Provide your response in this EXACT JSON format (must be valid JSON):
{
  "possibleDiseases": ["list of 2-4 most likely conditions"],
  "primaryDiagnosis": "most likely condition",
  "confidence": "high/medium/low",
  "severity": "mild/moderate/severe/critical",
  "urgency": "immediate/urgent/routine/non-urgent",
  "needsDoctorImmediately": true/false,
  "recommendations": ["list of 3-5 self-care recommendations"],
  "medications": ["list of Bangladesh-available OTC medicines with brand names (e.g., 'Napa 500mg', 'Ace Plus')"],
  "warning": "important warning or precaution",
  "whenToSeekHelp": ["list of warning signs that require immediate medical attention"]
}

Important guidelines:
- Be cautious and conservative in recommendations
- Always recommend seeing a doctor for serious symptoms
- Only suggest over-the-counter medications available in Bangladesh
- Use Bangladesh brand names when possible (Napa instead of generic Paracetamol)
- Include clear warning signs
- If symptoms are severe, set needsDoctorImmediately to true`;

    let fullResponse = '';
    
    // Enable streaming output to console
    console.log(''); // New line before streaming
    
    const stream = hf.chatCompletionStream({
      model: 'meta-llama/Llama-3.1-70B-Instruct',
      messages: [
        {
          role: 'system',
          content: 'You are a medical AI assistant serving patients in Bangladesh. Always provide responses in valid JSON format. Use Bangladesh-available medication brands. Be cautious and prioritize patient safety.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    for await (const chunk of stream) {
      if (chunk.choices && chunk.choices.length > 0) {
        const newContent = chunk.choices[0].delta.content;
        if (newContent) {
          fullResponse += newContent;
          process.stdout.write(newContent); // Stream to console
        }
      }
    }

    // Extract JSON from response (in case there's extra text)
    const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse medical diagnosis response');
    }

    const diagnosis = JSON.parse(jsonMatch[0]);
    
    // Add disclaimer
    diagnosis.disclaimer = 'This is an AI-generated assessment and should not replace professional medical advice. Always consult with a healthcare provider for accurate diagnosis and treatment.';
    
    return diagnosis;

  } catch (error) {
    console.error('Medical Diagnosis Error:', error);
    
    // Return safe fallback response
    return {
      error: true,
      message: 'Unable to process medical diagnosis',
      possibleDiseases: ['Unable to determine'],
      primaryDiagnosis: 'Unknown - Please consult a doctor',
      confidence: 'low',
      severity: 'unknown',
      urgency: 'urgent',
      needsDoctorImmediately: true,
      recommendations: [
        'Please consult a healthcare professional immediately',
        'Visit nearby clinic or hospital',
        'Do not self-medicate without proper diagnosis',
        'Keep track of your symptoms'
      ],
      medications: ['Consult a doctor before taking any medication'],
      warning: 'Unable to provide automated diagnosis. Please seek professional medical help immediately.',
      whenToSeekHelp: [
        'If symptoms worsen',
        'If you experience severe pain',
        'If symptoms persist for more than 24-48 hours',
        'If you have difficulty breathing',
        'If you experience chest pain or severe headache'
      ],
      disclaimer: 'This is an AI-generated assessment and should not replace professional medical advice. Always consult with a healthcare provider for accurate diagnosis and treatment.'
    };
  }
};

/**
 * Quick symptom checker for common conditions (Bangladesh context)
 * @param {string} symptoms - Symptoms description
 * @returns {Promise<string>}
 */
export const quickSymptomCheck = async (symptoms) => {
  try {
    const prompt = `Based on these symptoms: "${symptoms}"

Provide a brief assessment (2-3 sentences) for a patient in Bangladesh covering:
1. Most likely condition
2. Whether immediate medical attention is needed
3. One quick recommendation with Bangladesh-available medicine if applicable (e.g., Napa, Fexo, Sergel)

Keep response concise and practical.`;

    let fullResponse = '';
    
    console.log(''); // New line before streaming
    
    const stream = hf.chatCompletionStream({
      model: 'meta-llama/Llama-3.1-70B-Instruct',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful medical assistant for patients in Bangladesh. Provide concise, practical advice using locally available medications.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.3,
    });

    for await (const chunk of stream) {
      if (chunk.choices && chunk.choices.length > 0) {
        const newContent = chunk.choices[0].delta.content;
        if (newContent) {
          fullResponse += newContent;
          process.stdout.write(newContent); // Stream to console
        }
      }
    }

    return fullResponse;

  } catch (error) {
    console.error('Quick Symptom Check Error:', error);
    return 'Unable to assess symptoms. Please consult a healthcare professional for proper evaluation.';
  }
};

/**
 * Get medication information (Bangladesh brands prioritized)
 * @param {string} medicationName - Name of medication (can be brand or generic)
 * @returns {Promise<Object>}
 */
export const getMedicationInfo = async (medicationName) => {
  try {
    const prompt = `Provide information about the medication: "${medicationName}"

Context: This is for patients in Bangladesh. If this is a Bangladesh brand (like Napa, Ace Plus, Fexo, Sergel, Alatrol, Omidon), include that context.

Common Bangladesh brands:
- Napa/Napa Extra = Paracetamol (Square Pharmaceuticals)
- Ace/Ace Plus = Paracetamol + Caffeine (Square Pharmaceuticals)
- Fexo = Fexofenadine (Square Pharmaceuticals)
- Sergel = Serratiopeptidase (Square Pharmaceuticals)
- Alatrol = Cetirizine (Square Pharmaceuticals)
- Omidon = Omeprazole (Square Pharmaceuticals)

Response in JSON format:
{
  "name": "medication name (include brand and generic name if applicable)",
  "manufacturer": "company name if Bangladesh brand",
  "purpose": "what it's used for",
  "dosage": "typical dosage (general info only)",
  "sideEffects": ["common side effects"],
  "precautions": ["important precautions"],
  "interactions": ["common drug interactions"],
  "availabilityInBangladesh": "OTC/Prescription/Widely Available"
}`;

    let fullResponse = '';
    
    console.log(''); // New line before streaming
    
    const stream = hf.chatCompletionStream({
      model: 'meta-llama/Llama-3.1-70B-Instruct',
      messages: [
        {
          role: 'system',
          content: 'You are a pharmaceutical information assistant for Bangladesh. Provide accurate medication information in JSON format, with context for Bangladesh brands.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.2,
    });

    for await (const chunk of stream) {
      if (chunk.choices && chunk.choices.length > 0) {
        const newContent = chunk.choices[0].delta.content;
        if (newContent) {
          fullResponse += newContent;
          process.stdout.write(newContent); // Stream to console
        }
      }
    }

    const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse medication information');
    }

    const info = JSON.parse(jsonMatch[0]);
    info.disclaimer = 'This information is for educational purposes only. Always consult a healthcare provider or registered pharmacist before taking any medication.';
    
    return info;

  } catch (error) {
    console.error('Medication Info Error:', error);
    throw error;
  }
};

export default hf;
