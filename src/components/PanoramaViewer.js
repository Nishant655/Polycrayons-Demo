import * as THREE from 'three';

export class PanoramaViewer {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      initialFov: 75,
      minFov: 35,
      maxFov: 95,
      autoRotate: true,
      autoRotateSpeed: 0.045, // Gentle, slow auto-rotate speed
      damping: 0.08,
      ...options
    };

    this.currentScene = null;
    this.timeMode = 'day'; // 'day' | 'night'
    this.blendValue = 0.0;  // 0.0 (day) to 1.0 (night)
    this.targetBlendValue = 0.0;
    
    // Spherical coordinates
    this.lon = 0;
    this.lat = 0;
    this.targetLon = 0;
    this.targetLat = 0;
    this.defaultPitch = -5;
    this.fov = this.options.initialFov;
    this.targetFov = this.options.initialFov;
    
    this.isUserInteracting = false;
    this.previousMouseX = 0;
    this.previousMouseY = 0;
    this.cursorNormX = 0;
    this.cursorNormY = 0;
    this.cursorHoverRotation = true; // Cursor movement rotates panorama
    this.autoRotate = this.options.autoRotate;
    this.lastUserInteractionTime = Date.now();
    this.idleThresholdMs = 2000; // Return to default pitch & auto-rotate after 2s idle

    this.listeners = {
      rotate: [],
      ready: []
    };

    this.textureLoader = new THREE.TextureLoader();
    this.textureCache = new Map();

    this.init();
  }

  init() {
    this.width = this.container.clientWidth || window.innerWidth;
    this.height = this.container.clientHeight || window.innerHeight;

    // 1. Three.js Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(this.fov, this.width / this.height, 1, 1100);
    this.camera.target = new THREE.Vector3(0, 0, 0);

    // 2. WebGL Renderer with High Quality
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.container.appendChild(this.renderer.domElement);

    // 3. Panorama Sphere Geometry & Custom Day/Night Blending Shader
    const geometry = new THREE.SphereGeometry(500, 64, 32);
    // Invert geometry so faces point inward
    geometry.scale(-1, 1, 1);

    this.shaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uDayTexture: { value: null },
        uNightTexture: { value: null },
        uBlend: { value: 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uDayTexture;
        uniform sampler2D uNightTexture;
        uniform float uBlend;
        varying vec2 vUv;

        void main() {
          vec4 dayColor = texture2D(uDayTexture, vUv);
          vec4 nightColor = texture2D(uNightTexture, vUv);
          gl_FragColor = mix(dayColor, nightColor, clamp(uBlend, 0.0, 1.0));
        }
      `,
      side: THREE.FrontSide
    });

    this.sphereMesh = new THREE.Mesh(geometry, this.shaderMaterial);
    this.scene.add(this.sphereMesh);

    // 4. Bind Event Listeners
    this.bindEvents();

    // 5. Start Animation Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  loadTexture(url) {
    if (this.textureCache.has(url)) {
      return Promise.resolve(this.textureCache.get(url));
    }
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.generateMipmaps = true;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          this.textureCache.set(url, tex);
          resolve(tex);
        },
        undefined,
        (err) => {
          console.error(`Failed to load texture: ${url}`, err);
          reject(err);
        }
      );
    });
  }

  async loadScene(sceneConfig, targetTime = null) {
    this.currentScene = sceneConfig;
    this.defaultPitch = sceneConfig.initialPitch !== undefined ? sceneConfig.initialPitch : -5;
    this.lastUserInteractionTime = Date.now();

    if (targetTime) {
      this.timeMode = targetTime;
      this.targetBlendValue = targetTime === 'night' ? 1.0 : 0.0;
      this.blendValue = this.targetBlendValue;
    }

    if (sceneConfig.initialYaw !== undefined) {
      this.targetLon = sceneConfig.initialYaw;
      this.lon = sceneConfig.initialYaw;
    }
    if (sceneConfig.initialPitch !== undefined) {
      this.targetLat = sceneConfig.initialPitch;
      this.lat = sceneConfig.initialPitch;
    }
    if (sceneConfig.initialFov !== undefined) {
      this.targetFov = sceneConfig.initialFov;
      this.fov = sceneConfig.initialFov;
    }

    // Load both Day and Night textures concurrently for instant transitions
    const [dayTex, nightTex] = await Promise.all([
      this.loadTexture(sceneConfig.dayImage),
      this.loadTexture(sceneConfig.nightImage || sceneConfig.dayImage)
    ]);

    this.shaderMaterial.uniforms.uDayTexture.value = dayTex;
    this.shaderMaterial.uniforms.uNightTexture.value = nightTex;
    this.shaderMaterial.uniforms.uBlend.value = this.blendValue;

    this.emit('ready', sceneConfig);
  }

  setTimeMode(mode, animate = true) {
    this.timeMode = mode;
    this.targetBlendValue = mode === 'night' ? 1.0 : 0.0;
    if (!animate) {
      this.blendValue = this.targetBlendValue;
      this.shaderMaterial.uniforms.uBlend.value = this.blendValue;
    }
  }

  toggleTimeMode() {
    const nextMode = this.timeMode === 'day' ? 'night' : 'day';
    this.setTimeMode(nextMode);
    return nextMode;
  }

  toggleAutoRotate() {
    this.autoRotate = !this.autoRotate;
    return this.autoRotate;
  }

  toggleCursorRotation() {
    this.cursorHoverRotation = !this.cursorHoverRotation;
    return this.cursorHoverRotation;
  }

  setLookAt(yaw, pitch, fov = null) {
    this.targetLon = yaw;
    this.targetLat = Math.max(-85, Math.min(85, pitch));
    if (fov) {
      this.targetFov = Math.max(this.options.minFov, Math.min(this.options.maxFov, fov));
    }
    this.lastUserInteractionTime = Date.now();
  }

  projectToScreen(yaw, pitch) {
    // Converts spherical yaw/pitch (in degrees) to 3D vector and then to 2D screen coords (x, y, isVisible)
    const phi = THREE.MathUtils.degToRad(90 - pitch);
    const theta = THREE.MathUtils.degToRad(yaw);

    const radius = 500;
    const target = new THREE.Vector3(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );

    // Test if coordinate is in front of camera
    const cameraDir = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDir);
    const dot = target.clone().normalize().dot(cameraDir);
    const isVisible = dot > 0.15; // Within camera field of view hemisphere

    const vector = target.clone().project(this.camera);

    const x = (vector.x * 0.5 + 0.5) * this.width;
    const y = (-(vector.y * 0.5) + 0.5) * this.height;

    return { x, y, isVisible };
  }

  bindEvents() {
    const el = this.container;

    // Mouse Controls - Gentle, Butter-Smooth Tracking
    el.addEventListener('mousedown', (e) => {
      this.isUserInteracting = true;
      this.lastUserInteractionTime = Date.now();
      this.previousMouseX = e.clientX;
      this.previousMouseY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      this.lastUserInteractionTime = Date.now();

      if (this.previousMouseX === 0 && this.previousMouseY === 0) {
        this.previousMouseX = e.clientX;
        this.previousMouseY = e.clientY;
        return;
      }

      const deltaX = e.clientX - this.previousMouseX;
      const deltaY = e.clientY - this.previousMouseY;
      this.previousMouseX = e.clientX;
      this.previousMouseY = e.clientY;

      if (this.isUserInteracting) {
        // Active click & drag rotation (smooth, measured sensitivity)
        const sensitivity = 0.11 * (this.fov / 75);
        this.targetLon -= deltaX * sensitivity;
        this.targetLat += deltaY * sensitivity;
      } else if (this.cursorHoverRotation) {
        // Cursor hover rotation (ultra-gentle, slow, elegant parallax movement)
        const hoverSensitivity = 0.022 * (this.fov / 75);
        this.targetLon -= deltaX * hoverSensitivity;
        this.targetLat += deltaY * hoverSensitivity;
      }
    });

    window.addEventListener('mouseup', () => {
      this.isUserInteracting = false;
      this.lastUserInteractionTime = Date.now();
    });

    // Touch Controls
    let touchStartDist = 0;
    el.addEventListener('touchstart', (e) => {
      this.lastUserInteractionTime = Date.now();
      if (e.touches.length === 1) {
        this.isUserInteracting = true;
        this.previousMouseX = e.touches[0].clientX;
        this.previousMouseY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        this.isUserInteracting = false;
        touchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      this.lastUserInteractionTime = Date.now();
      if (e.touches.length === 1 && this.isUserInteracting) {
        const deltaX = e.touches[0].clientX - this.previousMouseX;
        const deltaY = e.touches[0].clientY - this.previousMouseY;
        this.previousMouseX = e.touches[0].clientX;
        this.previousMouseY = e.touches[0].clientY;

        const sensitivity = 0.14 * (this.fov / 75);
        this.targetLon -= deltaX * sensitivity;
        this.targetLat += deltaY * sensitivity;
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const diff = touchStartDist - dist;
        this.targetFov += diff * 0.08;
        this.targetFov = Math.max(this.options.minFov, Math.min(this.options.maxFov, this.targetFov));
        touchStartDist = dist;
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.isUserInteracting = false;
      this.lastUserInteractionTime = Date.now();
    });

    // Mouse Wheel Zoom
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.lastUserInteractionTime = Date.now();
      this.targetFov += e.deltaY * 0.035;
      this.targetFov = Math.max(this.options.minFov, Math.min(this.options.maxFov, this.targetFov));
    }, { passive: false });

    // Window Resize
    window.addEventListener('resize', () => {
      this.width = this.container.clientWidth || window.innerWidth;
      this.height = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.width, this.height);
    });
  }

  animate() {
    requestAnimationFrame(this.animate);

    const isIdle = (Date.now() - this.lastUserInteractionTime) > this.idleThresholdMs;

    // When idle (no user cursor action), smoothly return pitch & FOV to default level and auto-rotate
    if (isIdle && !this.isUserInteracting) {
      // Gently return to horizontal level pitch
      this.targetLat += (this.defaultPitch - this.targetLat) * 0.02;
      // Gently return to default FOV
      this.targetFov += (this.options.initialFov - this.targetFov) * 0.02;
      // Continuous slow auto-rotation
      this.targetLon += this.options.autoRotateSpeed;
    } else if (this.autoRotate && !this.isUserInteracting) {
      this.targetLon += this.options.autoRotateSpeed;
    }

    // High quality smooth inertia damping
    const dampingFactor = this.isUserInteracting ? 0.25 : 0.08;
    this.lat += (this.targetLat - this.lat) * dampingFactor;
    this.lon += (this.targetLon - this.lon) * dampingFactor;
    this.fov += (this.targetFov - this.fov) * 0.12;

    // Pitch Clamping
    this.lat = Math.max(-85, Math.min(85, this.lat));
    this.targetLat = Math.max(-85, Math.min(85, this.targetLat));

    // Smooth Day/Night Crossfade
    if (Math.abs(this.blendValue - this.targetBlendValue) > 0.001) {
      this.blendValue += (this.targetBlendValue - this.blendValue) * 0.08;
      this.shaderMaterial.uniforms.uBlend.value = this.blendValue;
    }

    // Update Camera Field of View
    this.camera.fov = this.fov;
    this.camera.updateProjectionMatrix();

    // Convert (lat, lon) to Cartesian target coordinate
    const phi = THREE.MathUtils.degToRad(90 - this.lat);
    const theta = THREE.MathUtils.degToRad(this.lon);

    const targetX = 500 * Math.sin(phi) * Math.cos(theta);
    const targetY = 500 * Math.cos(phi);
    const targetZ = 500 * Math.sin(phi) * Math.sin(theta);

    this.camera.lookAt(targetX, targetY, targetZ);
    this.renderer.render(this.scene, this.camera);

    // Normalize yaw for compass (0 to 360)
    const normalizedYaw = ((this.lon % 360) + 360) % 360;

    // Emit live orientation data for Radar and Hotspots
    this.emit('rotate', {
      yaw: normalizedYaw,
      pitch: this.lat,
      fov: this.fov,
      rawLon: this.lon
    });
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(fn => fn(data));
    }
  }
}
