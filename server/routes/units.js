import express from 'express';
import { db } from '../database/db.js';

export const unitsRouter = express.Router();

// GET all inventory units
unitsRouter.get('/', (req, res) => {
  try {
    const units = db.getUnits();
    res.json({ success: true, count: units.length, data: units });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH unit status (Available, Fast Selling, Reserved, Sold Out)
unitsRouter.patch('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Available', 'Fast Selling', 'Reserved', 'Sold Out'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const updated = db.updateUnitStatus(id, status);
    if (updated) {
      res.json({
        success: true,
        message: `Unit ${id} status updated to ${status}.`,
        data: updated
      });
    } else {
      res.status(404).json({ success: false, error: 'Unit not found.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
