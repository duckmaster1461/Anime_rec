import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import animeRoutes from './routes/animeRoutes';
import { connectDB } from './db/db';

// Load env vars
dotenv.config({ path: './.env' });

// Init Express
const app = express();

// --- CORS Setup ---
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000/')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like curl or server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  })
);

// Handle preflight
app.options('*', cors());

// Middleware
app.use(express.json());

// DB Connection
connectDB()
  .then(() => console.log('✅ Database connection established'))
  .catch((err) => {
    console.error('❌ Database connection failed', err);
    process.exit(1);
  });

// Root test
app.get('/home', (_req: Request, res: Response) => {
  res.send('Welcome to the AI Model API');
});

// Routes
app.use('/api/anime', animeRoutes);

// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
