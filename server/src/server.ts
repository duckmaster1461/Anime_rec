import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import animeRoutes from './routes/animeRoutes';
import { connectDB } from './db/db';

dotenv.config({ path: './.env' });

const app = express();

// ---------- CORS SETUP ----------
const DEV_ALLOW_ALL = process.env.CORS_ALLOW_ALL === 'true';

function normalizeOrigin(o: string) {
  // drop trailing slash
  let x = o.replace(/\/$/, '');
  // unify localhost/127.0.0.1 (browsers sometimes flip)
  x = x.replace('http://127.0.0.1:', 'http://localhost:');
  x = x.replace('https://127.0.0.1:', 'https://localhost:');
  return x;
}

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(s => normalizeOrigin(s.trim()))
  .filter(Boolean);

// Small logger to see what Origin the browser sends
app.use((req, _res, next) => {
  const o = req.headers.origin;
  if (o) console.log('🛰️  Origin:', o);
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (DEV_ALLOW_ALL) return callback(null, true);              // Dev override
      if (!origin) return callback(null, true);                    // curl/server-to-server
      const o = normalizeOrigin(origin);
      if (allowedOrigins.includes(o)) return callback(null, true);
      return callback(new Error(`CORS blocked: ${o} not in allowlist: ${allowedOrigins.join(', ')}`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false, // leave false unless you use cookies/auth across origins
    maxAge: 86400,
  })
);

// Preflight for all routes
app.options('*', cors());

// ---------- MIDDLEWARE ----------
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
