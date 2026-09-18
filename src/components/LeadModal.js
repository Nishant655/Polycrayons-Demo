import confetti from 'canvas-confetti';
import { UNITS_DATA } from '../data/units.js';
import { ApiService } from '../services/api.js';

export class LeadModal {
  constructor() {
    this.modal = document.getElementById('lead-modal');
    this.form = document.getElementById('lead-form');
    this.closeBtn = document.getElementById('lead-modal-close');
    this.unitSelect = document.getElementById('lead-unit-select');
    this.successState = document.getElementById('lead-success-state');

    this.init();
  }

  init() {
    // Populate unit selector with Indian Rupee prices
    this.unitSelect.innerHTML = `
      <option value="general">✨ General Masterplan & Site Visit Consultation</option>
      ${UNITS_DATA.map(u => `
        <option value="${u.id}">${u.number} (${u.type} - ${u.priceINR})</option>
      `).join('')}
    `;

    this.closeBtn.addEventListener('click', () => this.close());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSubmit();
    });

    const successCloseBtn = document.getElementById('lead-success-close');
    if (successCloseBtn) {
      successCloseBtn.addEventListener('click', () => this.close());
    }
  }

  open(preselectedUnit = null) {
    this.form.style.display = 'block';
    this.successState.style.display = 'none';

    if (preselectedUnit) {
      this.unitSelect.value = preselectedUnit.id;
    } else {
      this.unitSelect.value = 'general';
    }

    this.modal.classList.add('open');
  }

  close() {
    this.modal.classList.remove('open');
  }

  async handleSubmit() {
    const formData = new FormData(this.form);
    const selectedUnitId = formData.get('unitId');
    const matchingUnit = UNITS_DATA.find(u => u.id === selectedUnitId);

    const leadPayload = {
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      city: formData.get('city') || 'Mumbai / MMR',
      unitId: selectedUnitId,
      unitName: matchingUnit ? `${matchingUnit.number} (${matchingUnit.type} ${matchingUnit.priceINR})` : 'General Masterplan Consultation',
      viewingDate: formData.get('viewingDate'),
      notes: formData.get('notes')
    };

    // Save lead to Backend REST API & Database (with offline local fallback)
    const savedLead = await ApiService.createLead(leadPayload);

    // Show celebration confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#d4af37', '#f3e5ab', '#ffffff']
      });
    } catch (e) {}

    // Show success view
    this.form.style.display = 'none';
    this.successState.style.display = 'block';
    this.form.reset();

    // Trigger custom event so CRM drawer updates in real time
    window.dispatchEvent(new CustomEvent('new-lead-captured', { detail: savedLead }));
  }
}

