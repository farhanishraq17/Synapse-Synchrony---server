import mongoose from 'mongoose';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import { HttpResponse } from '../utils/HttpResponse.js';
import cloudinary from '../config/cloudinary.js';
import {
  emitLastMessageToParticipants,
  emitNewMessageToChatRoom,
  emitNewChatToParticipants,
} from '../lib/socket.js';
import User from '../models/User.js';
import { generateAIText, groq } from '../config/GroqSetup.js';
import fs from 'fs';
import path from 'path';

export const CreateMessage = async (req, res) => {
  const userId = req.userId;
  const { chatId, content, image, replyTo } = req.body;
  if (!(content || image))
    return HttpResponse(res, 400, true, 'Either Content or Image is required');
  try {
    const chat = await Chat.findOne({
      _id: chatId,
      participants: {
        $in: [userId],
      },
    });
    if (!chat)
      return HttpResponse(res, 404, true, 'Chat Not Found OR Unauthorized');
    if (replyTo) {
      const replyMessage = await Message.findOne({
        _id: replyTo,
        chatId,
      });
      if (!replyMessage)
        return HttpResponse(res, 404, true, 'Reply to Message Not Found');
    }
    let imageUrl;
    if (image) {
      try {
        const uploadRes = await cloudinary.uploader.upload(image, {
          folder: 'chat_messages',
          resource_type: 'auto',
        });
        imageUrl = uploadRes.secure_url;
      } catch (uploadErr) {
        console.error('Cloudinary Upload Error:', uploadErr);
        return HttpResponse(res, 500, true, 'Image upload failed');
      }
    }
    const newmessage = await Message.create({
      chatId,
      sender: userId,
      content: content,
      image: imageUrl,
      replyTo: replyTo || null,
    });
    await newmessage.populate([
      { path: 'sender', select: 'name avatar' },
      {
        path: 'replyTo',
        select: 'content image sender',
        populate: {
          path: 'sender',
          select: 'name avatar',
        },
      },
    ]);
    chat.lastMessage = newmessage._id;
    await chat.save();

    // Websocket emit the New Message to the Chat Room
    emitNewMessageToChatRoom(userId, chatId, newmessage);

    // Websocket emit the Last Message to the Participants
    const allParticipantIds = chat.participants.map((id) => id.toString());
    emitLastMessageToParticipants(allParticipantIds, chatId, newmessage);

    return HttpResponse(
      res,
      201,
      false,
      'Message Created Successfully',
      newmessage
    );
  } catch (error) {
    console.error(error);
    return HttpResponse(res, 500, true, 'Internal Server Error');
  }
};




/**
 * 🤖 Send Message to AI and Get Response
 * 
 * This endpoint allows users to send messages to Whoop AI and receive AI-generated responses.
 * 
 * Flow:
 * 1. User sends message to AI (creates user message)
 * 2. Check if chat with AI exists, create if not
 * 3. Generate AI response using Groq
 * 4. Create AI response message
 * 5. Emit both messages via Socket.IO
 * 
 * @route POST /api/chat/send-ai-message
 * @body { content: string, chatId?: string }
 */
