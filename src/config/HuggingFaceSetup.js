import { HfInference } from '@huggingface/inference';
import 'dotenv/config';

const hf = new HfInference(process.env.HUGGING_FACE_TOKEN);

/**
 * Generate text using Hugging Face models
 * @param {string} prompt - Input text prompt
 * @param {string} model - Model to use (default: meta-llama/Llama-3.2-3B-Instruct)
 * @returns {Promise<string>}
 */
export const generateText = async (prompt, model = 'meta-llama/Llama-3.2-3B-Instruct') => {
  try {
    let fullResponse = '';
    
    const stream = hf.chatCompletionStream({
      model: model,
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.7,
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
    console.error('Hugging Face API Error:', error);
    throw error;
  }
};

/**
 * Analyze sentiment of text
 * @param {string} text - Text to analyze
 * @returns {Promise<Array>}
 */
export const analyzeSentiment = async (text) => {
  try {
    const result = await hf.textClassification({
      model: 'distilbert-base-uncased-finetuned-sst-2-english',
      inputs: text,
    });
    return result;
  } catch (error) {
    console.error('Sentiment Analysis Error:', error);
    throw error;
  }
};

/**
 * Summarize text
 * @param {string} text - Text to summarize
 * @returns {Promise<string>}
 */
export const summarizeText = async (text) => {
  try {
    const result = await hf.summarization({
      model: 'facebook/bart-large-cnn',
      inputs: text,
      parameters: {
        max_length: 130,
        min_length: 30,
      },
    });
    return result.summary_text;
  } catch (error) {
    console.error('Summarization Error:', error);
    throw error;
  }
};

/**
 * Answer questions based on context
 * @param {string} question - Question to answer
 * @param {string} context - Context for the question
 * @returns {Promise<string>}
 */
export const answerQuestion = async (question, context) => {
  try {
    const result = await hf.questionAnswering({
      model: 'deepset/roberta-base-squad2',
      inputs: {
        question: question,
        context: context,
      },
    });
    return result.answer;
  } catch (error) {
    console.error('Question Answering Error:', error);
    throw error;
  }
};

/**
 * Analyze image (caption generation)
 * @param {string} imageUrl - URL or path to image
 * @returns {Promise<string>}
 */
export const captionImage = async (imageUrl) => {
  try {
    const result = await hf.imageToText({
      model: 'Salesforce/blip-image-captioning-base',
      data: await fetch(imageUrl).then(r => r.blob()),
    });
    return result.generated_text;
  } catch (error) {
    console.error('Image Captioning Error:', error);
    throw error;
  }
};

/**
 * Analyze image from file path
 * @param {string} prompt - Question about the image
 * @param {string} imagePath - Path to image file
 * @returns {Promise<string>}
 */
export const analyzeImageFromPath = async (prompt, imagePath) => {
  try {
    const fs = await import('fs');
    const imageBuffer = fs.readFileSync(imagePath);
    const blob = new Blob([imageBuffer]);
    
    const result = await hf.imageToText({
      model: 'Salesforce/blip-image-captioning-base',
      data: blob,
    });
    
    return `${prompt}\n\nAnswer: ${result.generated_text}`;
  } catch (error) {
    console.error('Image Analysis Error:', error);
    throw error;
  }
};

/**
 * Get image caption from file path
 * @param {string} imagePath - Path to image file
 * @returns {Promise<string>}
 */
export const captionImageFromPath = async (imagePath) => {
  try {
    const fs = await import('fs');
    const imageBuffer = fs.readFileSync(imagePath);
    const blob = new Blob([imageBuffer]);
    
    const result = await hf.imageToText({
      model: 'Salesforce/blip-image-captioning-base',
      data: blob,
    });
    
    return result.generated_text;
  } catch (error) {
    console.error('Image Captioning Error:', error);
    throw error;
  }
};

export default hf;
