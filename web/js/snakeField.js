/**
 * Hiss-Tastic Ambient Snakes — smooth Snake.io-style segmented body locomotion.
 *
 * Each snake is a proper segmented follower:
 *   - Head at (this.x, this.y) moves with smooth steering — drawn separately
 *   - Body segments trail BEHIND the head, following via distance constraint
 *   - Rendered as overlapping circles: head first, body tapers to tail
 *   - Eyes and tongue face the movement direction (head-first)
 *   - Three size tiers for high density without sacrificing quality
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

  // ---- Palettes ----
  const COLORS = [
    '#2E7D32','#388E3C','#4CAF50','#43A047','#1B5E20','#558B2F',
    '#689F38','#7CB342','#827717','#9E9D24','#AFB42B','#C0CA33',
    '#BF360C','#D84315','#E64A19','#F57C00','#E65100','#FF8F00',
    '#00695C','#00796B','#00897B','#26A69A',
    '#4E342E','#5D4037','#3E2723','#33691E',
    '#A1887F','#8D6E63','#795548',
  ];

  const ACCENTS = [
    '#FFD600','#FFEA00','#FDD835','#FFC107',
    '#E0E0E0','#BDBDBD','#D7CCC8','#F5F5F5',
    '#1A1A1A','#2C2C2C','#333333',
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
      x: cx - panelW / 2 - 20,
      y: cy - panelH / 2 - 60,
      w: panelW + 40,
      h: panelH + 150,
    };
  }

  // ---- AmbientSnake ----
  class AmbientSnake {
    constructor(rng, viewW, viewH, safe, tier) {
      this.tier = tier || 'medium';

      // Head
      this.x = 0;
      this.y = 0;
      this.angle = rng() * Math.PI * 2;

      // Size preset by tier
      this._applyTier(rng);

      // Free-roaming wander steering
      this.wanderAngle = this.angle;
      this.wanderTimer = 0;
      this.wanderInterval = rng() * 120 + 60; // frames between wander target changes
      this.turnSpeed = rng() * 0.015 + 0.008; // how fast it can turn

      // Stuck detection
      this.stuckCheckX = 0;
      this.stuckCheckY = 0;
      this.stuckFrames = 0;

      // Personality
      const personalities = ['cruiser', 'wanderer', 'darter', 'glider'];
      this.personality = personalities[Math.floor(rng() * personalities.length)];
      this._applyPersonality(rng);

      // Body segments — populated after placement
      this.segments = [];
      this._placeInViewport(viewW, viewH, safe, rng);
    }

    _applyPersonality(rng) {
      switch (this.personality) {
        case 'cruiser':
          this.speed = rng() * 0.3 + 0.3;     // 0.3–0.6
          this.turnSpeed *= 0.6;               // slow turns
          break;
        case 'wanderer':
          this.speed = rng() * 0.4 + 0.4;     // 0.4–0.8
          this.wanderInterval = rng() * 200 + 100;
          break;
        case 'darter':
          this.speed = rng() * 0.6 + 0.7;     // 0.7–1.3
          this.turnSpeed *= 1.4;               // quick turns
          this.wanderInterval = rng() * 60 + 30;
          break;
        case 'glider':
          this.speed = rng() * 0.2 + 0.5;     // 0.5–0.7
          this.turnSpeed *= 0.4;               // very smooth
          this.wanderInterval = rng() * 300 + 200;
          break;
      }
    }

    _applyTier(rng) {
      switch (this.tier) {
        case 'large':
          this.segCount = Math.floor(rng() * 16) + 15;   // 15–30
          this.segSpacing = rng() * 3 + 4;                // 4–7 px
          this.headRadius = rng() * 4 + 5;                // 5–9 px
          this.bodyRadius = rng() * 2 + 3;                // 3–5 px
          this.hasAccent = rng() > 0.4;
          this.hasEyes = true;
          this.hasTongue = rng() > 0.4;
          break;
        case 'medium':
          this.segCount = Math.floor(rng() * 9) + 12;     // 12–20
          this.segSpacing = rng() * 2 + 3;                // 3–5 px
          this.headRadius = rng() * 2 + 4;                // 4–6 px
          this.bodyRadius = rng() * 1.5 + 2.5;            // 2.5–4 px
          this.hasAccent = rng() > 0.6;
          this.hasEyes = true;
          this.hasTongue = false;
          break;
        default: // tiny
          this.segCount = Math.floor(rng() * 6) + 8;      // 8–14
          this.segSpacing = rng() * 1.5 + 2.5;            // 2.5–4 px
          this.headRadius = rng() * 1.5 + 3.5;            // 3.5–5 px
          this.bodyRadius = rng() * 1 + 2.5;              // 2.5–3.5 px
          this.hasAccent = false;
          this.hasEyes = false;
          this.hasTongue = false;
          break;
      }

      this.color = COLORS[Math.floor(rng() * COLORS.length)];
      this.opacity = rng() * 0.2 + 0.7;
      this.accentColor = ACCENTS[Math.floor(rng() * ACCENTS.length)];
      this.accentInterval = rng() > 0.5 ? 3 : 4;
      this.tonguePhase = rng() * Math.PI * 2;
    }

    _placeInViewport(viewW, viewH, safe, rng) {
      const margin = 20;
      const choice = rng() * 7;
      let sx, sy;

      if (choice < 1) {
        sx = margin + rng() * (viewW - margin * 2);
        sy = margin + rng() * Math.max(10, safe.y * 0.5);
      } else if (choice < 2) {
        sx = margin + rng() * (viewW - margin * 2);
        sy = safe.y + safe.h + rng() * Math.max(10, viewH - safe.y - safe.h - margin);
        sy = Math.min(sy, viewH - margin);
      } else if (choice < 3) {
        sx = margin + rng() * Math.max(10, safe.x * 0.5);
        sy = margin + rng() * (viewH - margin * 2);
      } else if (choice < 4) {
        sx = safe.x + safe.w + rng() * Math.max(10, viewW - safe.x - safe.w - margin);
        sx = Math.min(sx, viewW - margin);
        sy = margin + rng() * (viewH - margin * 2);
      } else if (choice < 5) {
        sx = margin + rng() * Math.max(10, safe.x * 0.4);
        sy = margin + rng() * Math.max(10, safe.y * 0.4);
      } else if (choice < 6) {
        sx = safe.x + safe.w + rng() * Math.max(10, viewW - safe.x - safe.w - margin) * 0.5;
        sy = margin + rng() * Math.max(10, safe.y * 0.4);
      } else {
        sx = margin + rng() * Math.max(10, safe.x * 0.4);
        sy = safe.y + safe.h + rng() * Math.max(10, viewH - safe.y - safe.h - margin) * 0.5;
      }

      this.x = Math.max(margin, Math.min(viewW - margin, sx));
      this.y = Math.max(margin, Math.min(viewH - margin, sy));

      // Initialize body segments trailing BEHIND the head
      this.segments = [];
      for (let i = 0; i < this.segCount; i++) {
        this.segments.push({
          x: this.x - Math.cos(this.angle) * this.segSpacing * (i + 1),
          y: this.y - Math.sin(this.angle) * this.segSpacing * (i + 1),
        });
      }
    }

    /**
     * Respawn the snake in a new border position (used by stuck detection).
     */
    _respawn(viewW, viewH, safe) {
      this.wanderAngle = Math.random() * Math.PI * 2;
      this.angle = this.wanderAngle;
      this._placeInViewport(viewW, viewH, safe, rng);
    }

    /**
     * Update head position and body segments.
     * Free-roaming wandering: smooth random steering, edge avoidance, stuck detection.
     * segs[0] = neck, segs[n-1] = tail.
     */
    update(dt, viewW, viewH, safe) {
      // === Wander steering ===
      // Periodically pick a new wander target direction
      this.wanderTimer += dt;
      if (this.wanderTimer >= this.wanderInterval) {
        this.wanderTimer = 0;
        // Smooth random change: stay near current direction with some drift
        const drift = (Math.random() - 0.5) * 1.8;
        this.wanderAngle += drift;
      }

      // Smoothly steer toward wander target
      let targetAngle = this.wanderAngle;

      // Steer away from exclusion zone (stronger influence when closer)
      const safeCx = safe.x + safe.w / 2;
      const safeCy = safe.y + safe.h / 2;
      const dxSafe = this.x - safeCx;
      const dySafe = this.y - safeCy;
      const distSafe = Math.hypot(dxSafe, dySafe);
      const influenceR = Math.max(safe.w, safe.h) * 0.9;

      if (distSafe < influenceR && distSafe > 1) {
        const strength = Math.max(0, 1 - distSafe / influenceR) * 1.2;
        const awayAngle = Math.atan2(dySafe, dxSafe);
        // Blend wander target with away direction
        const blend = 1 / (1 + strength * 3);
        const diff = awayAngle - targetAngle;
        targetAngle += Math.atan2(Math.sin(diff), Math.cos(diff)) * (1 - blend);
      }

      // Steer toward target
      const angleDiff = targetAngle - this.angle;
      const maxTurn = this.turnSpeed * dt;
      this.angle += Math.sign(Math.sin(angleDiff)) * Math.min(Math.abs(Math.sin(angleDiff)), maxTurn);

      // === Move head ===
      const moveX = Math.cos(this.angle) * this.speed * 0.06 * dt;
      const moveY = Math.sin(this.angle) * this.speed * 0.06 * dt;
      this.x += moveX;
      this.y += moveY;

      // === Edge avoidance ===
      const edgeMargin = 25;
      const edgeStr = 0.04 * dt;
      if (this.x < edgeMargin) { this.angle += edgeStr; this.x = Math.max(0, this.x); }
      if (this.y < edgeMargin) { this.angle -= edgeStr; this.y = Math.max(0, this.y); }
      if (this.x > viewW - edgeMargin) { this.angle -= edgeStr; this.x = Math.min(viewW, this.x); }
      if (this.y > viewH - edgeMargin) { this.angle += edgeStr; this.y = Math.min(viewH, this.y); }

      // === Hard wrap (only when fully off-screen) ===
      if (this.x < -80) this.x = viewW + 70;
      if (this.x > viewW + 80) this.x = -70;
      if (this.y < -80) this.y = viewH + 70;
      if (this.y > viewH + 80) this.y = -70;

      // === Stuck detection ===
      // Check if snake hasn't moved meaningfully in ~2 seconds (120 frames)
      this.stuckFrames += dt;
      if (this.stuckFrames > 120) {
        const dist = Math.hypot(this.x - this.stuckCheckX, this.y - this.stuckCheckY);
        if (dist < 20) {
          // Reorient: pick a completely new direction
          this.wanderAngle = Math.random() * Math.PI * 2;
          this.angle = this.wanderAngle;
          // If stuck in the exclusion zone, respawn outside it
          if (distSafe < 100) {
            this._respawn(viewW, viewH, safe);
          }
        }
        this.stuckCheckX = this.x;
        this.stuckCheckY = this.y;
        this.stuckFrames = 0;
      }

      // === Body segments follow ===
      const spacing = this.segSpacing;
      const segs = this.segments;
      this._follow(this.x, this.y, segs[0], spacing);
      for (let i = 1; i < segs.length; i++) {
        this._follow(segs[i - 1].x, segs[i - 1].y, segs[i], spacing);
      }
    }

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
     * Draw the snake head-first.
     * Head at (this.x, this.y) with eyes/tongue facing this.angle.
     * Body segments drawn from neck (segs[0]) to tail (segs[n-1]),
     * iterating tail→head so head overlaps body.
     */
    draw(ctx) {
      const segs = this.segments;
      if (segs.length < 2) return;

      ctx.save();

      // ---- Body: draw from tail to head so head overlaps ----
      for (let i = segs.length - 1; i >= 0; i--) {
        const seg = segs[i];
        // Taper: segs[0] (neck) = thickest, segs[n-1] (tail) = thinnest
        const t = 1 - i / (segs.length - 1); // 1 = neck, 0 = tail
        const radius = this.bodyRadius + (this.headRadius - this.bodyRadius) * t * 0.7;

        // Shadow
        ctx.beginPath();
        ctx.arc(seg.x + 1.2, seg.y + 1.2, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.globalAlpha = this.opacity * 0.3;
        ctx.fill();

        // Body circle
        ctx.beginPath();
        ctx.arc(seg.x, seg.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.fill();

        // Accent stripe
        if (this.hasAccent && i > 1 && i < segs.length - 2 && i % this.accentInterval === 0) {
          ctx.beginPath();
          ctx.arc(seg.x, seg.y, radius * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = this.accentColor;
          ctx.globalAlpha = this.opacity * 0.35;
          ctx.fill();
        }
      }

      // ---- Head: drawn at (this.x, this.y) — the actual head position ----
      const headR = this.headRadius;
      const angle = this.angle; // movement direction

      // Head shadow
      ctx.beginPath();
      ctx.arc(this.x + 1.5, this.y + 1.5, headR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.globalAlpha = this.opacity * 0.3;
      ctx.fill();

      // Head circle
      ctx.beginPath();
      ctx.arc(this.x, this.y, headR, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = Math.min(1, this.opacity * 1.1);
      ctx.fill();

      // Head highlight (top-forward)
      ctx.beginPath();
      ctx.arc(
        this.x + Math.cos(angle) * headR * 0.3 - Math.sin(angle) * headR * 0.2,
        this.y + Math.sin(angle) * headR * 0.3 + Math.cos(angle) * headR * 0.2,
        headR * 0.3, 0, Math.PI * 2
      );
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.globalAlpha = Math.min(1, this.opacity * 1.1);
      ctx.fill();

      // Eyes — face movement direction
      if (this.hasEyes && headR > 2.5) {
        const eyeR = Math.max(1.2, headR * 0.2);
        const eDist = headR * 0.5;
        for (let s = -1; s <= 1; s += 2) {
          const ex = this.x + Math.cos(angle) * eDist * 0.2 + Math.sin(angle) * s * eDist * 0.55;
          const ey = this.y + Math.sin(angle) * eDist * 0.2 - Math.cos(angle) * s * eDist * 0.55;
          ctx.beginPath();
          ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0,0,0,0.75)';
          ctx.globalAlpha = Math.min(1, this.opacity * 1.3);
          ctx.fill();
        }
      }

      // Tongue flick — extends forward from head
      if (this.hasTongue) {
        const flick = Math.sin(performance.now() * 0.004 + this.tonguePhase);
        if (flick > 0.6) {
          const tLen = headR * 1.3;
          const fA = 0.35;
          const tx = this.x + Math.cos(angle) * (headR + 3);
          const ty = this.y + Math.sin(angle) * (headR + 3);
          const alpha = this.opacity * 0.6 * ((flick - 0.6) / 0.4);

          ctx.strokeStyle = '#CC4444';
          ctx.lineWidth = 1.2;
          ctx.globalAlpha = alpha;

          // Stem
          ctx.beginPath();
          ctx.moveTo(this.x + Math.cos(angle) * headR * 0.6, this.y + Math.sin(angle) * headR * 0.6);
          ctx.lineTo(tx, ty);
          ctx.stroke();

          // Fork left
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(tx + Math.cos(angle - fA) * tLen * 0.5, ty + Math.sin(angle - fA) * tLen * 0.5);
          ctx.stroke();

          // Fork right
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(tx + Math.cos(angle + fA) * tLen * 0.5, ty + Math.sin(angle + fA) * tLen * 0.5);
          ctx.stroke();
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

  /**
   * Three-tier snake population for high density.
   * Large:  full detail (eyes, tongue, bands) — ~10%
   * Medium: eyes only — ~25%
   * Tiny:   minimal (head + body circles) — ~65%
   */
  SnakeField.prototype._populateSnakes = function () {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const isMobile = w < 768;
    const isTablet = w >= 768 && w < 1024;
    const isLarge = w >= 1400;
    const density = this.reducedMotion ? 0.15 : 1;

    let totalCount;
    if (isMobile) {
      totalCount = Math.floor((18 + Math.random() * 17) * density);         // 18–35
    } else if (isTablet) {
      totalCount = Math.floor((35 + Math.random() * 35) * density);         // 35–70
    } else if (isLarge) {
      totalCount = Math.floor((100 + Math.random() * 80) * density);        // 100–180
    } else {
      totalCount = Math.floor((60 + Math.random() * 60) * density);         // 60–120
    }

    const safe = getSafeZone();
    this.snakes = [];

    // Large snakes: ~10%
    const largeCount = Math.max(2, Math.floor(totalCount * 0.1));
    for (let i = 0; i < largeCount; i++) {
      this.snakes.push(new AmbientSnake(rng, w, h, safe, 'large'));
    }

    // Medium snakes: ~25%
    const mediumCount = Math.max(3, Math.floor(totalCount * 0.25));
    for (let i = 0; i < mediumCount; i++) {
      this.snakes.push(new AmbientSnake(rng, w, h, safe, 'medium'));
    }

    // Tiny snakes: remainder (~65%)
    for (let i = this.snakes.length; i < totalCount; i++) {
      this.snakes.push(new AmbientSnake(rng, w, h, safe, 'tiny'));
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

  window.SnakeField = SnakeField;
})();
