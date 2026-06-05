/**
 * Hiss-Tastic Snake Field — animated decorative background snakes.
 *
 * Each snake is a proper body-following-head creature with:
 *   - head position + heading angle + velocity
 *   - sinusoidal lateral undulation for natural slithering
 *   - trail-based body that follows the head path
 *   - tapered body, rounded head, tiny eyes
 *
 * Rendered on a fixed background Canvas 2D layer behind the game panel.
 * No external dependencies, no image assets.
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

  const SEED = 42;
  const rng = createRNG(SEED);

  // ---- Rich colour palette (snake-like greens, browns, earthy tones) ----
  const COLORS = [
    // Greens (most snake-like)
    '#2E7D32', '#388E3C', '#4CAF50', '#43A047', '#1B5E20',
    '#66BB6A', '#81C784', '#2E7D32', '#558B2F', '#33691E',
    '#689F38', '#7CB342', '#8BC34A', '#9CCC65',
    // Olive / brown-greens
    '#827717', '#9E9D24', '#AFB42B', '#C0CA33',
    '#6D4C41', '#5D4037', '#4E342E', '#3E2723',
    // Copper / tan (corn snake-like)
    '#BF360C', '#D84315', '#E64A19', '#F57C00',
    '#FF8F00', '#FF6F00', '#E65100',
    // Teal / blue-green (tree snake-like)
    '#00695C', '#00796B', '#00897B', '#26A69A',
    '#4DB6AC', '#80CBC4', '#B2DFDB',
  ];

  // ---- Exclusion zone (center panel area) ----
  function getExclusionZone() {
    // The game container is centered, max-width ~600px.
    // We reserve a generous clear zone around it.
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Center region — roughly where the game panel + controls sit
    const cx = w / 2;
    const cy = h / 2;
    const zoneW = Math.min(660, w * 0.7);
    const zoneH = Math.min(520, h * 0.65);

    return {
      x: cx - zoneW / 2,
      y: cy - zoneH / 2,
      w: zoneW,
      h: zoneH,
    };
  }

  function isInExclusion(x, y, zone) {
    return x >= zone.x && x <= zone.x + zone.w &&
           y >= zone.y && y <= zone.y + zone.h;
  }

  // ---- FieldSnake class ----
  class FieldSnake {
    constructor(rng, bounds) {
      const w = bounds.w;
      const h = bounds.h;

      // Position in pixel coords — spawn in the visible area but outside exclusion
      this.x = rng() * w;
      this.y = rng() * h;

      // Heading angle (radians)
      this.angle = rng() * Math.PI * 2;

      // Speed (px per frame)
      this.speed = rng() * 1.8 + 0.6;

      // Body length in segments
      this.length = Math.floor(rng() * 20) + 8; // 8–28

      // Body thickness (px)
      this.baseThickness = rng() * 3.5 + 2.0; // 2.0–5.5

      // Sinusoidal undulation parameters
      this.phase = rng() * Math.PI * 2;
      this.waveSpeed = rng() * 0.04 + 0.015; // how fast undulation oscillates
      this.turnStrength = rng() * 1.2 + 0.6; // how sharp the turns are

      // Turn bias — gentle persistent drift so snakes curve naturally
      this.turnBias = (rng() - 0.5) * 0.3;

      // Color
      this.color = COLORS[Math.floor(rng() * COLORS.length)];

      // Opacity — higher than before for visibility
      this.opacity = rng() * 0.35 + 0.35; // 0.35–0.70

      // Scale variation for size diversity
      this.scale = rng() * 0.5 + 0.7; // 0.7–1.2

      // Trail — history of head positions for body following
      this.trail = [];

      // Steering-away from exclusion zone
      this.steerAway = 0;

      // Ensure initial spawn is outside exclusion (with retries)
      const exclusion = getExclusionZone();
      let attempts = 0;
      while (isInExclusion(this.x, this.y, exclusion) && attempts < 50) {
        this.x = rng() * w;
        this.y = rng() * h;
        attempts++;
      }

      // Pre-fill trail with initial position
      for (let i = 0; i < this.length; i++) {
        this.trail.push({ x: this.x, y: this.y });
      }
    }

    /**
     * Update snake position and trail.
     */
    update(dt, bounds) {
      // Sinusoidal lateral undulation — the key to natural slithering
      this.phase += this.waveSpeed * dt;

      // Compute undulation offset
      const wave = Math.sin(this.phase) * this.turnStrength;

      // Add gentle persistent turn bias for natural curvature
      const bias = this.turnBias * 0.15;

      // Steer away from exclusion zone center
      const exclusion = getExclusionZone();
      const exCenterX = exclusion.x + exclusion.w / 2;
      const exCenterY = exclusion.y + exclusion.h / 2;
      const distToCenter = Math.hypot(this.x - exCenterX, this.y - exCenterY);
      const steerRadius = Math.max(exclusion.w, exclusion.h) * 0.8;

      let steerX = 0;
      let steerY = 0;
      if (distToCenter < steerRadius) {
        // Gentle push away from center
        const strength = (1 - distToCenter / steerRadius) * 0.4;
        steerX = ((this.x - exCenterX) / distToCenter) * strength;
        steerY = ((this.y - exCenterY) / distToCenter) * strength;
      }

      // Compute steering angle from push
      const steerAngle = Math.atan2(steerY, steerX);

      // Combine: undulation + bias + steering
      this.angle += (wave + bias) * (dt * 0.06) + steerAngle * (dt * 0.04);

      // Move head forward in heading direction
      const moveX = Math.cos(this.angle) * this.speed * dt * 0.06;
      const moveY = Math.sin(this.angle) * this.speed * dt * 0.06;
      this.x += moveX;
      this.y += moveY;

      // Wrap around screen edges
      if (this.x > bounds.w + 20) this.x = -20;
      if (this.x < -20) this.x = bounds.w + 20;
      if (this.y > bounds.h + 20) this.y = -20;
      if (this.y < -20) this.y = bounds.h + 20;

      // Prepend new head position to trail
      this.trail.unshift({ x: this.x, y: this.y });

      // Trim trail to snake length
      if (this.trail.length > this.length) {
        this.trail.length = this.length;
      }
    }

    /**
     * Draw the snake from tail to head with tapered body.
     */
    draw(ctx) {
      if (this.trail.length < 2) return;

      const trail = this.trail;
      const len = trail.length;

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Draw body segments from tail to head
      for (let i = len - 2; i >= 0; i--) {
        const seg = trail[i];
        const next = trail[i + 1];
        const t = i / (len - 1); // 0 = tail, 1 = head

        // Taper: head is thickest, tail is thinnest
        const thickness = this.baseThickness * this.scale * (0.15 + 0.85 * t);

        ctx.beginPath();
        ctx.moveTo(seg.x, seg.y);
        ctx.lineTo(next.x, next.y);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = thickness;
        ctx.globalAlpha = this.opacity;
        ctx.stroke();
      }

      // Draw head — distinct circle/ellipse
      const head = trail[len - 1];
      if (head) {
        const headSize = this.baseThickness * this.scale * 0.9;

        // Head circle
        ctx.beginPath();
        ctx.arc(head.x, head.y, headSize, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = Math.min(1, this.opacity * 1.3);
        ctx.fill();

        // Head highlight (tiny shine)
        ctx.beginPath();
        ctx.arc(head.x - headSize * 0.25, head.y - headSize * 0.25, headSize * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fill();

        // Eyes — two tiny dots
        if (this.baseThickness * this.scale > 2.5) {
          const eyeOffset = headSize * 0.4;
          const eyeSize = Math.max(1.2, headSize * 0.22);

          // Eye direction hint from heading
          const ex = Math.cos(this.angle) * eyeOffset;
          const ey = Math.sin(this.angle) * eyeOffset;

          for (let side = -1; side <= 1; side += 2) {
            const perpX = -Math.sin(this.angle) * side * eyeOffset * 0.5;
            const perpY = Math.cos(this.angle) * side * eyeOffset * 0.5;

            ctx.beginPath();
            ctx.arc(
              head.x + ex * 0.5 + perpX,
              head.y + ey * 0.5 + perpY,
              eyeSize, 0, Math.PI * 2
            );
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.globalAlpha = Math.min(1, this.opacity * 1.5);
            ctx.fill();
          }
        }
      }

      ctx.restore();
    }
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
    this.lastTime = 0;
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

    // Resize and create snakes
    this._resize();

    // Start animation
    this.running = true;
    this.lastTime = performance.now();
    this._animate(this.lastTime);

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
    this._populateSnakes();
  };

  SnakeField.prototype._updateTargetCount = function () {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const area = w * h;
    const isMobile = w < 768;
    const isTablet = w >= 768 && w < 1024;
    const density = this.reducedMotion ? 0.12 : 1;

    if (isMobile) {
      this.targetCount = Math.floor((35 + (area / 300000) * 35) * density);
    } else if (isTablet) {
      this.targetCount = Math.floor((70 + (area / 600000) * 50) * density);
    } else {
      this.targetCount = Math.floor((120 + (area / 1000000) * 100) * density);
    }

    this.targetCount = Math.max(this.targetCount, this.reducedMotion ? 8 : 20);
    this.targetCount = Math.min(this.targetCount, 350);
  };

  SnakeField.prototype._populateSnakes = function () {
    const bounds = {
      w: this.canvas.width,
      h: this.canvas.height,
    };

    this.snakes = [];
    for (let i = 0; i < this.targetCount; i++) {
      this.snakes.push(new FieldSnake(rng, bounds));
    }
    this.currentCount = this.snakes.length;
  };

  SnakeField.prototype._animate = function (timestamp) {
    if (!this.running) return;

    // Pause when tab hidden
    if (!this.visible) {
      this.lastTime = timestamp;
      this.animFrame = requestAnimationFrame(this._animate.bind(this));
      return;
    }

    const dt = Math.min(timestamp - this.lastTime, 50); // cap dt to 50ms
    this.lastTime = timestamp;

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Update and draw each snake
    const bounds = { w: w, h: h };

    for (let i = 0; i < this.snakes.length; i++) {
      const snake = this.snakes[i];

      if (!this.reducedMotion) {
        snake.update(dt, bounds);
      }
      // Always draw (even static in reduced-motion mode)
      snake.draw(ctx);
    }

    this.animFrame = requestAnimationFrame(this._animate.bind(this));
  };

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

  // Export
  window.SnakeField = SnakeField;
})();
