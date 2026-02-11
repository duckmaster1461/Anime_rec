import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import animeRoutes from './routes/animeRoutes';
import { connectDB } from './db/db';

dotenv.config({ path: './.env' });

const app = express();

// Middleware
app.use(cors({ origin: ['http://anime-rec-8x6g.onrender.com', 'http://localhost:3000'], credentials: false }));
app.use(express.json());

// ---------- DB ----------
connectDB()
  .then(() => console.log('✅ Database connection established'))
  .catch((err) => {
    console.error('❌ Database connection failed', err);
    process.exit(1);
  });

// ---------- ROUTES ----------
app.get('/home', (_req: Request, res: Response) => {
  res.send('Welcome to the AI Model API');
});
app.use('/api/anime', animeRoutes);

// ---------- START ----------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
