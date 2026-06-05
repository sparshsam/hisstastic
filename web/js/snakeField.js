/**
 * Hiss-Tastic Snake Field — animated decorative background snakes.
 * Renders dozens to hundreds of small wiggling snakes behind the game panel.
 * Canvas-based, lightweight, respects reduced-motion and visibility.
 * No external dependencies.
 */

(function () {
  'use strict';

  // ---- Seeded PRNG (mulberry32) ----
  function createRNG(seed) {
    let s = seed | 0;
    return function () {
      s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const SEED = 42; // deterministic seed for stable appearance
  const rng = createRNG(SEED);

  // ---- Colour palette ----
  const COLORS = [
    '#4CAF50', '#2E7D32', '#388E3C', '#66BB6A', '#81C784',
    '#1B5E20', '#43A047', '#A5D6A7', '#C8E6C9', '#E8F5E9',
    '#FF9800', '#F57C00', '#FFB74D', '#FFCC80',
    '#9CCC65', '#7CB342', '#8BC34A', '#AED581',
    '#CDDC39', '#D4E157', '#DCE775',
    '#26A69A', '#00897B', '#4DB6AC', '#80CBC4',
    '#00E676', '#69F0AE', '#B9F6CA',
  ];

  // ---- Snake definition ----
  function createSnake(rng) {
    const col = COLORS[Math.floor(rng() * COLORS.length)];
    const len = Math.floor(rng() * 18) + 4; // 4–22 segments
    const thick = Math.floor(rng() * 4) + 1.5; // 1.5–5.5 px
    const speed = rng() * 0.6 + 0.15; // 0.15–0.75 px per frame
    const amp = rng() * 30 + 8; // 8–38 px wave amplitude
    const freq = rng() * 0.04 + 0.01; // wave frequency
    const phase = rng() * Math.PI * 2;
    const dir = rng() > 0.5 ? 1 : -1;

    return {
      body: [],
      color: col,
      length: len,
      thickness: thick,
      speed: speed,
      amplitude: amp,
      frequency: freq,
      phase: phase,
      direction: dir,
      x: rng() * 1.2 - 0.1,
      y: rng() * 1.2 - 0.1,
      opacity: rng() * 0.4 + 0.15, // 0.15–0.55
      // Loop/lurch style
      loopChance: rng() * 0.03, // chance per frame to do a loop
      loopPhase: 0,
      inLoop: false,
    };
  }

  // ---- Snake Field ----
  function SnakeField() {
    this.canvas = null;
    this.ctx = null;
    this.snakes = [];
    this.targetCount = 0;
    this.currentCount = 0;
    this.animFrame = null;
    this.running = false;
    this.reducedMotion = false;
    this.visible = true;
    this.handleVisibility = this._onVisibilityChange.bind(this);
  }

  SnakeField.prototype.init = function () {
    // Check reduced motion preference
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Create background canvas
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'bg-snake-field';
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.zIndex = '0';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.background = 'transparent';
    this.ctx = this.canvas.getContext('2d');

    // Insert as first child of body so it's behind everything
    document.body.insertBefore(this.canvas, document.body.firstChild);

    // Resize
    this._resize();

    // Create snakes
    this._updateTargetCount();
    this._populateSnakes();

    // Start animation
    this.running = true;
    this._animate();

    // Listen for resize
    window.addEventListener('resize', this._resize.bind(this));

    // Tab visibility
    document.addEventListener('visibilitychange', this.handleVisibility);
  };

  SnakeField.prototype._resize = function () {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this._updateTargetCount();
  };

  SnakeField.prototype._updateTargetCount = function () {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const area = w * h;
    const isMobile = w < 768;
    const isTablet = w >= 768 && w < 1024;
    const density = this.reducedMotion ? 0.15 : 1;

    if (isMobile) {
      this.targetCount = Math.floor((25 + (area / 300000) * 25) * density);
    } else if (isTablet) {
      this.targetCount = Math.floor((60 + (area / 600000) * 40) * density);
    } else {
      this.targetCount = Math.floor((100 + (area / 1000000) * 80) * density);
    }

    this.targetCount = Math.max(this.targetCount, this.reducedMotion ? 5 : 15);
    this.targetCount = Math.min(this.targetCount, 300);
  };

  SnakeField.prototype._populateSnakes = function () {
    this.snakes = [];
    for (let i = 0; i < this.targetCount; i++) {
      this.snakes.push(createSnake(rng));
    }
    this.currentCount = this.snakes.length;
  };

  SnakeField.prototype._animate = function () {
    if (!this.running) return;

    // Pause when tab hidden
    if (!this.visible) {
      this.animFrame = requestAnimationFrame(this._animate.bind(this));
      return;
    }

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear with full transparency (draw over nothing — we use clearRect)
    ctx.clearRect(0, 0, w, h);

    // Only draw if not reduced motion or if we have static snakes
    const isStatic = this.reducedMotion;

    for (let i = 0; i < this.snakes.length; i++) {
      const s = this.snakes[i];
      this._updateSnake(s, isStatic);
      this._drawSnake(ctx, s, w, h);
    }

    this.animFrame = requestAnimationFrame(this._animate.bind(this));
  };

  SnakeField.prototype._updateSnake = function (s, isStatic) {
    if (isStatic) {
      // Static: just keep the position, no movement
      return;
    }

    // Slow movement in a direction, with waves
    // Keep snakes moving across the screen with wrapping
    const speed = s.speed * s.direction;

    // Occasionally do a loop (curl)
    if (s.loopChance > 0 && Math.random() < s.loopChance) {
      s.inLoop = !s.inLoop;
    }

    if (s.inLoop) {
      s.loopPhase += 0.02;
      if (s.loopPhase > Math.PI * 2) {
        s.inLoop = false;
        s.loopPhase = 0;
      }
    }

    // Move in a general direction, with slight drift
    s.x += speed * 0.008;
    s.y += Math.sin(s.phase + s.x * s.frequency * 100) * 0.003;

    // Wrap around edges
    if (s.x > 1.3) s.x = -0.3;
    if (s.x < -0.3) s.x = 1.3;
    if (s.y > 1.3) s.y = -0.3;
    if (s.y < -0.3) s.y = 1.3;

    s.phase += 0.003;
  };

  SnakeField.prototype._drawSnake = function (ctx, s, w, h) {
    const headX = s.x * w;
    const headY = s.y * h;
    const segLen = Math.max(4, s.thickness * 2.5);
    const totalLen = s.length * segLen;

    ctx.save();
    ctx.globalAlpha = s.opacity;

    // Build snake body as a wavy curve
    const points = [];
    let traveled = 0;

    for (let i = 0; i < s.length; i++) {
      const t = i / s.length;
      const dist = totalLen * t;

      // Wave offset
      let waveOffset = Math.sin(s.phase + dist * s.frequency * 0.5 + i * 0.3) * s.amplitude;

      // Loop curl modifier
      if (s.inLoop) {
        const loopAngle = s.loopPhase + t * Math.PI;
        waveOffset += Math.sin(loopAngle) * s.amplitude * 0.5;
      }

      const px = headX - dist * Math.cos(0.1) + waveOffset * 0.3;
      const py = headY - dist * 0.5 + waveOffset * 0.5;
      points.push({ x: px, y: py });
    }

    // Draw as a thick, smooth line with tapering
    if (points.length < 2) {
      ctx.restore();
      return;
    }

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];

      // Taper: head is thicker, tail is thinner
      const taperStart = s.length * 0.3;
      let lineW = s.thickness;
      if (i < taperStart) {
        // Thin tail
        lineW = s.thickness * (0.2 + 0.8 * (i / taperStart));
      }

      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.strokeStyle = s.color;
      ctx.lineWidth = lineW;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Draw tiny head dot (slightly larger)
    if (points.length > 0) {
      const head = points[0];
      ctx.beginPath();
      ctx.arc(head.x, head.y, s.thickness * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.globalAlpha = Math.min(1, s.opacity * 1.5);
      ctx.fill();
    }

    ctx.restore();
  };

  // ---- Safe zones: avoid drawing near game panel ----
  // We don't need to mask because the game panel sits ON TOP of the canvas
  // with its own white background, so snakes naturally show only around it.
  // The canvas renders full screen beneath everything — the HTML structure
  // keeps the game area clean.

  SnakeField.prototype._onVisibilityChange = function () {
    this.visible = !document.hidden;
  };

  SnakeField.prototype.destroy = function () {
    this.running = false;
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
    document.removeEventListener('visibilitychange', this.handleVisibility);
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  };

  // ---- Detect safe margin regions ----
  // The game container centers horizontally at max-width 600px.
  // Snakes fill the viewport but the #game-container (with white bg) sits on top,
  // so snakes don't obstruct gameplay. No masking needed.

  // Export
  window.SnakeField = SnakeField;
})();
