import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import authRoutes from './src/routes/authRoutes.js';
import ChatRoutes from './src/routes/ChatRoutes.js';
import UserRoutes from './src/routes/UserRoutes.js';
import EventRoutes from './src/routes/EventRoutes.js';
import BlogRoutes from './src/routes/BlogRoutes.js';
import MedilinkRoutes from './src/routes/MedilinkRoutes.js';
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
app.use('/api/portal/events', EventRoutes);
app.use('/api/portal/blogs', BlogRoutes);
app.use('/api/medilink', MedilinkRoutes);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
