import { ApiService } from '../services/api.js';

export class CrmDrawer {
  constructor() {
    this.backdrop = document.getElementById('crm-drawer-backdrop');
    this.panel = document.getElementById('crm-drawer-panel');
    this.closeBtn = document.getElementById('crm-drawer-close');
    this.tableBody = document.getElementById('crm-table-body');
    this.badgeEl = document.getElementById('crm-lead-count-badge');
    this.exportBtn = document.getElementById('crm-export-btn');
    this.clearBtn = document.getElementById('crm-clear-btn');
    this.leads = [];

    this.init();
  }

  init() {
    this.closeBtn.addEventListener('click', () => this.close());
    this.backdrop.addEventListener('click', () => this.close());

    window.addEventListener('new-lead-captured', () => {
      this.update();
    });

    if (this.exportBtn) {
      this.exportBtn.addEventListener('click', () => this.exportCSV());
    }

    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', async () => {
        if (confirm('Clear all captured VIP leads from database?')) {
          await ApiService.clearLeads();
          await this.update();
        }
      });
    }

    this.update();
  }

  async open() {
    await this.update();
    this.backdrop.classList.add('open');
    this.panel.classList.add('open');
  }

  close() {
    this.backdrop.classList.remove('open');
    this.panel.classList.remove('open');
  }

  async getLeads() {
    this.leads = await ApiService.getLeads();
    return this.leads;
  }

  async update() {
    const leads = await this.getLeads();
    if (this.badgeEl) {
      this.badgeEl.textContent = leads.length;
    }

    if (leads.length === 0) {
      this.tableBody.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
          No leads captured yet. Submit an inquiry through the "Schedule Site Visit" button to test real-time capture!
        </div>
      `;
      return;
    }

    this.tableBody.innerHTML = leads.map(l => `
      <div style="background: rgba(20, 26, 38, 0.75); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 14px; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <h4 style="font-size: 14px; color: #fff; font-weight: 700;">${l.fullName || l.name}</h4>
          <span style="font-size: 10px; background: rgba(212,175,55,0.2); color: var(--gold-light); padding: 2px 8px; border-radius: 999px; font-weight: 700; border: 1px solid rgba(212,175,55,0.3);">${l.status}</span>
        </div>
        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">
          📧 ${l.email} • 📞 ${l.phone} (${l.city || 'Mumbai / MMR'})
        </div>
        <div style="font-size: 11.5px; color: var(--gold-primary); margin-bottom: 4px; font-weight: 600;">
          🏢 ${l.unitName || l.unitId || 'General Masterplan VIP Tour'}
        </div>
        ${l.notes ? `<div style="font-size: 11px; color: var(--text-dim); margin-bottom: 4px; font-style: italic;">📝 "${l.notes}"</div>` : ''}
        <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--text-dim); margin-top: 6px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 6px;">
          <span>🗓 Visit Date: ${l.viewingDate || 'Flexible'}</span>
          <span>Captured: ${new Date(l.createdAt).toLocaleTimeString()}</span>
        </div>
      </div>
    `).join('');
  }

  exportCSV() {
    const leads = this.leads;
    if (!leads.length) {
      alert('No leads to export.');
      return;
    }

    const headers = ['ID', 'Full Name', 'Email', 'Phone', 'City', 'Unit Interest', 'Viewing Date', 'Notes', 'Status', 'Submitted At'];
    const rows = leads.map(l => [
      `"${l.id}"`,
      `"${l.fullName || l.name}"`,
      `"${l.email}"`,
      `"${l.phone}"`,
      `"${l.city || ''}"`,
      `"${(l.unitName || l.unitId || '').replace(/"/g, '""')}"`,
      `"${l.viewingDate || ''}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
      `"${l.status}"`,
      `"${l.createdAt}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Polycrayons_VIP_Leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

