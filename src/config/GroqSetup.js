import Groq from 'groq-sdk';
import 'dotenv/config';
import { MDtoText } from '../utils/utils.js';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Retry logic for Groq with exponential backoff
export const generateAIText = async (prompt, maxRetries = 3) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 1,
        stream: false,
      });

      return chatCompletion.choices[0].message.content;

    } catch (error) {
      const errorMessage = error?.message || 'Unknown error';

      // Rate limit (429)
      if (
        errorMessage.includes('429') ||
        errorMessage.toLowerCase().includes('rate limit')
      ) {
        if (attempt < maxRetries - 1) {
          const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          console.log(`Rate limit hit. Retrying in ${waitTime / 1000}s...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }
        return 'Error: Rate limit exceeded. Please wait a moment.';
      }

      // Service unavailable (503)
      if (
        errorMessage.includes('503') ||
        errorMessage.toLowerCase().includes('unavailable')
      ) {
        if (attempt < maxRetries - 1) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(
            `Attempt ${attempt + 1} failed (503). Retrying in ${
              waitTime / 1000
            }s...`
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }
      }

      // Final failure
      if (attempt === maxRetries - 1) {
        return `Error: ${errorMessage}`;
      }
    }
  }
};

// Test it out
const response = await generateAIText(
  'What is JS? Explain in simple terms'
);
console.log('Groq Response:', MDtoText(response));
