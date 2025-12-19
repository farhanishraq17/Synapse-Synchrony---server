// models/Message.js
import mongoose, { Schema } from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    content: {
      type: String,
    },
    image: {
      type: String,
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
