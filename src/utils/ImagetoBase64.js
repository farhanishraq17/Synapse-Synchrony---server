import fs from 'fs/promises';
import path from 'path';

/**
 * Converts an image file to a Base64 string
 * @param {string} filePath - Path to the image file
 * @returns {Promise<string>} - Base64 encoded string
 */
export const imageToBase64 = async (filePath) => {
  try {
    // Read file as a buffer
    const buffer = await fs.readFile(filePath);

    // Get the file extension to determine the MIME type (e.g., image/jpeg)
    const ext = path.extname(filePath).substring(1);
    const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

    // Convert buffer to base64 string
    const base64String = buffer.toString('base64');

    // Return the full data URI string
    return `data:${mimeType};base64,${base64String}`;
  } catch (error) {
    console.error('Error converting image to Base64:', error);
    throw error;
  }
};
