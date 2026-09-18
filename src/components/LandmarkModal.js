export class LandmarkModal {
  constructor() {
    this.modal = document.getElementById('landmark-modal');
    this.closeBtn = document.getElementById('landmark-modal-close');
    this.titleEl = document.getElementById('landmark-title');
    this.categoryEl = document.getElementById('landmark-category');
    this.imageEl = document.getElementById('landmark-image');
    this.detailsEl = document.getElementById('landmark-details');
    this.highlightsEl = document.getElementById('landmark-highlights');
    this.metaEl = document.getElementById('landmark-meta');

    this.init();
  }

  init() {
    this.closeBtn.addEventListener('click', () => this.close());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });
  }

  open(hotspot) {
    this.titleEl.textContent = hotspot.title;
    this.categoryEl.textContent = `${hotspot.category} • ${hotspot.distance}`;
    this.imageEl.src = hotspot.image;
    this.detailsEl.textContent = hotspot.details;
    this.metaEl.textContent = `⏱ Drive Time: ${hotspot.driveTime} | Direct Line: ${hotspot.distance}`;

    if (hotspot.highlights && hotspot.highlights.length) {
      this.highlightsEl.innerHTML = hotspot.highlights.map(h => `
        <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 6px 12px; font-size: 12px; color: var(--gold-light);">
          ✦ ${h}
        </div>
      `).join('');
    } else {
      this.highlightsEl.innerHTML = '';
    }

    this.modal.classList.add('open');
  }

  close() {
    this.modal.classList.remove('open');
  }
}
