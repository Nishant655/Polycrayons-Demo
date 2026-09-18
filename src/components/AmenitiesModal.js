import { AMENITIES_DATA } from '../data/amenities.js';

export class AmenitiesModal {
  constructor() {
    this.modal = document.getElementById('amenities-modal');
    this.closeBtn = document.getElementById('amenities-modal-close');
    this.grid = document.getElementById('amenities-grid');

    this.init();
  }

  init() {
    this.closeBtn.addEventListener('click', () => this.close());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    this.render();
  }

  open() {
    this.modal.classList.add('open');
  }

  close() {
    this.modal.classList.remove('open');
  }

  render() {
    this.grid.innerHTML = AMENITIES_DATA.map(a => `
      <div style="background: rgba(20, 26, 38, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column;">
        <img src="${a.image}" alt="${a.title}" style="width: 100%; height: 160px; object-fit: cover;" />
        <div style="padding: 16px; flex: 1; display: flex; flex-direction: column;">
          <span style="font-size: 10px; color: var(--gold-primary); font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">
            ${a.category}
          </span>
          <h4 style="font-size: 15px; color: #fff; margin-bottom: 6px;">
            ${a.title}
          </h4>
          <p style="font-size: 12px; color: var(--text-muted); line-height: 1.4; flex: 1;">
            ${a.description}
          </p>
        </div>
      </div>
    `).join('');
  }
}