export const SendAIMessage = async (req, res) => {
  const userId = req.userId;
  const { content, chatId } = req.body;

  // Validate input
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return HttpResponse(res, 400, true, 'Message content is required');
  }

  try {
    console.log('🤖 AI Message Request:', { userId, chatId, content: content.substring(0, 50) });

    // ✅ Step 1: Get Whoop AI user
    const whoopAI = await User.findOne({ isAI: true });
    if (!whoopAI) {
      console.error('❌ Whoop AI user not found in database');
      return HttpResponse(
        res,
        500,
        true,
        'AI service not available. Please contact support.'
      );
    }

    console.log('✅ Whoop AI found:', whoopAI._id);

    // ✅ Step 2: Get or create chat with AI
    let chat;
    if (chatId) {
      // Validate existing chat
      chat = await Chat.findOne({
        _id: chatId,
        participants: {
          $all: [userId, whoopAI._id],
        },
      });

      if (!chat) {
        return HttpResponse(
          res,
          404,
          true,
          'Chat not found or you are not authorized'
        );
      }
    } else {
      // Check if chat with AI already exists
      chat = await Chat.findOne({
        participants: {
          $all: [userId, whoopAI._id],
          $size: 2,
        },
        isGroup: false,
      });

      // Create new chat if doesn't exist
      if (!chat) {
        console.log('Creating new chat with AI...');
        chat = await Chat.create({
          participants: [userId, whoopAI._id],
          createdBy: userId,
          isGroup: false,
        });

        // Populate and emit new chat to both participants
        const populatedChat = await chat.populate('participants', 'name avatar');
        const participantIds = [userId.toString(), whoopAI._id.toString()];
        emitNewChatToParticipants(participantIds, populatedChat);

        console.log('✅ New AI chat created:', chat._id);
      }
    }

    console.log('💬 Using chat:', chat._id);

    // ✅ Step 3: Create user's message
    const userMessage = await Message.create({
      chatId: chat._id,
      sender: userId,
      content: content.trim(),
    });

    await userMessage.populate('sender', 'name avatar');

    // Update chat's last message
    chat.lastMessage = userMessage._id;
    await chat.save();

    // Emit user message to chat room
    emitNewMessageToChatRoom(userId, chat._id.toString(), userMessage);

    // Emit last message update
    const participantIds = chat.participants.map((id) => id.toString());
    emitLastMessageToParticipants(participantIds, chat._id.toString(), userMessage);

    console.log('✅ User message created:', userMessage._id);

    // ✅ Step 4: Generate AI response using Groq
    console.log('🧠 Generating AI response...');
    const aiResponseText = await generateAIText(content);

    if (!aiResponseText || aiResponseText.startsWith('Error:')) {
      console.error('❌ AI generation failed:', aiResponseText);
      
      // Send fallback message
      const fallbackMessage = await Message.create({
        chatId: chat._id,
        sender: whoopAI._id,
        content: 'Sorry, I encountered an error processing your request. Please try again in a moment.',
      });

      await fallbackMessage.populate('sender', 'name avatar');

      // Update chat's last message
      chat.lastMessage = fallbackMessage._id;
      await chat.save();

      // Emit AI fallback message
      emitNewMessageToChatRoom(whoopAI._id, chat._id.toString(), fallbackMessage);
      emitLastMessageToParticipants(participantIds, chat._id.toString(), fallbackMessage);

      return HttpResponse(
        res,
        200,
        false,
        'Message sent, but AI response failed',
        {
          userMessage,
          aiMessage: fallbackMessage,
          chat: { _id: chat._id },
        }
      );
    }

    console.log('✅ AI response generated:', aiResponseText.substring(0, 100));

    // ✅ Step 5: Create AI response message
    const aiMessage = await Message.create({
      chatId: chat._id,
      sender: whoopAI._id,
      content: aiResponseText,
      replyTo: userMessage._id, // Link AI response to user's message
    });

    await aiMessage.populate([
      { path: 'sender', select: 'name avatar' },
      {
        path: 'replyTo',
        select: 'content sender',
        populate: {
          path: 'sender',
          select: 'name avatar',
        },
      },
    ]);

    // Update chat's last message to AI response
    chat.lastMessage = aiMessage._id;
    await chat.save();

    // Emit AI message to chat room
    emitNewMessageToChatRoom(whoopAI._id, chat._id.toString(), aiMessage);

    // Emit last message update with AI response
    emitLastMessageToParticipants(participantIds, chat._id.toString(), aiMessage);

    console.log('✅ AI message created:', aiMessage._id);

    // ✅ Step 6: Return both messages
    return HttpResponse(
      res,
      201,
      false,
      'AI response generated successfully',
      {
        userMessage,
        aiMessage,
        chat: {
          _id: chat._id,
          participants: chat.participants,
        },
      }
    );
  } catch (error) {
    console.error('❌ Error in SendAIMessage:', error);
    return HttpResponse(res, 500, true, 'Internal Server Error', {
      error: error.message,
    });
  }
};

