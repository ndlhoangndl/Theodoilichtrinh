import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import trackerRoutes from './routes/trackerRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Health check and root route
app.get('/healthz', (req, res) => res.status(200).send('OK'));
app.get('/api/healthz', (req, res) => res.status(200).json({ status: 'ok' }));
app.get('/', (req, res) => res.status(200).send('Personal Lịch Trình Server is running'));

// Ensure MongoDB is connected before handling any API request (critical for Vercel Serverless cold starts)
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection failed on request:', err);
    res.status(500).json({ message: 'Database connection error' });
  }
});

// Bind API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tracker', trackerRoutes);

// Start Server locally (skip app.listen when running inside Vercel Serverless Function)
if (!process.env.VERCEL) {
  connectDB().catch(err => console.error('Initial DB connect error:', err));
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
