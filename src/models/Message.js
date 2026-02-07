// models/Message.js
import mongoose, { Schema } from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'voice', 'location', 'file'],
      default: 'text',
    },
    content: {
      type: String,
    },
    image: {
      type: String,
    },
    // Voice message fields
    voiceUrl: {
      type: String,
    },
    voiceDuration: {
      type: Number, // Duration in seconds
    },
    voiceWaveform: {
      type: [Number], // Array of amplitude values for waveform visualization
      default: [],
    },
    voiceTranscription: {
      type: String, // Transcribed text from voice message
      default: '',
    },
    // Location message fields
    location: {
      latitude: {
        type: Number,
      },
      longitude: {
        type: Number,
      },
      address: {
        type: String, // Reverse geocoded address
      },
      placeName: {
        type: String, // Optional place name
      },
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

const Message = mongoose.model('Message', MessageSchema, 'messages');
export default Message;
// messages is the Collection Name
