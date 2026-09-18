import {
  createIcons,
  Compass,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  RotateCw,
  MapPin,
  Eye,
  Phone,
  Building,
  Layers,
  Sparkles,
  Download,
  Check,
  X,
  SlidersHorizontal,
  Users,
  Share2,
  MousePointer
} from 'lucide';

import { SCENES_DATA } from './data/scenes.js';
import { HOTSPOTS_DATA } from './data/hotspots.js';
import { PanoramaViewer } from './components/PanoramaViewer.js';
import { HotspotManager } from './components/HotspotManager.js';
import { RadarMap } from './components/RadarMap.js';
import { UnitFinder } from './components/UnitFinder.js';
import { LeadModal } from './components/LeadModal.js';
import { FloorPlanModal } from './components/FloorPlanModal.js';
import { LandmarkModal } from './components/LandmarkModal.js';
import { AmenitiesModal } from './components/AmenitiesModal.js';
import { CrmDrawer } from './components/CrmDrawer.js';

class App {
  constructor() {
    this.scenes = SCENES_DATA;
    this.currentSceneIndex = 0;
    this.timeMode = 'day';
    this.isFullscreen = false;

    this.init();
  }

  async init() {
    // 1. Initialize Lucide Icons
    this.renderIcons();

    // 2. Initialize Three.js Panorama Viewer
    const viewportContainer = document.getElementById('viewport-container');
    this.viewer = new PanoramaViewer(viewportContainer, {
      autoRotate: false,
      initialFov: 75
    });

    // 3. Initialize Hotspot Manager
    const hotspotLayer = document.getElementById('hotspot-layer');
    this.hotspotManager = new HotspotManager(hotspotLayer, this.viewer);

    // 4. Initialize Radar Map
    const radarCanvas = document.getElementById('radar-canvas');
    this.radarMap = new RadarMap(radarCanvas, this.viewer);

    // 5. Initialize Modals & Drawers
    this.landmarkModal = new LandmarkModal();
    this.amenitiesModal = new AmenitiesModal();
    this.leadModal = new LeadModal();
    this.crmDrawer = new CrmDrawer();

    this.floorPlanModal = new FloorPlanModal({
      onBookUnit: (unit) => {
        this.leadModal.open(unit);
      }
    });

    this.unitFinder = new UnitFinder({
      onBookUnit: (unit) => {
        this.leadModal.open(unit);
      },
      onViewFloorPlan: (unit) => {
        this.floorPlanModal.open(unit);
      }
    });

    // Connect Hotspot Click -> Landmark Modal
    this.hotspotManager.onHotspotClick = (hotspot) => {
      this.landmarkModal.open(hotspot);
    };

    // 6. Bind HUD UI Elements
    this.bindControls();

    // 7. Track loading progress for ultra-luxury splash screen
    const savedStyle = localStorage.getItem('poly_loader_style') || 'style-gates';
    this.setLoaderStyle(savedStyle);

    const progressBar = document.getElementById('loader-progress-bar');
    const percentageEl = document.getElementById('loader-percentage');
    const statusTextEl = document.getElementById('loader-status-text');

    const updateProgress = (pct, text) => {
      if (progressBar) progressBar.style.width = `${pct}%`;
      if (percentageEl) {
        percentageEl.textContent = `${String(pct).padStart(3, '0')}%`;
      }
      if (statusTextEl && text) statusTextEl.textContent = text;
    };

    updateProgress(35, 'CALIBRATING 8K GIGAPIXEL MATRIX...');
    await new Promise(r => setTimeout(r, 120));

    updateProgress(75, 'GENERATING ULTRA-HD 360° MASTERPLAN...');

    // Load Initial Scene
    await this.loadScene(0);

    updateProgress(100, 'PORTAL READY • GATES OPENING...');
    await new Promise(r => setTimeout(r, 200));

    // 8. Cinematic Reveal: Open Gates & Enter 360 Viewport
    this.hideLoader();
  }

