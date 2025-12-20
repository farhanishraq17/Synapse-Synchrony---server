import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate text using Gemini (20 requests/day free tier)
 * @param {string} prompt
 * @param {number} maxRetries
 * @returns {Promise<string>}
 */
export const generateAIText = async (prompt, maxRetries = 3) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash-lite',
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();

    } catch (error) {
      const errorMessage = error?.message || 'Unknown error';

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

      // Rate limit / quota (429)
      if (
        errorMessage.includes('429') ||
        errorMessage.toLowerCase().includes('quota')
      ) {
        console.log('⚠️ Rate limit hit. Please wait before trying again.');
        return 'Error: Rate limit exceeded. Please wait a moment and try again.';
      }

      // Final failure
      if (attempt === maxRetries - 1) {
        return `Error: ${errorMessage}`;
      }
    }
  }
};

/**
 * Generate text with image input
 * @param {string} prompt
 * @param {string} imageBase64
 * @param {string} mimeType
 * @param {number} maxRetries
 * @returns {Promise<string>}
 */
export const generateAITextWithImage = async (
  prompt,
  imageBase64,
  mimeType = 'image/jpeg',
  maxRetries = 3
) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash-lite',
      });

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBase64,
            mimeType,
          },
        },
      ]);

      const response = await result.response;
      return response.text();

    } catch (error) {
      const errorMessage = error?.message || 'Unknown error';

      // Service unavailable (503)
      if (
        errorMessage.includes('503') ||
        errorMessage.toLowerCase().includes('unavailable')
      ) {
        if (attempt < maxRetries - 1) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(
            `Vision attempt ${attempt + 1} failed (503). Retrying in ${
              waitTime / 1000
            }s...`
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }
      }

      // Rate limit / quota (429)
      if (
        errorMessage.includes('429') ||
        errorMessage.toLowerCase().includes('quota')
      ) {
        console.log('⚠️ Rate limit hit. Please wait before trying again.');
        return 'Error: Rate limit exceeded. Please wait a moment and try again.';
      }

      // Final failure
      if (attempt === maxRetries - 1) {
        return `Error: ${errorMessage}`;
      }
    }
  }
};

/**
 * Analyze image from file path (testing utility)
 * @param {string} prompt
 * @param {string} imagePath
 * @returns {Promise<string>}
 */
export const analyzeImageFromPath = async (prompt, imagePath) => {
  const fs = await import('fs');

  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  const ext = imagePath.split('.').pop().toLowerCase();
  const mimeTypes = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  };

  const mimeType = mimeTypes[ext] || 'image/jpeg';

  return await generateAITextWithImage(prompt, base64Image, mimeType);
};

/**
 * Get image caption from file path
 * @param {string} imagePath
 * @returns {Promise<string>}
 */
export const captionImageFromPath = async (imagePath) => {
  const prompt =
    'Describe this image in detail. Include objects, colors, setting, and notable features.';
  return await analyzeImageFromPath(prompt, imagePath);
};