/**
 * 🔍 Get or Create AI Chat
 * 
 * This endpoint returns the existing chat with Whoop AI or creates a new one.
 * Useful for frontend to get the chatId before sending messages.
 * 
 * @route GET /api/chat/ai-chat
 */
export const GetOrCreateAIChat = async (req, res) => {
  const userId = req.userId;

  try {
    // Get Whoop AI user
    const whoopAI = await User.findOne({ isAI: true });
    if (!whoopAI) {
      return HttpResponse(res, 500, true, 'AI service not available');
    }

    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: {
        $all: [userId, whoopAI._id],
        $size: 2,
      },
      isGroup: false,
    })
      .populate('participants', 'name avatar')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'name avatar',
        },
      });

    // Create new chat if doesn't exist
    if (!chat) {
      chat = await Chat.create({
        participants: [userId, whoopAI._id],
        createdBy: userId,
        isGroup: false,
      });

      // Populate the newly created chat
      chat = await Chat.findById(chat._id)
        .populate('participants', 'name avatar')
        .populate({
          path: 'lastMessage',
          populate: {
            path: 'sender',
            select: 'name avatar',
          },
        });

      console.log('✅ New AI chat created:', chat._id);
    }

    return HttpResponse(
      res,
      200,
      false,
      'AI chat retrieved successfully',
      chat
    );
  } catch (error) {
    console.error('Error in GetOrCreateAIChat:', error);
    return HttpResponse(res, 500, true, 'Internal Server Error');
  }
};

/**
 * 🎤 Create Voice Message
 * 
 * This endpoint handles voice message uploads, stores them in Cloudinary,
 * and creates a voice message in the database.
 * 
 * @route POST /api/chat/create-voice-message
 * @body { chatId: string, replyTo?: string }
 * @file audio file (multipart/form-data)
 */
export const CreateVoiceMessage = async (req, res) => {
  const userId = req.userId;
  const { chatId, replyTo } = req.body;
  const audioFile = req.file;

  console.log('🎤 Voice message request:', { userId, chatId, hasFile: !!audioFile });

  // Validate inputs
  if (!chatId) {
    return HttpResponse(res, 400, true, 'Chat ID is required');
  }

  if (!audioFile) {
    return HttpResponse(res, 400, true, 'Audio file is required');
  }

  try {
    // Verify user is participant in chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: {
        $in: [userId],
      },
    });

    if (!chat) {
      return HttpResponse(res, 404, true, 'Chat Not Found OR Unauthorized');
    }

    // Verify replyTo message if provided
    if (replyTo) {
      const replyMessage = await Message.findOne({
        _id: replyTo,
        chatId,
      });
      if (!replyMessage) {
        return HttpResponse(res, 404, true, 'Reply to Message Not Found');
      }
    }

    console.log('📤 Uploading audio to Cloudinary...');

    // Upload audio to Cloudinary
    let voiceUrl;
    let duration = 0;
    try {
      const uploadRes = await cloudinary.uploader.upload(audioFile.path, {
        folder: 'synapse/voice-messages',
        resource_type: 'video', // Cloudinary uses 'video' for audio files
        format: 'mp3', // Convert to MP3 for consistency
      });

      voiceUrl = uploadRes.secure_url;
      duration = uploadRes.duration || 0;

      console.log('✅ Audio uploaded:', { url: voiceUrl, duration });
    } catch (uploadErr) {
      console.error('Cloudinary Upload Error:', uploadErr);
      return HttpResponse(res, 500, true, 'Audio upload failed');
    }

    // 🎙️ Perform transcription using Groq Whisper
    let transcription = '';
    // Append extension to help Groq detect format (e.g., .webm or .mp3)
    const tempFilePath = audioFile.path + (path.extname(audioFile.originalname) || '.webm');

    try {
      // Rename file to include extension
      if (fs.existsSync(audioFile.path)) {
        fs.renameSync(audioFile.path, tempFilePath);
      }
      
      console.log('🎙️ Transcribing audio with Groq...', { tempFilePath });
      
      const transcriptionCompletion = await groq.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-large-v3', // or 'whisper-large-v3-turbo' if available for speed
        response_format: 'json',
        language: 'en', // Optional: defaulting to English or auto-detect
      });
      
      transcription = transcriptionCompletion.text || '';
      console.log('✅ Transcription Result:', transcription);
    } catch (transcriptionError) {
      console.error('⚠️ Transcription failed DETAILS:', {
        message: transcriptionError.message,
        name: transcriptionError.name,
      });
    } finally {
      // Cleanup: Delete the temp file
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
          console.log('🧹 Cleaned up temp file:', tempFilePath);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError);
      }
    }

    // Create voice message
    const newMessage = await Message.create({
      chatId,
      sender: userId,
      messageType: 'voice',
      voiceUrl,
      voiceDuration: Math.round(duration),
      voiceTranscription: transcription,
      replyTo: replyTo || null,
    });

    await newMessage.populate([
      { path: 'sender', select: 'name avatar' },
      {
        path: 'replyTo',
        select: 'content image voiceUrl voiceDuration messageType sender',
        populate: {
          path: 'sender',
          select: 'name avatar',
        },
      },
    ]);

    // Update chat's last message
    chat.lastMessage = newMessage._id;
    await chat.save();

    console.log('✅ Voice message created:', newMessage._id);

    // Websocket emit the New Message to the Chat Room
    emitNewMessageToChatRoom(userId, chatId, newMessage);

    // Websocket emit the Last Message to the Participants
    const allParticipantIds = chat.participants.map((id) => id.toString());
    emitLastMessageToParticipants(allParticipantIds, chatId, newMessage);

    return HttpResponse(
      res,
      201,
      false,
      'Voice Message Created Successfully',
      newMessage
    );
  } catch (error) {
    console.error('Error creating voice message:', error);
    return HttpResponse(res, 500, true, 'Internal Server Error');
  }
};

