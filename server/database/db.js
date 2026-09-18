import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'polycrayons_db.json');

// Initial Seed Data
const INITIAL_SEED = {
  leads: [
    {
      id: 'lead-1726650000000',
      fullName: 'Vikram Malhotra',
      email: 'vikram.malhotra@zenithexec.in',
      phone: '+91 98201 54321',
      city: 'Mumbai / MMR',
      unitId: 'unit-2101',
      unitName: 'Tower Pinnacle • Sky Villa 2101 (Penthouse ₹7.80 Cr)',
      viewingDate: '2026-09-22',
      notes: 'Interested in Sky Duplex terrace plunge pool & 3 dedicated parking bays. High priority NRI consultation.',
      status: 'Confirmed Site Visit',
      createdAt: '2026-09-18T10:30:00.000Z'
    }
  ],
  units: [
    {
      id: 'unit-1801',
      number: 'Tower A • Suite 1801',
      type: '1 BHK',
      category: '1 BHK Luxury Suite',
      floor: 18,
      carpetArea: '520 sq.ft (48.3 sq.m) RERA',
      balconyArea: '65 sq.ft Balcony',
      priceINR: '₹1.15 Cr',
      priceLakhs: '₹115 Lakhs (All Inclusive*)',
      facing: 'East Facing • Creek & Lake View',
      status: 'Available',
      featured: false,
      specs: {
        bedrooms: '1 Master Bedroom',
        bathrooms: '2 Bathrooms',
        parking: '1 Covered Car Park',
        ceilingHeight: '10.5 ft High Ceiling'
      },
      floorPlanUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
      features: ['Vastu Compliant Layout', 'Italian Vitrified Tiles', 'Modular German Kitchen', 'Smart Video Door Phone']
    },
    {
      id: 'unit-1902',
      number: 'Tower A • Residence 1902',
      type: '2 BHK',
      category: '2 BHK Grand Waterfront',
      floor: 19,
      carpetArea: '865 sq.ft (80.3 sq.m) RERA',
      balconyArea: '120 sq.ft Sundeck',
      priceINR: '₹2.10 Cr',
      priceLakhs: '₹210 Lakhs (All Inclusive*)',
      facing: 'East-West Cross Ventilation (Sea & Creek)',
      status: 'Fast Selling',
      featured: true,
      specs: {
        bedrooms: '2 Master Bedrooms',
        bathrooms: '2 En-Suite Baths',
        parking: '1 Dedicated Podium Bay',
        ceilingHeight: '11.0 ft High Ceiling'
      },
      floorPlanUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      features: ['Corner Deck with Creek View', 'Walk-in Wardrobe Niche', 'Kohler Sanitary Fittings', 'Acoustic Soundproof Glass']
    },
    {
      id: 'unit-2004',
      number: 'Tower B • Residence 2004',
      type: '3 BHK',
      category: '3 BHK Premium Sky Residence',
      floor: 20,
      carpetArea: '1,420 sq.ft (131.9 sq.m) RERA',
      balconyArea: '210 sq.ft Wrap Balcony',
      priceINR: '₹3.65 Cr',
      priceLakhs: '₹365 Lakhs (All Inclusive*)',
      facing: 'Dual Aspect • Sea Horizon & Skyline',
      status: 'Available',
      featured: true,
      specs: {
        bedrooms: '3 Bedrooms + Puja Room',
        bathrooms: '3.5 Bathrooms + Maid Toilet',
        parking: '2 Covered Reserved Bays',
        ceilingHeight: '11.5 ft High Ceiling'
      },
      floorPlanUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      features: ['Dedicated Puja Niche', "Separate Servant's Room", 'Expansive Master Living Deck', 'Automated Home Lighting']
    },
    {
      id: 'unit-2101',
      number: 'Tower Pinnacle • Sky Villa 2101',
      type: 'Penthouse',
      category: '4 BHK Crown Sky Duplex & Penthouse',
      floor: 21,
      carpetArea: '2,950 sq.ft (274.0 sq.m) RERA',
      balconyArea: '650 sq.ft Private Sky Terrace',
      priceINR: '₹7.80 Cr',
      priceLakhs: '₹780 Lakhs (All Inclusive*)',
      facing: '360° Panoramic Skyline & Ocean Horizon',
      status: 'Reserved',
      featured: true,
      specs: {
        bedrooms: '4 Grand En-Suites + Family Lounge',
        bathrooms: '5 Luxury Bathrooms + Powder Room',
        parking: '3 Dedicated Basement Bays',
        ceilingHeight: '13.0 ft Double Height Living'
      },
      floorPlanUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
      features: ['Private Plunge Pool on Terrace', 'Double Height Glass Atrium', 'Private Elevator Foyer', 'Jacuzzi & Steam En-Suite']
    }
  ],
  analytics: []
};

class Database {
  constructor() {
    this.init();
  }

  init() {
    if (!fs.existsSync(DB_PATH)) {
      this.write(INITIAL_SEED);
    }
  }

  read() {
    try {
      const content = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      console.error('Database read error, restoring seed data:', err);
      this.write(INITIAL_SEED);
      return INITIAL_SEED;
    }
  }

  write(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  }

  // --- Leads API ---
  getLeads() {
    return this.read().leads || [];
  }

  createLead(leadData) {
    const db = this.read();
    const newLead = {
      id: `lead-${Date.now()}`,
      fullName: leadData.fullName || 'Anonymous VIP',
      email: leadData.email || '',
      phone: leadData.phone || '',
      city: leadData.city || 'Mumbai / MMR',
      unitId: leadData.unitId || '',
      unitName: leadData.unitName || 'General Inquiry',
      viewingDate: leadData.viewingDate || new Date().toISOString().split('T')[0],
      notes: leadData.notes || '',
      status: 'Pending Verification',
      createdAt: new Date().toISOString()
    };
    db.leads.unshift(newLead);
    this.write(db);
    return newLead;
  }

  deleteLead(id) {
    const db = this.read();
    const initialLen = db.leads.length;
    db.leads = db.leads.filter(l => l.id !== id);
    this.write(db);
    return db.leads.length < initialLen;
  }

  clearLeads() {
    const db = this.read();
    db.leads = [];
    this.write(db);
    return true;
  }

  // --- Units Inventory API ---
  getUnits() {
    return this.read().units || [];
  }

  updateUnitStatus(unitId, newStatus) {
    const db = this.read();
    const unit = db.units.find(u => u.id === unitId);
    if (unit) {
      unit.status = newStatus;
      this.write(db);
      return unit;
    }
    return null;
  }

  // --- Analytics API ---
  logEvent(eventData) {
    const db = this.read();
    const event = {
      id: `evt-${Date.now()}`,
      eventType: eventData.eventType || 'view_360',
      sceneId: eventData.sceneId || '',
      yaw: eventData.yaw || 0,
      pitch: eventData.pitch || 0,
      timeMode: eventData.timeMode || 'day',
      timestamp: new Date().toISOString()
    };
    db.analytics.push(event);
    // Keep max 500 events
    if (db.analytics.length > 500) {
      db.analytics = db.analytics.slice(-500);
    }
    this.write(db);
    return event;
  }
}

export const db = new Database();
