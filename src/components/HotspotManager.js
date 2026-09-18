import { HOTSPOTS_DATA } from '../data/hotspots.js';

export class HotspotManager {
  constructor(container, viewer) {
    this.container = container;
    this.viewer = viewer;
    this.currentSceneId = null;
    this.hotspots = [];
    this.elements = new Map();
    this.onHotspotClick = null;

    this.init();
  }

  init() {
    this.viewer.on('rotate', () => {
      this.updatePositions();
    });
  }

  loadHotspots(sceneId) {
    this.currentSceneId = sceneId;
    this.hotspots = HOTSPOTS_DATA[sceneId] || [];
    this.render();
  }

  render() {
    this.container.innerHTML = '';
    this.elements.clear();

    this.hotspots.forEach((hs) => {
      const el = document.createElement('div');
      el.className = 'hotspot-element';
      el.dataset.id = hs.id;

      el.innerHTML = `
        <div class="hotspot-pin">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
        <div class="hotspot-label-pill">
          ${hs.title}
        </div>
        <div class="hotspot-card-preview">
          <img src="${hs.image}" alt="${hs.title}" loading="lazy" />
          <div style="font-size: 10px; color: var(--gold-light); font-weight: 700; text-transform: uppercase; margin-bottom: 2px;">
            ${hs.category} • ${hs.distance}
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 4px;">
            ${hs.title}
          </div>
          <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 8px; line-height: 1.4;">
            ${hs.summary}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 6px;">
            <span style="font-size: 11px; color: var(--gold-primary); font-weight: 600;">⏱ ${hs.driveTime}</span>
            <span style="font-size: 11px; color: #fff; font-weight: 600; cursor: pointer;">Explore Details →</span>
          </div>
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.onHotspotClick) {
          this.onHotspotClick(hs);
        }
      });

      this.container.appendChild(el);
      this.elements.set(hs.id, { el, data: hs });
    });

    this.updatePositions();
  }

  updatePositions() {
    this.elements.forEach(({ el, data }) => {
      const projection = this.viewer.projectToScreen(data.yaw, data.pitch);
      if (projection.isVisible) {
        el.style.display = 'block';
        el.style.left = `${projection.x}px`;
        el.style.top = `${projection.y}px`;
      } else {
        el.style.display = 'none';
      }
    });
  }
}
