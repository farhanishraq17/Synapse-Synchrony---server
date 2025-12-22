import { emitNewChatToParticipants } from '../lib/socket.js';
import { generateStreamToken } from '../lib/stream.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { HttpResponse } from '../utils/HttpResponse.js';

export const CreateChat = async (req, res) => {
  const { participants, isGroup, groupName, participantID } = req.body;

  // Validate participants or participantID
  if (!(participants?.length || participantID))
    return HttpResponse(
      res,
      400,
      true,
      'Either Participants or ParticipantID is needed'
    );

  const createdBy = req.userId;

  try {
    // Check if the createdBy user exists
    const existingCreateUser = await User.findOne({ _id: createdBy });
    if (!existingCreateUser)
      return HttpResponse(res, 404, true, 'User (Creating) not Found');

    // Create Chat Cond1
    if (isGroup && groupName && participants?.length) {
      const allParticipantIds = [createdBy, ...participants];
      const chat = await Chat.create({
        participants: allParticipantIds,
        isGroup,
        groupName,
        createdBy,
      });
      return HttpResponse(res, 200, false, 'Chat Created Successfully', chat);
    }
    // Create Chat Cond2
    else {
      const allParticipantIds = [createdBy, participantID];
      // Check if such a chat already exits. If yes, send that chat back instead of creating a new one
      const existingChat = await Chat.findOne({
        participants: {
          $all: allParticipantIds,
          $size: 2,
        },
      });
      if (existingChat)
        return HttpResponse(
          res,
          200,
          false,
          'Chat Already exists. Retrieved successfully',
          existingChat
        );
      const chat = await Chat.create({
        participants: allParticipantIds,
        createdBy,
      });

      // Implement Websocket
      const populatedChat = await chat?.populate('participants', 'name avatar');
      const participantIdStrings = populatedChat?.participants.map((p) => {
        return p._id?.toString();
      });

      emitNewChatToParticipants(participantIdStrings, populatedChat);

      return HttpResponse(res, 200, false, 'Chat Created Successfully', chat);
    }
  } catch (error) {
    console.error(error);
    return HttpResponse(res, 500, true, 'Internal Server Error');
  }
};

export const GetUserChats = async (req, res) => {
  const userId = req.userId;
  try {
    const chats = await Chat.find({
      participants: {
        $in: [userId],
      },
    })
      .populate('participants', 'name avatar')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'name avatar',
        },
      })
      .sort({ updatedAt: -1 });

    // Include chats in the response
    return HttpResponse(
      res,
      200,
      false,
      'Retrieved User Chats Successfully',
      chats
    );
  } catch (error) {
    console.error(error);
    return HttpResponse(res, 500, true, 'Internal Server Error');
  }
};

export const GetSingleChat = async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  try {
    const chat = await Chat.findOne({
      _id: id,
      participants: { $in: [userId] },
    })
      .populate('participants', 'name avatar')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'name avatar',
        },
      });

    if (!chat) {
      return HttpResponse(res, 404, true, 'Chat Not Found');
    }

    const messages = await Message.find({ chatId: id })
      .populate('sender', 'name avatar')
      .populate({
        path: 'replyTo',
        select: 'content image sender',
        populate: {
          path: 'sender',
          select: 'name avatar',
        },
      })
      .sort({ createdAt: 1 });

    return HttpResponse(res, 200, false, 'Chat Retrieved Successfully', {
      chat,
      messages,
    });
  } catch (error) {
    console.error(error);
    return HttpResponse(res, 500, true, 'Internal Server Error');
  }
};

export const validateChatParticipant = async (chatId, userId) => {
  const chat = await Chat.findOne({
    _id: chatId,
    participants: {
      $in: [userId],
    },
  });
  if (!chat)
    return HttpResponse(res, 400, true, 'User not a participant in this chat');
  return chat;
};

export async function getStreamToken(req, res) {
  try {
    const token = generateStreamToken(req.userId);

    res.status(200).json({ token });
  } catch (error) {
    console.log('Error in getStreamToken controller:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
