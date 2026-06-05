/**
 * Hiss-Tastic Ambient Snakes — smooth Snake.io-style segmented body locomotion.
 *
 * Each snake is a proper segmented follower:
 *   - Head moves continuously with smooth steering
 *   - Body segments follow the previous segment via distance constraint
 *   - Rendered as overlapping circles for smooth capsule bodies
 *   - Wanders near viewport edges, avoids central game UI
 *
 * Canvas 2D, no external deps, no image assets.
 */

(function () {
  'use strict';

  // ---- Seeded PRNG ----
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

  // ---- Snake-like palette ----
  const COLORS = [
    '#2E7D32', '#388E3C', '#4CAF50', '#43A047', '#1B5E20', '#558B2F',
    '#689F38', '#7CB342', '#827717', '#9E9D24', '#AFB42B', '#C0CA33',
    '#BF360C', '#D84315', '#E64A19', '#F57C00', '#E65100', '#FF8F00',
    '#00695C', '#00796B', '#00897B', '#26A69A',
    '#4E342E', '#5D4037', '#3E2723', '#33691E',
  ];

  const ACCENT_COLORS = [
    '#FFD600', '#FFEA00', '#FDD835', '#FFC107',
    '#E0E0E0', '#BDBDBD', '#D7CCC8', '#F5F5F5',
    '#1A1A1A', '#2C2C2C', '#333333',
  ];

  // ---- Safe zone ----
  function getSafeZone() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const panelW = Math.min(600, w * 0.85);
    const panelH = Math.min(400, h * 0.45);
    const cx = w / 2;
    const cy = h / 2;
    return {
      x: cx - panelW / 2 - 25,
      y: cy - panelH / 2 - 60,
      w: panelW + 50,
      h: panelH + 150,
    };
  }

  // ---- AmbientSnake ----
  class AmbientSnake {
    constructor(rng, viewW, viewH, safe) {
      // Head
      this.x = 0;
      this.y = 0;
      this.angle = rng() * Math.PI * 2;
      this.speed = rng() * 0.6 + 0.4; // px per tick

      // Steering
      this.steerPhase = rng() * Math.PI * 2;
      this.steerSpeed = rng() * 0.02 + 0.008;
      this.steerAmplitude = rng() * 1.2 + 0.6;
      this.steerBias = (rng() - 0.5) * 0.15;

      // Body dimensions
      this.segCount = Math.floor(rng() * 18) + 12; // 12–30 segments
      this.segSpacing = rng() * 4 + 4;              // 4–8 px between segments
      this.headRadius = rng() * 4 + 5;              // 5–9 px
      this.bodyRadius = rng() * 3 + 3;              // 3–6 px

      // Visual
      this.color = COLORS[Math.floor(rng() * COLORS.length)];
      this.opacity = rng() * 0.2 + 0.7; // 0.7–0.9
      this.hasAccent = rng() > 0.55;
      this.accentColor = ACCENT_COLORS[Math.floor(rng() * ACCENT_COLORS.length)];
      this.accentInterval = rng() > 0.5 ? 3 : 4; // every Nth segment
      this.hasEyes = true;
      this.hasTongue = rng() > 0.5;
      this.tonguePhase = rng() * Math.PI * 2;

      // Body segments array — populated after placement
      this.segments = [];

      // Place snake in border zone
      this._placeInViewport(viewW, viewH, safe, rng);
    }

    /**
     * Place snake in a border zone and initialize body segments.
     */
    _placeInViewport(viewW, viewH, safe, rng) {
      const margin = 30;
      const choice = rng() * 7;
      let sx, sy;

      if (choice < 1) {
        // Top
        sx = margin + rng() * (viewW - margin * 2);
        sy = margin + rng() * (safe.y * 0.6);
      } else if (choice < 2) {
        // Bottom
        sx = margin + rng() * (viewW - margin * 2);
        sy = safe.y + safe.h + rng() * (viewH - safe.y - safe.h - margin);
      } else if (choice < 3) {
        // Left
        sx = margin + rng() * (safe.x * 0.6);
        sy = margin + rng() * (viewH - margin * 2);
      } else if (choice < 4) {
        // Right
        sx = safe.x + safe.w + rng() * (viewW - safe.x - safe.w - margin);
        sy = margin + rng() * (viewH - margin * 2);
      } else if (choice < 5) {
        // Top-left corner
        sx = margin + rng() * (safe.x * 0.5);
        sy = margin + rng() * (safe.y * 0.5);
      } else if (choice < 6) {
        // Top-right corner
        sx = safe.x + safe.w + rng() * (viewW - safe.x - safe.w - margin) * 0.6;
        sy = margin + rng() * (safe.y * 0.5);
      } else if (choice < 7) {
        // Bottom-left corner
        sx = margin + rng() * (safe.x * 0.5);
        sy = safe.y + safe.h + rng() * (viewH - safe.y - safe.h - margin) * 0.6;
      } else {
        // Bottom-right corner
        sx = safe.x + safe.w + rng() * (viewW - safe.x - safe.w - margin) * 0.6;
        sy = safe.y + safe.h + rng() * (viewH - safe.y - safe.h - margin) * 0.6;
      }

      this.x = Math.max(margin, Math.min(viewW - margin, sx));
      this.y = Math.max(margin, Math.min(viewH - margin, sy));

      // Initialize segments trailing behind the head
      this.segments = [];
      for (let i = 0; i < this.segCount; i++) {
        this.segments.push({
          x: this.x - Math.cos(this.angle) * this.segSpacing * (i + 1),
          y: this.y - Math.sin(this.angle) * this.segSpacing * (i + 1),
        });
      }
    }

    /**
     * Update head position and body segments.
     */
    update(dt, viewW, viewH, safe) {
      // Steering: sinusoidal + bias + exclusion avoidance
      this.steerPhase += this.steerSpeed * dt;

      let steering = Math.sin(this.steerPhase) * this.steerAmplitude + this.steerBias;

      // Steer away from exclusion zone
      const safeCx = safe.x + safe.w / 2;
      const safeCy = safe.y + safe.h / 2;
      const dxSafe = this.x - safeCx;
      const dySafe = this.y - safeCy;
      const distSafe = Math.hypot(dxSafe, dySafe);
      const influenceR = Math.max(safe.w, safe.h) * 0.8;

      if (distSafe < influenceR && distSafe > 0) {
        const strength = (1 - distSafe / influenceR) * 0.8;
        const steerAway = Math.atan2(dySafe, dxSafe);
        // Blend steering toward away angle
        const angleDiff = steerAway - this.angle;
        steering += Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff)) * strength * 0.06 * dt;
      }

      // Apply steering to angle
      this.angle += steering * 0.04 * dt;

      // Move head
      const moveX = Math.cos(this.angle) * this.speed * 0.06 * dt;
      const moveY = Math.sin(this.angle) * this.speed * 0.06 * dt;
      this.x += moveX;
      this.y += moveY;

      // Soft edge wrapping: push away from edges to encourage border roaming
      const edgeMargin = 20;
      if (this.x < edgeMargin) { this.angle += 0.02 * dt; this.x = Math.max(0, this.x); }
      if (this.y < edgeMargin) { this.angle -= 0.02 * dt; this.y = Math.max(0, this.y); }
      if (this.x > viewW - edgeMargin) { this.angle -= 0.02 * dt; this.x = Math.min(viewW, this.x); }
      if (this.y > viewH - edgeMargin) { this.angle += 0.02 * dt; this.y = Math.min(viewH, this.y); }

      // Hard edge wrap (teleport to opposite side if fully off-screen)
      if (this.x < -50) this.x = viewW + 40;
      if (this.x > viewW + 50) this.x = -40;
      if (this.y < -50) this.y = viewH + 40;
      if (this.y > viewH + 50) this.y = -40;

      // Update body segments: each follows the one in front
      // seg[0] follows head, seg[1] follows seg[0], etc.
      const spacing = this.segSpacing;
      const segs = this.segments;

      // First segment follows head
      this._follow(this.x, this.y, segs[0], spacing);

      // Remaining segments follow previous
      for (let i = 1; i < segs.length; i++) {
        this._follow(segs[i - 1].x, segs[i - 1].y, segs[i], spacing);
      }
    }

    /**
     * Move `seg` toward `target` keeping it at `spacing` distance.
     */
    _follow(tx, ty, seg, spacing) {
      const dx = tx - seg.x;
      const dy = ty - seg.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.5) return;
      const move = dist - spacing;
      if (move > 0) {
        seg.x += (dx / dist) * move;
        seg.y += (dy / dist) * move;
      }
    }

    /**
     * Draw the snake as overlapping circles.
     */
    draw(ctx) {
      const segs = this.segments;
      if (segs.length < 2) return;

      ctx.save();

      // Draw from tail to head for proper overlap
      for (let i = segs.length - 1; i >= 0; i--) {
        const t = i / (segs.length - 1); // 0 = tail, 1 = head
        const seg = segs[i];
        const radius = this.bodyRadius + (this.headRadius - this.bodyRadius) * t;

        // Shadow beneath each segment for depth
        ctx.beginPath();
        ctx.arc(seg.x + 1.5, seg.y + 1.5, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.globalAlpha = this.opacity * 0.3;
        ctx.fill();

        // Main body circle
        ctx.beginPath();
        ctx.arc(seg.x, seg.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.fill();

        // Accent stripe on alternating segments
        if (this.hasAccent && i > 1 && i < segs.length - 2 && i % this.accentInterval === 0) {
          const accentR = radius * 0.55;
          ctx.beginPath();
          ctx.arc(seg.x, seg.y, accentR, 0, Math.PI * 2);
          ctx.fillStyle = this.accentColor;
          ctx.globalAlpha = this.opacity * 0.4;
          ctx.fill();
        }

        // Head: eyes + highlight
        if (i === segs.length - 1) {
          const next = segs[segs.length - 2] || { x: seg.x - 1, y: seg.y };
          const angle = Math.atan2(seg.y - next.y, seg.x - next.x);
          const headR = radius;

          // Head highlight
          ctx.beginPath();
          ctx.arc(seg.x - headR * 0.15, seg.y - headR * 0.25, headR * 0.35, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.25)';
          ctx.globalAlpha = Math.min(1, this.opacity * 1.1);
          ctx.fill();

          // Eyes
          if (this.hasEyes && headR > 3) {
            const eyeR = Math.max(1.5, headR * 0.22);
            const eDist = headR * 0.5;
            for (let s = -1; s <= 1; s += 2) {
              const ex = seg.x + Math.cos(angle) * eDist * 0.3 + Math.sin(angle) * s * eDist * 0.6;
              const ey = seg.y + Math.sin(angle) * eDist * 0.3 - Math.cos(angle) * s * eDist * 0.6;
              ctx.beginPath();
              ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(0,0,0,0.75)';
              ctx.globalAlpha = Math.min(1, this.opacity * 1.3);
              ctx.fill();
            }
          }

          // Tongue flick
          if (this.hasTongue) {
            const flick = Math.sin(performance.now() * 0.004 + this.tonguePhase);
            if (flick > 0.6) {
              const tLen = headR * 1.4;
              const fA = 0.35;
              const tx = seg.x + Math.cos(angle) * (headR + 3);
              const ty = seg.y + Math.sin(angle) * (headR + 3);
              const alpha = this.opacity * 0.6 * ((flick - 0.6) / 0.4);

              ctx.strokeStyle = '#CC4444';
              ctx.lineWidth = 1.5;
              ctx.globalAlpha = alpha;

              ctx.beginPath();
              ctx.moveTo(seg.x + Math.cos(angle) * headR * 0.6, seg.y + Math.sin(angle) * headR * 0.6);
              ctx.lineTo(tx, ty);
              ctx.stroke();

              ctx.beginPath();
              ctx.moveTo(tx, ty);
              ctx.lineTo(tx + Math.cos(angle - fA) * tLen * 0.5, ty + Math.sin(angle - fA) * tLen * 0.5);
              ctx.stroke();

              ctx.beginPath();
              ctx.moveTo(tx, ty);
              ctx.lineTo(tx + Math.cos(angle + fA) * tLen * 0.5, ty + Math.sin(angle + fA) * tLen * 0.5);
              ctx.stroke();
            }
          }
        }
      }

      ctx.restore();
    }
  }

  // ---- Main SnakeField ----
  function SnakeField() {
    this.canvas = null;
    this.ctx = null;
    this.snakes = [];
    this.animFrame = null;
    this.running = false;
    this.reducedMotion = false;
    this.visible = true;
    this.startTime = 0;
    this.handleVis = this._onVisibilityChange.bind(this);
  }

  SnakeField.prototype.init = function () {
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

    document.body.insertBefore(this.canvas, document.body.firstChild);

    this._resize();
    this.running = true;
    this.startTime = performance.now();
    this._animate(this.startTime);

    window.addEventListener('resize', this._resize.bind(this));
    document.addEventListener('visibilitychange', this.handleVis);
  };

  SnakeField.prototype._resize = function () {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this._populateSnakes();
  };

  SnakeField.prototype._populateSnakes = function () {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const isMobile = w < 768;
    const isTablet = w >= 768 && w < 1024;
    const density = this.reducedMotion ? 0.4 : 1;

    let count;
    if (isMobile) count = Math.floor((4 + Math.random() * 4) * density);
    else if (isTablet) count = Math.floor((6 + Math.random() * 6) * density);
    else count = Math.floor((10 + Math.random() * 8) * density);

    const safe = getSafeZone();
    this.snakes = [];
    for (let i = 0; i < count; i++) {
      this.snakes.push(new AmbientSnake(rng, w, h, safe));
    }
  };

  SnakeField.prototype._animate = function (timestamp) {
    if (!this.running) return;

    if (!this.visible) {
      this.startTime = timestamp;
      this.animFrame = requestAnimationFrame(this._animate.bind(this));
      return;
    }

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const dt = Math.min(timestamp - this.startTime, 33);
    this.startTime = timestamp;

    ctx.clearRect(0, 0, w, h);

    const safe = getSafeZone();

    if (this.reducedMotion) {
      // Static render
      for (let i = 0; i < this.snakes.length; i++) {
        this.snakes[i].draw(ctx);
      }
    } else {
      for (let i = 0; i < this.snakes.length; i++) {
        this.snakes[i].update(dt, w, h, safe);
        this.snakes[i].draw(ctx);
      }
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
    }
    document.removeEventListener('visibilitychange', this.handleVis);
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  };

  // Export
  window.SnakeField = SnakeField;
})();