export const CreateLocationMessage = async (req, res) => {
  const userId = req.userId;
  const { chatId, latitude, longitude, address, placeName, content, replyTo } = req.body;

  // Validate required fields
  if (!latitude || !longitude) {
    return HttpResponse(res, 400, true, 'Latitude and longitude are required');
  }

  if (!chatId) {
    return HttpResponse(res, 400, true, 'Chat ID is required');
  }

  try {
    // Verify chat exists and user is a participant
    const chat = await Chat.findOne({
      _id: chatId,
      participants: { $in: [userId] },
    });

    if (!chat) {
      return HttpResponse(res, 404, true, 'Chat Not Found OR Unauthorized');
    }

    // Verify replyTo message if provided
    if (replyTo) {
      const replyMessage = await Message.findOne({
        _id: replyTo,
        chatId,
      });
      if (!replyMessage) {
        return HttpResponse(res, 404, true, 'Reply to Message Not Found');
      }
    }

    // Create location message
    const newMessage = await Message.create({
      chatId,
      sender: userId,
      messageType: 'location',
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address: address || '',
        placeName: placeName || '',
      },
      content: content || '', // Optional message text
      replyTo: replyTo || null,
    });

    // Populate sender and replyTo
    await newMessage.populate([
      { path: 'sender', select: 'name avatar' },
      {
        path: 'replyTo',
        select: 'content image voiceUrl voiceDuration location messageType sender',
        populate: {
          path: 'sender',
          select: 'name avatar',
        },
      },
    ]);

    // Update chat's last message
    chat.lastMessage = newMessage._id;
    await chat.save();

    console.log('✅ Location message created:', newMessage._id);

    // Websocket emit the New Message to the Chat Room
    emitNewMessageToChatRoom(userId, chatId, newMessage);

    // Websocket emit the Last Message to the Participants
    const allParticipantIds = chat.participants.map((id) => id.toString());
    emitLastMessageToParticipants(allParticipantIds, chatId, newMessage);

    return HttpResponse(
      res,
      201,
      false,
      'Location Message Created Successfully',
      newMessage
    );
  } catch (error) {
    console.error('Error creating location message:', error);
    return HttpResponse(res, 500, true, 'Internal Server Error');
  }
};