  setLoaderStyle(styleClass) {
    const loader = document.getElementById('loader-overlay');
    if (!loader) return;

    // Reset gate animation timers and states when switching
    clearTimeout(this._gateAutoTimer);
    clearTimeout(this._gateZoomTimer);
    clearTimeout(this._gateFadeTimer);
    loader.classList.remove('gates-opening', 'gates-zooming', 'fade-out');

    // Remove existing style classes
    loader.classList.remove('style-monogram', 'style-gates', 'style-hud', 'style-cinematic');
    loader.classList.add(styleClass);

    // Update active button state
    document.querySelectorAll('.style-toggle-btn').forEach(btn => {
      if (btn.dataset.style === styleClass) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    localStorage.setItem('poly_loader_style', styleClass);

    // If switching to Luxury Gates while previewing, run the automatic entrance sequence
    if (styleClass === 'style-gates' && loader.style.display !== 'none' && !loader.classList.contains('fade-out')) {
      this._gateAutoTimer = setTimeout(() => {
        this.openGatesAndEnter();
      }, 250);
    }
  }

  showLoaderPreview() {
    const loader = document.getElementById('loader-overlay');
    if (!loader) return;

    clearTimeout(this._gateAutoTimer);
    clearTimeout(this._gateZoomTimer);
    clearTimeout(this._gateFadeTimer);

    loader.classList.remove('gates-opening', 'gates-zooming', 'fade-out');
    loader.style.display = 'flex';
    // Force reflow
    void loader.offsetWidth;

    const progressBar = document.getElementById('loader-progress-bar');
    const percentageEl = document.getElementById('loader-percentage');
    const statusTextEl = document.getElementById('loader-status-text');

    if (progressBar) progressBar.style.width = '0%';
    if (percentageEl) percentageEl.textContent = '000%';
    if (statusTextEl) statusTextEl.textContent = 'INITIALIZING LUXURY PORTAL...';

    // Animate progress smoothly & quickly to 100%
    setTimeout(() => {
      if (progressBar) progressBar.style.width = '65%';
      if (percentageEl) percentageEl.textContent = '065%';
      if (statusTextEl) statusTextEl.textContent = 'CALIBRATING 360° MASTERPLAN...';
    }, 120);

    setTimeout(() => {
      if (progressBar) progressBar.style.width = '100%';
      if (percentageEl) percentageEl.textContent = '100%';
      if (statusTextEl) statusTextEl.textContent = 'ENTERING POLYCRAYONS BAY HORIZON';

      // Auto-trigger entrance into the 360 tour
      setTimeout(() => {
        this.hideLoader();
      }, 200);
    }, 300);
  }

  openGatesAndEnter() {
    const loader = document.getElementById('loader-overlay');
    const viewport = document.getElementById('viewport-container');

    if (!loader) return;

    // Immediately trigger viewport loaded state so 360 tour is active behind doors
    if (viewport) {
      viewport.classList.add('loaded');
    }

    clearTimeout(this._gateZoomTimer);
    clearTimeout(this._gateFadeTimer);

    // Step 1: Open the dual gates in 3D & reveal "Welcome to Polycrayons Bay Horizon"
    loader.classList.remove('gates-zooming', 'fade-out');
    loader.classList.add('gates-opening');

    // Step 2: Hold open doors & welcome banner properly (3.2s normal pause), then smoothly fly through
    this._gateZoomTimer = setTimeout(() => {
      loader.classList.add('gates-zooming');
      // Instantly reveal homepage UI components so there is ZERO empty waiting time
      document.body.classList.add('tour-entered');

      // Step 3: Fade out and hide overlay cleanly as zoom finishes
      this._gateFadeTimer = setTimeout(() => {
        loader.classList.add('fade-out');
        setTimeout(() => {
          loader.style.display = 'none';
          loader.classList.remove('gates-opening', 'gates-zooming');
        }, 400);
      }, 750);
    }, 3200);
  }

  hideLoader() {
    const loader = document.getElementById('loader-overlay');
    const viewport = document.getElementById('viewport-container');

    if (!loader) return;

    // If Luxury Gates style is active, trigger the 3D Grand Gates Opening, Welcome Greeting & Enter Sequence!
    if (loader.classList.contains('style-gates')) {
      this.openGatesAndEnter();
      return;
    }

    if (viewport) {
      viewport.classList.add('loaded');
    }

    loader.classList.add('fade-out');
    setTimeout(() => {
      loader.style.display = 'none';
    }, 1200);
  }

  renderIcons() {
    createIcons({
      icons: {
        Compass,
        Sun,
        Moon,
        Maximize2,
        Minimize2,
        RotateCw,
        MapPin,
        Eye,
        Phone,
        Building,
        Layers,
        Sparkles,
        Download,
        Check,
        X,
        SlidersHorizontal,
        Users,
        Share2,
        MousePointer
      }
    });
  }

  async loadScene(index) {
    this.currentSceneIndex = index;
    const scene = this.scenes[index];

    // Update scene button tabs
    document.querySelectorAll('.scene-btn').forEach((btn, i) => {
      if (i === index) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    // Update Bottom Altitude badge
    const badgeEl = document.getElementById('scene-altitude-badge');
    if (badgeEl) badgeEl.textContent = scene.altitude;

    const titleEl = document.getElementById('scene-info-title');
    const descEl = document.getElementById('scene-info-desc');
    const tagEl = document.getElementById('scene-info-tag');
    if (titleEl) titleEl.textContent = scene.title;
    if (descEl) descEl.textContent = scene.description;
    if (tagEl) tagEl.textContent = scene.badge;

    // Load Three.js Scene Textures
    await this.viewer.loadScene(scene, this.timeMode);

    // Load Hotspots for this scene
    this.hotspotManager.loadHotspots(scene.id);

    // Update Radar Map
    this.radarMap.setHotspots(HOTSPOTS_DATA[scene.id] || []);
  }

  bindControls() {
    // Scene Switchers (Header tabs)
    const sceneButtons = document.querySelectorAll('.scene-btn');
    sceneButtons.forEach((btn, i) => {
      btn.addEventListener('click', () => {
        this.loadScene(i);
      });
    });

    // Day / Night Toggle
    const dayBtn = document.getElementById('btn-time-day');
    const nightBtn = document.getElementById('btn-time-night');

    if (dayBtn && nightBtn) {
      dayBtn.addEventListener('click', () => {
        this.timeMode = 'day';
        dayBtn.classList.add('active');
        nightBtn.classList.remove('active');
        this.viewer.setTimeMode('day');
      });

      nightBtn.addEventListener('click', () => {
        this.timeMode = 'night';
        nightBtn.classList.add('active');
        dayBtn.classList.remove('active');
        this.viewer.setTimeMode('night');
      });
    }

    // Auto-Rotate Button
    const autoRotateBtn = document.getElementById('btn-auto-rotate');
    if (autoRotateBtn) {
      autoRotateBtn.addEventListener('click', () => {
        const isSpinning = this.viewer.toggleAutoRotate();
        if (isSpinning) autoRotateBtn.classList.add('active');
        else autoRotateBtn.classList.remove('active');
      });
    }

    // Cursor Movement Rotation Toggle Button
    const cursorLookBtn = document.getElementById('btn-cursor-look');
    if (cursorLookBtn) {
      cursorLookBtn.addEventListener('click', () => {
        const isCursorLook = this.viewer.toggleCursorRotation();
        if (isCursorLook) cursorLookBtn.classList.add('active');
        else cursorLookBtn.classList.remove('active');
      });
    }

    // Fullscreen Toggle
    const fullscreenBtn = document.getElementById('btn-fullscreen');

    const updateFullscreenState = () => {
      const isFs = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      this.isFullscreen = isFs;

      if (fullscreenBtn) {
        if (isFs) {
          fullscreenBtn.classList.add('active');
          fullscreenBtn.setAttribute('data-tooltip', 'Exit Fullscreen Mode');
          fullscreenBtn.innerHTML = '<i data-lucide="minimize-2" style="width: 18px; height: 18px;"></i>';
        } else {
          fullscreenBtn.classList.remove('active');
          fullscreenBtn.setAttribute('data-tooltip', 'Toggle Fullscreen Mode');
          fullscreenBtn.innerHTML = '<i data-lucide="maximize-2" style="width: 18px; height: 18px;"></i>';
        }
        this.renderIcons();
      }
    };

    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        const doc = document;
        const docEl = document.documentElement;
        const isFs = !!(
          doc.fullscreenElement ||
          doc.webkitFullscreenElement ||
          doc.mozFullScreenElement ||
          doc.msFullscreenElement
        );

        if (!isFs) {
          if (docEl.requestFullscreen) {
            docEl.requestFullscreen().catch(err => console.warn('Fullscreen request failed:', err));
          } else if (docEl.webkitRequestFullscreen) {
            docEl.webkitRequestFullscreen();
          } else if (docEl.mozRequestFullScreen) {
            docEl.mozRequestFullScreen();
          } else if (docEl.msRequestFullscreen) {
            docEl.msRequestFullscreen();
          }
        } else {
          if (doc.exitFullscreen) {
            doc.exitFullscreen().catch(err => console.warn('Exit fullscreen failed:', err));
          } else if (doc.webkitExitFullscreen) {
            doc.webkitExitFullscreen();
          } else if (doc.mozCancelFullScreen) {
            doc.mozCancelFullScreen();
          } else if (doc.msExitFullscreen) {
            doc.msExitFullscreen();
          }
        }
      });
    }

    document.addEventListener('fullscreenchange', updateFullscreenState);
    document.addEventListener('webkitfullscreenchange', updateFullscreenState);
    document.addEventListener('mozfullscreenchange', updateFullscreenState);
    document.addEventListener('MSFullscreenChange', updateFullscreenState);

    // Reset View Button
    const resetViewBtn = document.getElementById('btn-reset-view');
    if (resetViewBtn) {
      resetViewBtn.addEventListener('click', () => {
        const scene = this.scenes[this.currentSceneIndex];
        this.viewer.setLookAt(scene.initialYaw || 0, scene.initialPitch || 0, scene.initialFov || 75);
      });
    }

    // Open Unit Finder Drawer
    const unitFinderBtn = document.getElementById('btn-open-units');
    if (unitFinderBtn) {
      unitFinderBtn.addEventListener('click', () => {
        this.unitFinder.open();
      });
    }

    // Open VIP Booking Modal
    const vipBookingBtn = document.getElementById('btn-vip-booking');
    if (vipBookingBtn) {
      vipBookingBtn.addEventListener('click', () => {
        this.leadModal.open();
      });
    }

    // Open Amenities Modal
    const amenitiesBtn = document.getElementById('btn-open-amenities');
    if (amenitiesBtn) {
      amenitiesBtn.addEventListener('click', () => {
        this.amenitiesModal.open();
      });
    }

    // Open CRM Drawer (for Demo presentation)
    const crmBtn = document.getElementById('btn-open-crm');
    if (crmBtn) {
      crmBtn.addEventListener('click', () => {
        this.crmDrawer.open();
      });
    }

    // Loading Screen Style Switcher Buttons
    document.querySelectorAll('.style-toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const style = btn.dataset.style;
        this.setLoaderStyle(style);
      });
    });

    // Preview Loader from Header
    const showLoaderBtn = document.getElementById('btn-show-loader');
    if (showLoaderBtn) {
      showLoaderBtn.addEventListener('click', () => {
        this.showLoaderPreview();
      });
    }

    // Close Loader Preview Button
    const closeLoaderBtn = document.getElementById('btn-close-loader-preview');
    if (closeLoaderBtn) {
      closeLoaderBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.hideLoader();
      });
    }

    // Interactive Trigger to Open Gates and Enter
    const triggerGateBtn = document.getElementById('btn-trigger-gate-open');
    if (triggerGateBtn) {
      triggerGateBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openGatesAndEnter();
      });
    }
  }
}

// Start Application on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
