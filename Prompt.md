# PLS EVALUATE THE ENTIRE BACKEND

### SERVER.JS 

```js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import authRoutes from './src/routes/authRoutes.js';
import ChatRoutes from './src/routes/ChatRoutes.js';
import UserRoutes from './src/routes/UserRoutes.js';
import cookieParser from 'cookie-parser';
import { connectDB } from './src/config/db.js';
import { initializesockeet } from './src/lib/socket.js';

dotenv.config();
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize websockets
initializesockeet(server);

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('Welcome to the Synapse Synchrony  API');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', UserRoutes);
app.use('/api/chat', ChatRoutes);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});

```

## Models

### Chat.js

```js
// models/Chat.js
import mongoose, { Schema } from 'mongoose';

const ChatSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    isGroup: {
      type: Boolean,
      default: false,
    },
    groupName: {
      type: String,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

const Chat = mongoose.model('Chat', ChatSchema, 'chats');
export default Chat;
// chats is the Collection Name

```

### Message.js

```js
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

```

### User.js

```js
// models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    name: {
      type: String,
      required: true,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,
    verificationToken: String,
    verificationTokenExpiresAt: Date,
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

const User = mongoose.model('User', UserSchema, 'users');
export default User;
// users is the Collection Name

```

## Controllers

### authController.js
```js
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto'; // Make sure to import the crypto module
import { HttpResponse } from '../utils/HttpResponse.js';
import {
  generateTokenandSetCookie,
  generateVerficationToken,
} from '../utils/utils.js';
import {
  sendVerificationEmail,
  sendWelcomeEmail,
} from '../Brevo/Brevoemail.js';

export const signup = async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name)
    return HttpResponse(res, 400, true, 'All fields are required');
  try {
    const UserAlreadyExists = await User.findOne({ email: email });
    if (UserAlreadyExists) {
      return HttpResponse(res, 409, true, 'User already exists');
    }
    const HashedPassword = await bcrypt.hash(password, 10);
    const VerficationToken = generateVerficationToken();
    const newUser = new User({
      email,
      password: HashedPassword,
      name,
      verificationToken: VerficationToken,
      verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 Hours
    });
    await newUser.save();

    // Save the user Cookie
    await generateTokenandSetCookie(res, newUser._id);
    await sendVerificationEmail(newUser.email, VerficationToken);

    return HttpResponse(res, 201, false, 'User registered successfully', {
      user: { ...newUser._doc, password: undefined },
      VerficationToken,
    });
  } catch (error) {
    console.error('Error during signup:', error);
    return HttpResponse(res, 500, true, 'Internal Server Error');
  }
};

export const VerifyEmail = async (req, res) => {
  const { code } = req.body;

  try {
    const user = await User.findOne({
      verificationToken: code,
      verificationTokenExpiresAt: { $gt: new Date() },
    });
    if (!user) {
      return HttpResponse(
        res,
        400,
        true,
        'Invalid or expired verification token'
      );
    }
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save();
    await sendWelcomeEmail(user.email, user.name);
    return HttpResponse(res, 200, false, 'Email verified successfully', {
      user: { ...user._doc, password: undefined },
    });
  } catch (error) {
    console.error('Error during email verification:', error);
    return HttpResponse(res, 500, true, 'Internal Server Error');
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return HttpResponse(res, 400, true, 'Email and Password are required');
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return HttpResponse(res, 404, true, 'User not found');
    }
    const IsPasswordValid = await bcrypt.compare(password, user.password);
    if (!IsPasswordValid) {
      return HttpResponse(res, 401, true, 'Invalid credentials');
    }
    generateTokenandSetCookie(res, user._id);
    user.lastLogin = new Date();
    await user.save();
    return HttpResponse(res, 200, false, 'Login Successful', {
      user: { ...user._doc, password: undefined },
    });
  } catch (error) {
    console.error('Error during login:', error);
    return HttpResponse(res, 500, true, 'Internal Server Error');
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie('token');
    return HttpResponse(res, 200, false, 'Logged out successfully');
  } catch (error) {
    console.error('Error during logout:', error);
    return HttpResponse(res, 500, true, 'Internal Server Error');
  }
};

export const ForgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: 'User not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiresAt = resetTokenExpiresAt;

    await user.save();

    // send email
    // await sendPasswordResetEmail(
    //   user.email,
    //   `${process.env.CLIENT_URL}/reset-password/${resetToken}`
    // );

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email',
    });
  } catch (error) {
    console.log('Error in forgotPassword ', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const ResetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) return HttpResponse(res, 400, true, 'Token is required');
    const { password } = req.body;
    if (!password) return HttpResponse(res, 400, true, 'Password is required');
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiresAt: { $gt: new Date() },
    });
    if (!user) return HttpResponse(res, 400, true, 'Invalid or expired token');
    // Update the password, the user data and save those to the DB
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();
    // await sendResetSuccessEmail(user.email);
    return HttpResponse(res, 200, false, 'Password reset successful', user);
  } catch (error) {
    console.error('Error during password reset:', error);
    return HttpResponse(res, 500, true, 'Internal Server Error');
  }
};

export const CheckAuth = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.userId });
    if (!user) return HttpResponse(res, 404, true, 'User not found');
    return HttpResponse(
      res,
      200,
      false,
      'User Successfully Fetched and Authenticated',
      {
        user: { ...user._doc, password: undefined },
      }
    );
  } catch (error) {
    console.error('Error during auth check:', error);
    return HttpResponse(res, 500, true, 'Internal Server Error');
  }
};

```


