import { HfInference } from '@huggingface/inference';
import 'dotenv/config';

const hf = new HfInference(process.env.HUGGING_FACE_TOKEN);

/**
 * Medical diagnosis system using Hugging Face
 * Analyzes symptoms and provides diagnosis, suggestions, and urgency assessment
 * 
 * @param {string} symptoms - Patient's symptoms description
 * @returns {Promise<Object>} - Diagnosis results
 */
export const diagnoseMedical = async (symptoms) => {
  try {
    const prompt = `You are a medical AI assistant. Analyze the following symptoms and provide a structured response in JSON format.

Symptoms: "${symptoms}"

Provide your response in this EXACT JSON format (must be valid JSON):
{
  "possibleDiseases": ["list of 2-4 most likely conditions"],
  "primaryDiagnosis": "most likely condition",
  "confidence": "high/medium/low",
  "severity": "mild/moderate/severe/critical",
  "urgency": "immediate/urgent/routine/non-urgent",
  "needsDoctorImmediately": true/false,
  "recommendations": ["list of 3-5 self-care recommendations"],
  "medications": ["list of over-the-counter medicines that might help"],
  "warning": "important warning or precaution",
  "whenToSeekHelp": ["list of warning signs that require immediate medical attention"]
}

Important guidelines:
- Be cautious and conservative in recommendations
- Always recommend seeing a doctor for serious symptoms
- Only suggest over-the-counter medications
- Include clear warning signs
- If symptoms are severe, set needsDoctorImmediately to true`;

    let fullResponse = '';
    
    const stream = hf.chatCompletionStream({
      model: 'meta-llama/Llama-3.1-70B-Instruct', // 70B - Much more powerful!
      messages: [
        {
          role: 'system',
          content: 'You are a medical AI assistant. Always provide responses in valid JSON format. Be cautious and prioritize patient safety.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.3, // Lower temperature for more consistent medical advice
    });

    for await (const chunk of stream) {
      if (chunk.choices && chunk.choices.length > 0) {
        const newContent = chunk.choices[0].delta.content;
        if (newContent) {
          fullResponse += newContent;
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
        'Please consult a healthcare professional',
        'Do not self-medicate without proper diagnosis',
        'Keep track of your symptoms'
      ],
      medications: ['Consult a doctor before taking any medication'],
      warning: 'Unable to provide automated diagnosis. Please seek professional medical help.',
      whenToSeekHelp: [
        'If symptoms worsen',
        'If you experience severe pain',
        'If symptoms persist for more than 24-48 hours'
      ],
      disclaimer: 'This is an AI-generated assessment and should not replace professional medical advice. Always consult with a healthcare provider for accurate diagnosis and treatment.'
    };
  }
};

/**
 * Quick symptom checker for common conditions
 * @param {string} symptoms - Symptoms description
 * @returns {Promise<string>}
 */
export const quickSymptomCheck = async (symptoms) => {
  try {
    const prompt = `Based on these symptoms: "${symptoms}"

Provide a brief assessment (2-3 sentences) covering:
1. Most likely condition
2. Whether immediate medical attention is needed
3. One quick recommendation

Keep response concise and practical.`;

    let fullResponse = '';
    
    const stream = hf.chatCompletionStream({
      model: 'meta-llama/Llama-3.1-70B-Instruct', // 70B - Much more powerful!
      messages: [
        {
          role: 'system',
          content: 'You are a helpful medical assistant. Provide concise, practical advice.'
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
 * Get medication information
 * @param {string} medicationName - Name of medication
 * @returns {Promise<Object>}
 */
export const getMedicationInfo = async (medicationName) => {
  try {
    const prompt = `Provide information about the medication: "${medicationName}"

Response in JSON format:
{
  "name": "medication name",
  "purpose": "what it's used for",
  "dosage": "typical dosage (general info only)",
  "sideEffects": ["common side effects"],
  "precautions": ["important precautions"],
  "interactions": ["common drug interactions"]
}`;

    let fullResponse = '';
    
    const stream = hf.chatCompletionStream({
      model: 'meta-llama/Llama-3.1-70B-Instruct', // 70B - Much more powerful!
      messages: [
        {
          role: 'system',
          content: 'You are a pharmaceutical information assistant. Provide accurate medication information in JSON format.'
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
        }
      }
    }

    const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse medication information');
    }

    const info = JSON.parse(jsonMatch[0]);
    info.disclaimer = 'This information is for educational purposes only. Always consult a healthcare provider before taking any medication.';
    
    return info;

  } catch (error) {
    console.error('Medication Info Error:', error);
    throw error;
  }
};

export default hf;
