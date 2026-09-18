export class FloorPlanModal {
  constructor(options = {}) {
    this.modal = document.getElementById('floorplan-modal');
    this.closeBtn = document.getElementById('floorplan-modal-close');
    this.titleEl = document.getElementById('floorplan-title');
    this.subtitleEl = document.getElementById('floorplan-subtitle');
    this.imageEl = document.getElementById('floorplan-image');
    this.specsContainer = document.getElementById('floorplan-specs-container');
    this.bookBtn = document.getElementById('floorplan-book-btn');
    this.currentUnit = null;
    this.onBookUnit = options.onBookUnit || null;

    this.init();
  }

  init() {
    this.closeBtn.addEventListener('click', () => this.close());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    this.bookBtn.addEventListener('click', () => {
      this.close();
      if (this.onBookUnit && this.currentUnit) {
        this.onBookUnit(this.currentUnit);
      }
    });

    const downloadBtn = document.getElementById('floorplan-download-btn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        alert('RERA Floor Plan & Cost Sheet Brochure PDF download initiated!');
      });
    }
  }

  open(unit) {
    this.currentUnit = unit;
    this.titleEl.textContent = `${unit.number} • ${unit.category}`;
    this.subtitleEl.textContent = `${unit.type} | ${unit.carpetArea} | ${unit.facing}`;
    this.imageEl.src = unit.floorPlanUrl;

    this.specsContainer.innerHTML = `
      <div class="unit-grid-item" style="background: rgba(0,0,0,0.3); padding: 8px 14px; border-radius: 8px;">
        <span>Configuration</span>
        <span>${unit.specs.bedrooms}</span>
      </div>
      <div class="unit-grid-item" style="background: rgba(0,0,0,0.3); padding: 8px 14px; border-radius: 8px;">
        <span>Bathrooms</span>
        <span>${unit.specs.bathrooms}</span>
      </div>
      <div class="unit-grid-item" style="background: rgba(0,0,0,0.3); padding: 8px 14px; border-radius: 8px;">
        <span>Balcony / Sundeck</span>
        <span>${unit.balconyArea}</span>
      </div>
      <div class="unit-grid-item" style="background: rgba(0,0,0,0.3); padding: 8px 14px; border-radius: 8px;">
        <span>Floor Height</span>
        <span>${unit.specs.ceilingHeight}</span>
      </div>
      <div class="unit-grid-item" style="background: rgba(0,0,0,0.3); padding: 8px 14px; border-radius: 8px;">
        <span>Car Parking</span>
        <span>${unit.specs.parking}</span>
      </div>
      <div class="unit-grid-item" style="background: rgba(0,0,0,0.3); padding: 8px 14px; border-radius: 8px;">
        <span>All-Inclusive Price</span>
        <span style="color: var(--gold-light); font-weight: 700;">${unit.priceINR}</span>
      </div>
    `;

    this.modal.classList.add('open');
  }

  close() {
    this.modal.classList.remove('open');
  }
}