### ChatController.js

```js
import { emitNewChatToParticipants } from '../lib/socket.js';
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

```


### MessageController.js

```js
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

```


### UserController.js
```js
import User from '../models/User.js';
import { HttpResponse } from '../utils/HttpResponse.js';

export const GetAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    return HttpResponse(res, 200, false, 'Users Retrieved Successfully', users);
  } catch (error) {
    console.error(error);
    return HttpResponse(res, 500, true, 'Internal Server Error');
  }
};

```

## Routes

### authRoutes.js

```js
import express from 'express';
import { HttpResponse } from '../utils/HttpResponse.js';
import {
  CheckAuth,
  ForgotPassword,
  login,
  logout,
  ResetPassword,
  signup,
  VerifyEmail,
} from '../controllers/authController.js';
import { VerifyToken } from '../middlewares/VeriyToken.js';

const router = express.Router();
router.get('/check-auth', VerifyToken, CheckAuth);
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/verify-email', VerifyEmail);
router.post('/forgot-password', ForgotPassword);
router.post('/reset-password/:token', ResetPassword);
export default router;
```

### ChatRoutes.js

```js
import express from 'express';

import { VerifyToken } from '../middlewares/VeriyToken.js';
import {
  CreateChat,
  GetSingleChat,
  GetUserChats,
} from '../controllers/ChatController.js';
import { CreateMessage } from '../controllers/MessageController.js';

const router = express.Router();

router.post('/create-chat', VerifyToken, CreateChat);
router.post('/create-message', VerifyToken, CreateMessage);
router.get('/get-user-chats', VerifyToken, GetUserChats);
router.get('/get-single-chat/:id', VerifyToken, GetSingleChat);

export default router;
```

### UserRoutes.js

```js
import express from 'express';
import { HttpResponse } from '../utils/HttpResponse.js';
import { GetAllUsers } from '../controllers/UserController.js';
import { VerifyToken } from '../middlewares/VeriyToken.js';


const router = express.Router();

router.get('/get-users', VerifyToken, GetAllUsers);


export default router;
```

## Config

### cloudinary.js

```js
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

```

### db.js

```js
// src/config/db.js

import mongoose from 'mongoose';

export const connectDB = async (req, res) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MONGODB CONNECTED SUCCESSFULLY ✅');
  } catch (error) {
    console.log('ERROR CONNECTING TO MONGODB', error);
    process.exit(1); // Exit with failure
  }
};
```

## Brevo

### Brevo.config.js
```js
import SibApiV3Sdk from 'sib-api-v3-sdk'; 
import dotenv from 'dotenv';

dotenv.config(); 


const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY; 

// Create an instance of the transactional email API
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

export { apiInstance };

```

### Brevoemail.js
```js
// import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
import {
  VERIFICATION_EMAIL_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
} from '../mailtrap/emailTemplates.js';

export const sendVerificationEmail = async (email, verificationToken) => {
  const apiKey = process.env.BREVO_API_KEY;
  const url = 'https://api.brevo.com/v3/smtp/email';

  const emailData = {
    sender: {
      name: 'Farhan Tahsin Khan',
      email: 'farhankhan@iut-dhaka.edu',
    },
    to: [
      {
        email: email, // Fix: Directly pass the email here, not an object
      },
    ],
    subject: 'Verify Email',
    htmlContent: VERIFICATION_EMAIL_TEMPLATE.replace(
      '{verificationCode}',
      verificationToken
    ),
  };

  try {
    const response = await axios.post(url, emailData, {
      headers: {
        'Content-Type': 'application/json',
        'api-Key': apiKey,
      },
    });
    console.log('Email sent successfully:', response.data);
  } catch (error) {
    console.error('Error sending test email:', error);
  }
};

// Send Welcome Email via Brevo (Sendinblue)
export const sendWelcomeEmail = async (email, name) => {
  const apiKey = process.env.BREVO_API_KEY;
  const url = 'https://api.brevo.com/v3/smtp/email';

  // Hardcoded company information
  const companyInfo = {
    name: 'Synchronous Synapse',
    address: 'Islamic University of Technology, IUT',
    city: 'Gazipur',
    zipCode: '1207',
    country: 'Bangladesh',
  };

  // Replace the placeholders in the template with actual values
  const emailData = {
    sender: {
      name: 'Farhan Tahsin Khan',
      email: 'farhankhan@iut-dhaka.edu',
    },
    to: [
      {
        email: email,
      },
    ],
    subject: 'Welcome to Our App!',
    htmlContent: WELCOME_EMAIL_TEMPLATE.replace('{name}', name)
      .replace('{company_info_name}', companyInfo.name)
      .replace('{company_info_address}', companyInfo.address)
      .replace('{company_info_city}', companyInfo.city)
      .replace('{company_info_zip_code}', companyInfo.zipCode)
      .replace('{company_info_country}', companyInfo.country),
  };

  try {
    const response = await axios.post(url, emailData, {
      headers: {
        'Content-Type': 'application/json',
        'api-Key': apiKey,
      },
    });
    console.log('Welcome email sent successfully:', response.data);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw new Error(`Error sending welcome email: ${error}`);
  }
};

// Call the function with example email and verification token
// sendVerificationEmail('ayon55928@gmail.com', 'Farhan Tahsin Khan');

```


