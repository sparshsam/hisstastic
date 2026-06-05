/**
 * Hiss-Tastic — single large ambient snake with path-following body.
 *
 * This is a foundation prototype: ONE snake with natural slithering motion.
 * The head moves forward with smooth organic steering. The body is sampled
 * from a path history array at increasing distances behind the head,
 * producing clean, continuous body curves.
 *
 * Once this works convincingly, future branches can duplicate the snake
 * for higher density.
 *
 * Canvas 2D, no external deps, no image assets.
 */

(function () {
  'use strict';

  // ---- Debug toggle (off by default) ----
  const DEBUG = window.HISS_DEBUG_SNAKE === true;

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

  const rng = createRNG(42);

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
      y: cy - panelH / 2 - 65,
      w: panelW + 50,
      h: panelH + 160,
    };
  }

  // ---- Single Prototype Snake ----
  class PrototypeSnake {
    constructor(rng, viewW, viewH, safe) {
      // Head
      this.x = viewW / 2;
      this.y = rng() * viewH * 0.3 + viewH * 0.1; // spawn in upper area
      this.angle = rng() * 0.5 + 0.2; // slight right-down

      // Speed
      this.speed = rng() * 0.3 + 0.35; // 0.35–0.65

      // Smooth steering
      this.wanderAngle = this.angle;
      this.wanderTimer = 0;
      this.wanderInterval = rng() * 200 + 150; // change target every N frames
      this.turnSpeed = rng() * 0.006 + 0.004; // gentle turning

      // Visual
      this.color = '#2E7D32';
      this.opacity = 0.85;

      // Head
      this.headRadius = rng() * 3 + 9; // 9–12 px

      // Body
      this.bodyThickness = rng() * 3 + 6; // 6–9 px
      this.segmentSpacing = 6; // px between path samples
      this.segmentCount = 55; // 55 segments × 6px = 330px body length

      // Path history (stores head positions)
      this.path = [];
      this.maxPathLength = this.segmentCount + 20;

      // Tongue
      this.hasTongue = true;
      this.tonguePhase = rng() * Math.PI * 2;

      // Exclusion zone tracking for smooth avoidance
      this._lastSteer = 0;

      // Populate initial path behind the head
      for (let i = 0; i < this.maxPathLength; i++) {
        this.path.push({
          x: this.x - Math.cos(this.angle) * this.segmentSpacing * (i + 1) * 0.5,
          y: this.y - Math.sin(this.angle) * this.segmentSpacing * (i + 1) * 0.5,
        });
      }
    }

    /**
     * Update head position and path.
     */
    update(dt, viewW, viewH, safe) {
      // === Wander steering ===
      this.wanderTimer += dt;
      if (this.wanderTimer >= this.wanderInterval) {
        this.wanderTimer = 0;
        // Gentle random drift
        this.wanderAngle += (Math.random() - 0.5) * 1.2;
      }

      let targetAngle = this.wanderAngle;

      // === Exclusion zone avoidance ===
      const cx = safe.x + safe.w / 2;
      const cy = safe.y + safe.h / 2;
      const dx = this.x - cx;
      const dy = this.y - cy;
      const dist = Math.hypot(dx, dy);
      const influenceR = Math.max(safe.w, safe.h) * 0.9;

      if (dist < influenceR && dist > 1) {
        const strength = Math.max(0, 1 - dist / influenceR) * 1.5;
        const awayAngle = Math.atan2(dy, dx);
        const diff = awayAngle - targetAngle;
        targetAngle += Math.atan2(Math.sin(diff), Math.cos(diff)) * (strength / (1 + strength));
      }

      // === Edge avoidance ===
      const edge = 40;
      if (this.x < edge) targetAngle += 0.3;
      if (this.x > viewW - edge) targetAngle -= 0.3;
      if (this.y < edge) targetAngle -= 0.3;
      if (this.y > viewH - edge) targetAngle += 0.3;

      // === Steer toward target ===
      const diff = targetAngle - this.angle;
      const maxTurn = this.turnSpeed * dt;
      this.angle += Math.sign(Math.sin(diff)) * Math.min(Math.abs(Math.sin(diff)), maxTurn);

      // === Move head ===
      this.x += Math.cos(this.angle) * this.speed * 0.06 * dt;
      this.y += Math.sin(this.angle) * this.speed * 0.06 * dt;

      // === Soft edge clamp ===
      this.x = Math.max(5, Math.min(viewW - 5, this.x));
      this.y = Math.max(5, Math.min(viewH - 5, this.y));

      // === Screen wrap (teleport) if fully offscreen ===
      if (this.x < -100) this.x = viewW + 90;
      if (this.x > viewW + 100) this.x = -90;
      if (this.y < -100) this.y = viewH + 90;
      if (this.y > viewH + 100) this.y = -90;

      // === Record head position in path ===
      this.path.unshift({ x: this.x, y: this.y });
      if (this.path.length > this.maxPathLength) {
        this.path.length = this.maxPathLength;
      }
    }

    /**
     * Draw the snake.
     * Body is sampled from the path at increasing distances behind the head.
     * Drawn as a smooth thick curve with tapered tail and distinct head.
     */
    draw(ctx) {
      const path = this.path;
      if (path.length < 2) return;

      ctx.save();

      // === Build body point list by sampling path ===
      const bodyPoints = [];
      let accumulatedDist = 0;
      let pathIdx = 0;
      const spacing = this.segmentSpacing;

      // Head is at path[0]. Walk along path collecting samples.
      bodyPoints.push({ x: path[0].x, y: path[0].y });

      for (let s = 1; s < this.segmentCount; s++) {
        const targetDist = s * spacing;
        // Walk forward along path until we've accumulated enough distance
        while (accumulatedDist < targetDist && pathIdx < path.length - 1) {
          const seg = path[pathIdx];
          const next = path[pathIdx + 1];
          const segDist = Math.hypot(seg.x - next.x, seg.y - next.y);
          accumulatedDist += segDist;
          pathIdx++;
        }
        if (pathIdx >= path.length) break;

        // Interpolate between current and next path point
        const seg = path[pathIdx - 1];
        const next = path[pathIdx];
        const overshoot = accumulatedDist - targetDist;
        const segDist = Math.hypot(seg.x - next.x, seg.y - next.y) || 1;
        const t = 1 - overshoot / segDist;

        bodyPoints.push({
          x: seg.x + (next.x - seg.x) * t,
          y: seg.y + (next.y - seg.y) * t,
        });
      }

      if (bodyPoints.length < 2) {
        ctx.restore();
        return;
      }

      // === Draw body as smooth tapered curve ===
      for (let i = 0; i < bodyPoints.length - 1; i++) {
        const p0 = bodyPoints[i];
        const p1 = bodyPoints[i + 1];
        const t = 1 - i / (bodyPoints.length - 1); // 1 = head, 0 = tail

        // Taper: full thickness at head, thin at tail
        const thickness = (0.08 + 0.92 * t) * this.bodyThickness;

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = thickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = this.opacity;
        ctx.stroke();
      }

      // === Draw head ===
      const head = bodyPoints[0];
      const headR = this.headRadius;

      // Head shadow
      ctx.beginPath();
      ctx.arc(head.x + 2, head.y + 2, headR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.globalAlpha = this.opacity * 0.3;
      ctx.fill();

      // Head circle
      ctx.beginPath();
      ctx.arc(head.x, head.y, headR, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = Math.min(1, this.opacity * 1.1);
      ctx.fill();

      // Head highlight
      const hx = Math.cos(this.angle) * headR * 0.3 - Math.sin(this.angle) * headR * 0.2;
      const hy = Math.sin(this.angle) * headR * 0.3 + Math.cos(this.angle) * headR * 0.2;
      ctx.beginPath();
      ctx.arc(head.x + hx, head.y + hy, headR * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.globalAlpha = Math.min(1, this.opacity);
      ctx.fill();

      // Eyes
      const eyeR = Math.max(2, headR * 0.2);
      const eDist = headR * 0.5;
      for (let s = -1; s <= 1; s += 2) {
        const ex = head.x + Math.cos(this.angle) * eDist * 0.2 + Math.sin(this.angle) * s * eDist * 0.55;
        const ey = head.y + Math.sin(this.angle) * eDist * 0.2 - Math.cos(this.angle) * s * eDist * 0.55;
        ctx.beginPath();
        ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.globalAlpha = Math.min(1, this.opacity * 1.3);
        ctx.fill();
      }

      // Tongue flick
      if (this.hasTongue) {
        const flick = Math.sin(performance.now() * 0.004 + this.tonguePhase);
        if (flick > 0.65) {
          const tLen = headR * 1.3;
          const fA = 0.35;
          const tx = head.x + Math.cos(this.angle) * (headR + 2);
          const ty = head.y + Math.sin(this.angle) * (headR + 2);
          const alpha = this.opacity * 0.6 * ((flick - 0.65) / 0.35);

          ctx.strokeStyle = '#CC4444';
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = alpha;

          const bx = head.x + Math.cos(this.angle) * headR * 0.6;
          const by = head.y + Math.sin(this.angle) * headR * 0.6;
          ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(tx, ty);
          ctx.lineTo(tx + Math.cos(this.angle - fA) * tLen * 0.5, ty + Math.sin(this.angle - fA) * tLen * 0.5);
          ctx.stroke();
          ctx.beginPath(); ctx.moveTo(tx, ty);
          ctx.lineTo(tx + Math.cos(this.angle + fA) * tLen * 0.5, ty + Math.sin(this.angle + fA) * tLen * 0.5);
          ctx.stroke();
        }
      }

      // === Debug overlay ===
      if (DEBUG) {
        ctx.fillStyle = 'red';
        ctx.font = '10px monospace';

        // Head marker
        ctx.beginPath(); ctx.arc(head.x, head.y, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillText('HEAD', head.x + 8, head.y - 8);

        // Path markers (every 5th segment)
        for (let i = 5; i < bodyPoints.length; i += 5) {
          const p = bodyPoints[i];
          ctx.fillStyle = 'rgba(255,0,0,0.3)';
          ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(255,0,0,0.5)';
          ctx.font = '8px monospace';
          ctx.fillText(String(i), p.x + 4, p.y - 4);
        }
      }

      ctx.restore();
    }
  }

  // ---- SnakeField ----
  function SnakeField() {
    this.canvas = null;
    this.ctx = null;
    this.snake = null;
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
    // Only create the ONE snake
    // On mobile, still just one — but smaller
    const w = this.canvas.width;
    this.snake = new PrototypeSnake(rng, w, this.canvas.height, getSafeZone());
    if (w < 768) {
      // Scale down for mobile
      this.snake.headRadius *= 0.7;
      this.snake.bodyThickness *= 0.7;
      this.snake.segmentCount = 35;
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

    if (this.snake) {
      if (!this.reducedMotion) {
        this.snake.update(dt, w, h, getSafeZone());
      }
      this.snake.draw(ctx);
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
