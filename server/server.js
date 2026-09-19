import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { leadsRouter } from './routes/leads.js';
import { unitsRouter } from './routes/units.js';
import { analyticsRouter } from './routes/analytics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = [
  'https://polycrayons-demo.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive CORS for demo
  },
  credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api/leads', leadsRouter);
app.use('/api/units', unitsRouter);
app.use('/api/analytics', analyticsRouter);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Polycrayons Bay Horizon Backend Server',
    database: 'Persistent Local SQL/JSON Store',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Serve static frontend build in production
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Polycrayons Bay Horizon Backend API running on http://localhost:${PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   - GET/POST  http://localhost:${PORT}/api/leads`);
  console.log(`   - GET/PATCH http://localhost:${PORT}/api/units`);
  console.log(`   - POST/GET  http://localhost:${PORT}/api/analytics`);
});

