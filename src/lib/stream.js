import { StreamChat } from 'stream-chat';
import 'dotenv/config';

// ✅ FIXED: STEAM → STREAM typo
const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

if (!apiKey || !apiSecret) {
  console.error('Stream API key or Secret is missing');
  console.error(
    'Make sure STREAM_API_KEY and STREAM_API_SECRET are set in .env'
  );
}

const streamClient = StreamChat.getInstance(apiKey, apiSecret);

export const upsertStreamUser = async (userData) => {
  try {
    await streamClient.upsertUsers([userData]);
    console.log('Stream user upserted:', userData.id);
    return userData;
  } catch (error) {
    console.error('Error upserting Stream user:', error);
    throw error; // Re-throw so caller knows it failed
  }
};

export const generateStreamToken = (userId) => {
  try {
    // Ensure userId is a string
    const userIdStr = userId.toString();
    const token = streamClient.createToken(userIdStr);
    return token;
  } catch (error) {
    console.error('Error generating Stream token:', error);
    throw error;
  }
};

export default streamClient;
