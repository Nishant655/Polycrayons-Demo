import express from 'express';
import { db } from '../database/db.js';

export const leadsRouter = express.Router();

// GET all leads
leadsRouter.get('/', (req, res) => {
  try {
    const leads = db.getLeads();
    res.json({ success: true, count: leads.length, data: leads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST a new VIP site visit lead
leadsRouter.post('/', (req, res) => {
  try {
    const { fullName, email, phone, city, unitId, unitName, viewingDate, notes } = req.body;

    // Validate required fields
    if (!fullName || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Full Name and Mobile Phone (+91) are required.'
      });
    }

    // Basic Indian phone validation
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid 10-digit Indian mobile number.'
      });
    }

    const newLead = db.createLead({
      fullName,
      email,
      phone,
      city,
      unitId,
      unitName,
      viewingDate,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'VIP Site Visit Registered Successfully. CRM notification dispatched.',
      data: newLead
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET export leads as CSV
leadsRouter.get('/export', (req, res) => {
  try {
    const leads = db.getLeads();
    const headers = ['ID', 'Full Name', 'Phone', 'Email', 'City', 'Interested Unit', 'Visit Date', 'Notes', 'Status', 'Submitted At'];
    const rows = leads.map(l => [
      `"${l.id}"`,
      `"${l.fullName}"`,
      `"${l.phone}"`,
      `"${l.email}"`,
      `"${l.city}"`,
      `"${l.unitName || l.unitId}"`,
      `"${l.viewingDate}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
      `"${l.status}"`,
      `"${l.createdAt}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="polycrayons_leads_${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE a lead by ID
leadsRouter.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const deleted = db.deleteLead(id);
    if (deleted) {
      res.json({ success: true, message: `Lead ${id} deleted successfully.` });
    } else {
      res.status(404).json({ success: false, error: 'Lead not found.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE all leads (Clear CRM)
leadsRouter.delete('/', (req, res) => {
  try {
    db.clearLeads();
    res.json({ success: true, message: 'All leads cleared.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
