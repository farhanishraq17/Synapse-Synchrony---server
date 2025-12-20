import mongoose from 'mongoose';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import { HttpResponse } from '../utils/HttpResponse.js';
import cloudinary from '../config/cloudinary.js';
import {
  emitLastMessageToParticipants,
  emitNewMessageToChatRoom,
} from '../lib/socket.js';

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
