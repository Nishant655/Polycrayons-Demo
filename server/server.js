import express from 'express';
import cors from 'cors';
import { leadsRouter } from './routes/leads.js';
import { unitsRouter } from './routes/units.js';
import { analyticsRouter } from './routes/analytics.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
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

app.listen(PORT, () => {
  console.log(`🚀 Polycrayons Bay Horizon Backend API running on http://localhost:${PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   - GET/POST  http://localhost:${PORT}/api/leads`);
  console.log(`   - GET/PATCH http://localhost:${PORT}/api/units`);
  console.log(`   - POST/GET  http://localhost:${PORT}/api/analytics`);
});