## Lib

### socket.js
```js
import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { validateChatParticipant } from '../controllers/ChatController';

let io = null;
const onlineUsers = new Map();

export const initializesockeet = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const rawCookie = socket.handshake.headers.cookie;
      if (!rawCookie) {
        console.log('No cookie found, disconnecting');
        socket.disconnect(true);
        return;
      }

      const token = rawCookie.split('=')?.[1]?.trim();
      if (!token) {
        console.log('No token found, disconnecting');
        socket.disconnect(true);
        return;
      }

      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      if (!decodedToken) {
        console.log('Invalid token, disconnecting');
        socket.disconnect(true);
        return;
      }

      socket.userId = decodedToken.userId;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      socket.disconnect(true); // Disconnect the socket if authentication fails
    }
  });

  io.on('connection', (socket) => {
    if (!socket.userId) {
      socket.disconnect(true); // Disconnect if userId is not present
      return;
    }
    const userId = socket.userId;
    const newSocketId = socket.id;

    console.log('Socket connected ', { userId, newSocketId });

    // Register Socket for the User
    onlineUsers.set(userId, newSocketId);

    // Emit the list of online users
    io.emit('online:users', Array.from(onlineUsers.keys()));

    // Create personal room for user
    socket.join(`user:${userId}`);

    socket.on('chat:join', async (chatId, callback) => {
      try {
        await validateChatParticipant(chatId, userId);
        socket.join(`chat:${chatId}`);
        console.log(`User ${userId} joined room chat:${chatId}`);
        callback?.();
      } catch (error) {
        console.error(`Error joining chat: ${error.message}`);
        callback?.(`Error joining chat: ${error.message}`);
      }
    });

    socket.on('chat:leave', (chatId) => {
      if (chatId) {
        socket.leave(`chat:${chatId}`);
        console.log(`User ${userId} left room chat:${chatId}`);
      }
    });

    // Disconnect logic when the socket disconnects
    socket.on('disconnect', () => {
      if (onlineUsers.get(userId) === newSocketId) {
        onlineUsers.delete(userId);
        io.emit('online:users', Array.from(onlineUsers.keys()));
      }
      console.log('socket disconnected', { userId, newSocketId });
    });
  });
};

// Helper to get IO instance
function getIO() {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

// Emit new chat to participants
export const emitNewChatToParticipants = (participants, chat) => {
  const io = getIO();
  for (const participantId of participants) {
    // Changed to use 'participants' parameter
    io.to(`user:${participantId}`).emit('chat:new', chat);
  }
};

// Emit new message to chat room
export const emitNewMessageToChatRoom = (senderId, chatId, message) => {
  const io = getIO();
  const senderSocketId = onlineUsers.get(senderId?.toString());

  console.log(senderId, 'senderId');
  console.log(senderSocketId, 'sender socketId exists');
  console.log('All online users:', Object.fromEntries(onlineUsers));

  if (senderSocketId) {
    io.to(`chat:${chatId}`).except(senderSocketId).emit('message:new', message); // Sender is excluded from receiving their own message
  } else {
    io.to(`chat:${chatId}`).emit('message:new', message); // Broadcast to the chat if sender is offline
  }
};

// Emit last message update to participants
export const emitLastMessageToParticipants = (
  participantIds,
  chatId,
  lastMessage
) => {
  const io = getIO();
  const payload = { chatId, lastMessage };

  for (const participantId of participantIds) {
    io.to(`user:${participantId}`).emit('chat:update', payload);
  }
};

```

## MiddleWares

### VerifyToken.js

```js
import jwt from 'jsonwebtoken';
import { HttpResponse } from '../utils/HttpResponse.js';
export const VerifyToken = (req, res, next) => {
  const token = req.cookies.token;
  console.log('Token from cookies:', token);
  if (!token)
    return HttpResponse(res, 401, true, 'Unauthorized: No token provided');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded)
      return HttpResponse(res, 401, true, 'Unauthorized: Invalid token');
    req.userId = decoded.id;
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

```

## Utils

### HttpResponse.js

```js
export const HttpResponse = (res, status, error, message, data = []) => {
  return res.status(status).json({
    error,
    message,
    data,
  });
};
```


### ImagetoBase64.js

```js
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

```

### utils.js

```js
import jwt from 'jsonwebtoken';
export const generateVerficationToken = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateTokenandSetCookie = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  res.cookie('token', token, {
    httpOnly: true, // XSS Attack protection
    secure: process.env.NODE_ENV === 'production' ? true : false, // Set to false in local environment
    sameSite: 'strict', // CSRF Attack protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return token;
};

```