import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './src/routes/authRoutes.js';
import ChatRoutes from './src/routes/ChatRoutes.js';
import UserRoutes from './src/routes/UserRoutes.js';
import cookieParser from 'cookie-parser';
import { connectDB } from './src/config/db.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
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
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
