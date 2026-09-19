export class RadarMap {
  constructor(canvas, viewer) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.viewer = viewer;
    this.yaw = 0;
    this.fov = 75;
    this.hotspots = [];
    this.sweepAngle = 0;
    this.isHovered = false;
    this.hoverHeading = null;

    this.init();
  }

  init() {
    this.updateDimensions();

    // Resize listener for responsive layout shifts
    window.addEventListener('resize', () => {
      this.updateDimensions();
    });

    // Update camera orientation on rotation
    this.viewer.on('rotate', (e) => {
      this.yaw = e.yaw;
      this.fov = e.fov;
    });

    // Smooth 60fps render loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  updateDimensions() {
    const dpr = Math.min(window.devicePixelRatio || 2, 2.5);
    const rect = this.canvas.getBoundingClientRect();
    const displaySize = Math.round(rect.width) || (window.innerWidth <= 768 ? 85 : 150);
    
    if (this.canvas.width !== displaySize * dpr || this.canvas.height !== displaySize * dpr) {
      this.canvas.width = displaySize * dpr;
      this.canvas.height = displaySize * dpr;
    }
  }

  setHotspots(hotspots) {
    this.hotspots = hotspots || [];
  }

  getCompassHeading(deg) {
    const directions = ['NORTH', 'NNE', 'NE', 'ENE', 'EAST', 'ESE', 'SE', 'SSE', 'SOUTH', 'SSW', 'SW', 'WSW', 'WEST', 'WNW', 'NW', 'NNW'];
    const index = Math.round(deg / 22.5) % 16;
    return directions[index];
  }

  animate() {
    this.sweepAngle = (this.sweepAngle + 0.025) % (Math.PI * 2);
    this.draw();
    requestAnimationFrame(this.animate);
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    
    const scale = Math.max(w / 300, 0.4);
    
    // Outer dial bezel and inner radar viewport radii
    const outerRadius = (w / 2) - (6 * scale);
    const bezelInnerRadius = outerRadius - (22 * scale);
    const radarRadius = bezelInnerRadius - (2 * scale);

    ctx.clearRect(0, 0, w, h);

    // ==========================================
    // 1. OUTER COMPASS BEZEL TRACK (for N, E, S, W)
    // ==========================================
    
    // Outer Bezel Base
    const bezelGrad = ctx.createRadialGradient(cx, cy, bezelInnerRadius, cx, cy, outerRadius);
    bezelGrad.addColorStop(0, 'rgba(14, 18, 28, 0.98)');
    bezelGrad.addColorStop(1, 'rgba(8, 11, 18, 1.0)');
    ctx.fillStyle = bezelGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
    ctx.fill();

    // Outer Champagne Gold Rim
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.65)';
    ctx.lineWidth = Math.max(1.8 * scale, 1);
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner Bezel Dividing Rim
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.lineWidth = Math.max(1 * scale, 0.8);
    ctx.beginPath();
    ctx.arc(cx, cy, bezelInnerRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Outer Degree Calibration Ticks (on outer bezel only)
    for (let i = 0; i < 360; i += 10) {
      // Clear generous breathing space around N (330°-30°), E (70°-110°), S (160°-200°), W (250°-290°)
      if (
        (i >= 330 || i <= 30) ||
        (i >= 70 && i <= 110) ||
        (i >= 160 && i <= 200) ||
        (i >= 250 && i <= 290)
      ) {
        continue;
      }
      const rad = (i * Math.PI) / 180;
      const isMajor = i % 30 === 0;
      const tickLen = (isMajor ? 5 : 3) * scale;

      const x1 = cx + Math.cos(rad) * (outerRadius - (2 * scale));
      const y1 = cy + Math.sin(rad) * (outerRadius - (2 * scale));
      const x2 = cx + Math.cos(rad) * (outerRadius - (2 * scale) - tickLen);
      const y2 = cy + Math.sin(rad) * (outerRadius - (2 * scale) - tickLen);

      ctx.strokeStyle = isMajor ? 'rgba(212, 175, 55, 0.6)' : 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = Math.max((isMajor ? 1.2 : 0.8) * scale, 0.6);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // ==========================================
    // 2. CARDINAL HEADINGS (N, E, S, W) on Outer Track
    // ==========================================
    const cardinalDist = (outerRadius + bezelInnerRadius) / 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // --- NORTH (Distinct Ruby Red Chevron & Bold Red 'N') ---
    // Red North Arrowhead Indicator (pointing up to True North)
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = 'rgba(239, 68, 68, 0.9)';
    ctx.shadowBlur = 6 * scale;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius + (2 * scale));
    ctx.lineTo(cx - (4.5 * scale), cy - outerRadius + (7 * scale));
    ctx.lineTo(cx + (4.5 * scale), cy - outerRadius + (7 * scale));
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Bold Ruby Red 'N' (Placed cleanly below mark line with zero collision)
    const nFontSize = Math.max(Math.round(15 * scale), 9);
    ctx.font = `800 ${nFontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#ff4d4d';
    ctx.shadowColor = 'rgba(239, 68, 68, 0.85)';
    ctx.shadowBlur = 6 * scale;
    ctx.fillText('N', cx, cy - cardinalDist + (2 * scale));
    ctx.shadowBlur = 0;

    // --- EAST / SOUTH / WEST ---
    const cardFontSize = Math.max(Math.round(12 * scale), 7.5);
    ctx.font = `700 ${cardFontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#f1f5f9';
    ctx.fillText('E', cx + cardinalDist, cy);

    // --- SOUTH ('S') ---
    ctx.fillText('S', cx, cy + cardinalDist);

    // --- WEST ('W') ---
    ctx.fillText('W', cx - cardinalDist, cy);

    // ==========================================
    // 3. INNER RADAR SCREEN (Obsidian crystal)
    // ==========================================
    const innerDialGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radarRadius);
    innerDialGrad.addColorStop(0, 'rgba(15, 21, 33, 0.95)');
    innerDialGrad.addColorStop(0.7, 'rgba(8, 11, 17, 0.98)');
    innerDialGrad.addColorStop(1, 'rgba(4, 6, 10, 1.0)');
    ctx.fillStyle = innerDialGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radarRadius, 0, Math.PI * 2);
    ctx.fill();

    // Subtle Concentric Radar Rings
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.12)';
    ctx.lineWidth = Math.max(0.8 * scale, 0.5);
    ctx.beginPath();
    ctx.arc(cx, cy, radarRadius * 0.55, 0, Math.PI * 2);
    ctx.stroke();

    // ==========================================
    // 4. DYNAMIC RADAR SWEEP BEAM (Inner zone only)
    // ==========================================
    const sweepStart = this.sweepAngle;
    const sweepEnd = this.sweepAngle - Math.PI * 0.35;
    const sweepGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, radarRadius);
    sweepGrad.addColorStop(0, 'rgba(212, 175, 55, 0.35)');
    sweepGrad.addColorStop(1, 'rgba(212, 175, 55, 0.0)');
    ctx.fillStyle = sweepGrad;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radarRadius, sweepEnd, sweepStart);
    ctx.closePath();
    ctx.fill();

    // Leading sweep beam line
    ctx.strokeStyle = 'rgba(243, 229, 171, 0.45)';
    ctx.lineWidth = Math.max(1.2 * scale, 0.8);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(sweepStart) * radarRadius, cy + Math.sin(sweepStart) * radarRadius);
    ctx.stroke();

    // ==========================================
    // 5. FIELD-OF-VIEW (FOV) VIEWING CONE
    // ==========================================
    const headingRad = ((this.yaw - 90) * Math.PI) / 180;
    const halfFovRad = ((this.fov * 0.5) * Math.PI) / 180;
    const startAngle = headingRad - halfFovRad;
    const endAngle = headingRad + halfFovRad;

    // Glowing FOV Wedge
    const fovGrad = ctx.createRadialGradient(cx, cy, 3, cx, cy, radarRadius);
    fovGrad.addColorStop(0, 'rgba(212, 175, 55, 0.7)');
    fovGrad.addColorStop(0.4, 'rgba(212, 175, 55, 0.3)');
    fovGrad.addColorStop(0.85, 'rgba(212, 175, 55, 0.08)');
    fovGrad.addColorStop(1, 'rgba(212, 175, 55, 0.0)');

    ctx.fillStyle = fovGrad;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radarRadius, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();

    // FOV Ray Boundary Lines
    ctx.strokeStyle = '#f3e5ab';
    ctx.lineWidth = Math.max(1.5 * scale, 1);
    ctx.shadowColor = 'rgba(212, 175, 55, 0.7)';
    ctx.shadowBlur = 5 * scale;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(startAngle) * radarRadius, cy + Math.sin(startAngle) * radarRadius);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(endAngle) * radarRadius, cy + Math.sin(endAngle) * radarRadius);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Center Heading Pointer Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = Math.max(1 * scale, 0.7);
    ctx.setLineDash([2 * scale, 3 * scale]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(headingRad) * (radarRadius - (4 * scale)), cy + Math.sin(headingRad) * (radarRadius - (4 * scale)));
    ctx.stroke();
    ctx.setLineDash([]);

    // ==========================================
    // 6. LANDMARK HOTSPOT PIPS
    // ==========================================
    this.hotspots.forEach((hs) => {
      const angleRad = ((hs.yaw - 90) * Math.PI) / 180;
      const hsDist = radarRadius * 0.68;
      const hx = cx + Math.cos(angleRad) * hsDist;
      const hy = cy + Math.sin(angleRad) * hsDist;

      // Angular proximity to sweep beam for illumination ping
      let diff = Math.abs((this.sweepAngle % (Math.PI * 2)) - (angleRad % (Math.PI * 2)));
      if (diff > Math.PI) diff = Math.PI * 2 - diff;
      const isPinged = diff < 0.3;

      // Ripple halo
      ctx.strokeStyle = isPinged ? 'rgba(243, 229, 171, 0.85)' : 'rgba(212, 175, 55, 0.3)';
      ctx.lineWidth = Math.max(1 * scale, 0.7);
      ctx.beginPath();
      ctx.arc(hx, hy, (isPinged ? 5.5 : 3.5) * scale, 0, Math.PI * 2);
      ctx.stroke();

      // Gold Core Pip
      ctx.fillStyle = isPinged ? '#ffffff' : '#dfba73';
      ctx.shadowColor = '#d4af37';
      ctx.shadowBlur = (isPinged ? 6 : 2) * scale;
      ctx.beginPath();
      ctx.arc(hx, hy, 2 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // ==========================================
    // 7. CENTER GYRO HUB
    // ==========================================
    ctx.fillStyle = '#0a0d14';
    ctx.beginPath();
    ctx.arc(cx, cy, 5.5 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = Math.max(1.5 * scale, 1);
    ctx.beginPath();
    ctx.arc(cx, cy, 5.5 * scale, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffdf7a';
    ctx.beginPath();
    ctx.arc(cx, cy, 2 * scale, 0, Math.PI * 2);
    ctx.fill();

    // ==========================================
    // 8. UPDATE LIVE HEADING TEXT (Fixed 3-Digit Pad to Prevent Shifting)
    // ==========================================
    const headingDeg = Math.round(this.yaw);
    const paddedDeg = String(headingDeg).padStart(3, '0');
    const headingDir = this.getCompassHeading(headingDeg);
    const headingEl = document.getElementById('radar-live-heading');
    if (headingEl) {
      headingEl.textContent = `${paddedDeg}° ${headingDir}`;
    }
  }
}

function THREE_RAD_TO_DEG(rad) {
  return rad * (180 / Math.PI);
}

