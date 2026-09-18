import express from 'express';
import { db } from '../database/db.js';

export const analyticsRouter = express.Router();

// POST log analytics event (e.g. 360 camera gaze, hotspot click, floor switch)
analyticsRouter.post('/', (req, res) => {
  try {
    const { eventType, sceneId, yaw, pitch, timeMode } = req.body;
    const event = db.logEvent({ eventType, sceneId, yaw, pitch, timeMode });
    res.status(201).json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET analytics summary
analyticsRouter.get('/summary', (req, res) => {
  try {
    const events = db.read().analytics || [];
    const leads = db.getLeads();
    const units = db.getUnits();

    res.json({
      success: true,
      data: {
        totalVisitors: events.length > 0 ? new Set(events.map(e => e.id)).size : 1,
        totalGazeEvents: events.length,
        totalLeadsCaptured: leads.length,
        availableUnits: units.filter(u => u.status === 'Available').length,
        reservedUnits: units.filter(u => u.status === 'Reserved').length,
        fastSellingUnits: units.filter(u => u.status === 'Fast Selling').length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
