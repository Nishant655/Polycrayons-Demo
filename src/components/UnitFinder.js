import { UNITS_DATA } from '../data/units.js';

export class UnitFinder {
  constructor(options = {}) {
    this.units = UNITS_DATA;
    this.currentFilter = 'All';
    this.onBookUnit = options.onBookUnit || null;
    this.onViewFloorPlan = options.onViewFloorPlan || null;

    this.init();
  }

  init() {
    this.backdrop = document.getElementById('unit-drawer-backdrop');
    this.panel = document.getElementById('unit-drawer-panel');
    this.closeBtn = document.getElementById('unit-drawer-close');
    this.listContainer = document.getElementById('unit-list-container');
    this.filterChips = document.querySelectorAll('.filter-chip');

    this.closeBtn.addEventListener('click', () => this.close());
    this.backdrop.addEventListener('click', () => this.close());

    this.filterChips.forEach((chip) => {
      chip.addEventListener('click', (e) => {
        this.filterChips.forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
        this.currentFilter = e.target.dataset.filter;
        this.render();
      });
    });

    this.render();
  }

  open() {
    this.backdrop.classList.add('open');
    this.panel.classList.add('open');
  }

  close() {
    this.backdrop.classList.remove('open');
    this.panel.classList.remove('open');
  }

  render() {
    const filtered = this.currentFilter === 'All'
      ? this.units
      : this.units.filter(u => u.type === this.currentFilter);

    this.listContainer.innerHTML = '';

    if (filtered.length === 0) {
      this.listContainer.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
          No units found in this category.
        </div>
      `;
      return;
    }

    filtered.forEach((unit) => {
      const card = document.createElement('div');
      card.className = 'unit-card';
      
      const tagClass = unit.status.toLowerCase().replace(' ', '-');

      card.innerHTML = `
        <div class="unit-card-top">
          <div>
            <div style="font-size: 11px; color: var(--gold-light); font-weight: 700; text-transform: uppercase;">
              ${unit.category}
            </div>
            <h3 style="font-size: 16px; color: #fff; margin-top: 2px;">
              ${unit.number}
            </h3>
          </div>
          <span class="unit-tag ${tagClass}">${unit.status}</span>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 6px;">
          <div class="unit-card-price">${unit.priceINR}</div>
          <div style="font-size: 11px; color: var(--gold-primary); font-weight: 600;">${unit.priceLakhs}</div>
        </div>

        <div class="unit-card-grid">
          <div class="unit-grid-item">
            <span>RERA Carpet</span>
            <span>${unit.carpetArea.split(' ')[0]} sq.ft</span>
          </div>
          <div class="unit-grid-item">
            <span>Floor</span>
            <span>Floor ${unit.floor}</span>
          </div>
          <div class="unit-grid-item">
            <span>Vastu Aspect</span>
            <span>${unit.facing.split(' ')[0]}</span>
          </div>
        </div>

        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;">
          ${unit.features.slice(0, 2).map(f => `
            <span style="font-size: 10px; background: rgba(255,255,255,0.06); padding: 2px 8px; border-radius: 4px; color: var(--text-muted);">
              ✓ ${f}
            </span>
          `).join('')}
        </div>

        <div class="unit-card-actions">
          <button class="unit-btn-secondary view-plan-btn" data-id="${unit.id}">
            📐 Floor Plan
          </button>
          <button class="unit-btn-primary book-unit-btn" data-id="${unit.id}">
            Schedule Site Visit
          </button>
        </div>
      `;

      card.querySelector('.view-plan-btn').addEventListener('click', () => {
        if (this.onViewFloorPlan) this.onViewFloorPlan(unit);
      });

      card.querySelector('.book-unit-btn').addEventListener('click', () => {
        this.close();
        if (this.onBookUnit) this.onBookUnit(unit);
      });

      this.listContainer.appendChild(card);
    });
  }
}
