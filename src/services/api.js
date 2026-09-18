const API_BASE = 'http://localhost:3001/api';

export const ApiService = {
  // --- Leads API ---
  async getLeads() {
    try {
      const res = await fetch(`${API_BASE}/leads`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data || [];
    } catch (err) {
      console.warn('Backend offline, using local CRM storage:', err.message);
      const local = localStorage.getItem('polycrayons_leads');
      return local ? JSON.parse(local) : [];
    }
  },

  async createLead(leadData) {
    try {
      const res = await fetch(`${API_BASE}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      
      // Also sync to local storage as fallback
      const localLeads = JSON.parse(localStorage.getItem('polycrayons_leads') || '[]');
      localLeads.unshift(json.data);
      localStorage.setItem('polycrayons_leads', JSON.stringify(localLeads));
      
      return json.data;
    } catch (err) {
      console.warn('Backend offline, saving lead locally:', err.message);
      const fallbackLead = {
        id: `lead-${Date.now()}`,
        ...leadData,
        status: 'Local Lead (Backend Sync Pending)',
        createdAt: new Date().toISOString()
      };
      const localLeads = JSON.parse(localStorage.getItem('polycrayons_leads') || '[]');
      localLeads.unshift(fallbackLead);
      localStorage.setItem('polycrayons_leads', JSON.stringify(localLeads));
      return fallbackLead;
    }
  },

  async clearLeads() {
    try {
      await fetch(`${API_BASE}/leads`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Backend offline, clearing local leads:', err.message);
    }
    localStorage.removeItem('polycrayons_leads');
  },

  // --- Units Live Inventory API ---
  async getUnits() {
    try {
      const res = await fetch(`${API_BASE}/units`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.warn('Backend offline, using client units data:', err.message);
      return null;
    }
  },

  async updateUnitStatus(unitId, status) {
    try {
      const res = await fetch(`${API_BASE}/units/${unitId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.warn('Backend offline for unit status update:', err.message);
      return null;
    }
  },

  // --- 360 Tour Analytics API ---
  async logAnalytics(eventType, sceneId, yaw, pitch, timeMode) {
    try {
      await fetch(`${API_BASE}/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, sceneId, yaw, pitch, timeMode })
      });
    } catch {
      // Silent telemetry catch
    }
  }
};
