/**
 * Hiss-Tastic — single large ambient snake with full-body serpentine wave.
 *
 * The body is sampled from the head's path history, then each body point
 * receives a lateral sine-wave offset that travels along the full length
 * of the snake. This produces natural S-curve slithering even when the
 * head moves in a straight line.
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

  // ---- Single Serpentine Snake ----
  class SerpentineSnake {
    constructor(rng, viewW, viewH, safe) {
      // Head position
      this.x = viewW / 2;
      this.y = rng() * viewH * 0.3 + viewH * 0.1;
      this.angle = rng() * 0.5 + 0.2;

      // Speed
      this.speed = rng() * 0.2 + 0.3; // 0.3–0.5

      // Wander steering
      this.wanderAngle = this.angle;
      this.wanderTimer = 0;
      this.wanderInterval = rng() * 250 + 200;
      this.turnSpeed = rng() * 0.005 + 0.003;

      // === Body wave parameters ===
      this.waveSpeed = rng() * 0.025 + 0.015;  // how fast wave travels
      this.waveFreq = rng() * 0.06 + 0.04;     // spatial frequency along body
      this.waveAmp = rng() * 10 + 8;            // 8–18 px lateral amplitude
      this.wavePhase = rng() * Math.PI * 2;     // random start phase

      // === Size ===
      this.headRadius = rng() * 4 + 10;    // 10–14 px
      this.bodyThickness = rng() * 6 + 12; // 12–18 px

      // === Path sampling ===
      this.segmentSpacing = 5;           // px between body samples
      this.segmentCount = 60;            // 60 * 5 = 300px body
      this.maxPathLength = 140;          // path history (~700px)

      // === Path history (stores {x, y, angle}) ===
      this.path = [];

      // Populate initial path behind head
      for (let i = 0; i < this.maxPathLength; i++) {
        this.path.push({
          x: this.x - Math.cos(this.angle) * 4 * (i + 1),
          y: this.y - Math.sin(this.angle) * 4 * (i + 1),
          angle: this.angle,
        });
      }

      // Visual
      this.color = '#2E7D32';
      this.opacity = 0.85;
      this.hasTongue = true;
      this.tonguePhase = rng() * Math.PI * 2;
    }

    /**
     * Update head position and path history.
     */
    update(dt, viewW, viewH, safe) {
      // === Wander steering ===
      this.wanderTimer += dt;
      if (this.wanderTimer >= this.wanderInterval) {
        this.wanderTimer = 0;
        this.wanderAngle += (Math.random() - 0.5) * 1.0;
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
      const edge = 50;
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

      // === Screen wrap ===
      if (this.x < -120) this.x = viewW + 110;
      if (this.x > viewW + 120) this.x = -110;
      if (this.y < -120) this.y = viewH + 110;
      if (this.y > viewH + 120) this.y = -110;

      // === Record head position (with angle) ===
      this.path.unshift({ x: this.x, y: this.y, angle: this.angle });
      if (this.path.length > this.maxPathLength) {
        this.path.length = this.maxPathLength;
      }
    }

    /**
     * Sample body points from path, then apply full-body sine wave.
     */
    _buildBodyPoints() {
      const path = this.path;
      if (path.length < 2) return [];

      const spacing = this.segmentSpacing;
      const count = this.segmentCount;
      const bodyPoints = [];

      // 1. Sample base positions from path by distance
      let accumulatedDist = 0;
      let pathIdx = 0;

      bodyPoints.push({
        x: path[0].x,
        y: path[0].y,
        angle: path[0].angle,
      });

      for (let s = 1; s < count; s++) {
        const targetDist = s * spacing;
        while (accumulatedDist < targetDist && pathIdx < path.length - 1) {
          const seg = path[pathIdx];
          const next = path[pathIdx + 1];
          accumulatedDist += Math.hypot(seg.x - next.x, seg.y - next.y);
          pathIdx++;
        }
        if (pathIdx >= path.length) break;

        const seg = path[pathIdx - 1];
        const next = path[pathIdx];
        const overshoot = accumulatedDist - targetDist;
        const segDist = Math.hypot(seg.x - next.x, seg.y - next.y) || 1;
        const t = Math.max(0, Math.min(1, 1 - overshoot / segDist));

        // Interpolate angle
        let aDiff = next.angle - seg.angle;
        if (aDiff > Math.PI) aDiff -= Math.PI * 2;
        if (aDiff < -Math.PI) aDiff += Math.PI * 2;

        bodyPoints.push({
          x: seg.x + (next.x - seg.x) * t,
          y: seg.y + (next.y - seg.y) * t,
          angle: seg.angle + aDiff * t,
        });
      }

      if (bodyPoints.length < 3) return bodyPoints;

      // 2. Apply serpentine sine wave to body points
      const waveTime = performance.now() * 0.001; // seconds

      for (let i = 0; i < bodyPoints.length; i++) {
        const bp = bodyPoints[i];
        const t = i / (bodyPoints.length - 1); // 0 = head, 1 = tail

        // Amplitude envelope: peaks mid-body, zero at head and tail
        const envelope = Math.sin(Math.PI * t);
        const amplitude = this.waveAmp * envelope;

        // Wave phase: travels from head to tail over time
        const wave = Math.sin(
          waveTime * this.waveSpeed - t * this.waveFreq * bodyPoints.length + this.wavePhase
        );

        // Normal (perpendicular to body direction)
        const nx = -Math.sin(bp.angle);
        const ny = Math.cos(bp.angle);

        bodyPoints[i] = {
          x: bp.x + nx * wave * amplitude,
          y: bp.y + ny * wave * amplitude,
          angle: bp.angle,
        };
      }

      return bodyPoints;
    }

    /**
     * Draw the snake with full-body serpentine curve.
     */
    draw(ctx) {
      const bodyPoints = this._buildBodyPoints();
      if (bodyPoints.length < 2) return;

      ctx.save();

      // === Shadow stroke (wider, faint) ===
      for (let i = 0; i < bodyPoints.length - 1; i++) {
        const p0 = bodyPoints[i];
        const p1 = bodyPoints[i + 1];
        const t = 1 - i / (bodyPoints.length - 1);

        // Taper: full at head, 15% min at tail (was 8%)
        const thick = (0.15 + 0.85 * t) * this.bodyThickness;

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = 'rgba(0,0,0,0.10)';
        ctx.lineWidth = thick + 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = this.opacity * 0.3;
        ctx.stroke();
      }

      // === Main body stroke ===
      for (let i = 0; i < bodyPoints.length - 1; i++) {
        const p0 = bodyPoints[i];
        const p1 = bodyPoints[i + 1];
        const t = 1 - i / (bodyPoints.length - 1);

        // Tail is 15% of body thickness (was 8%) — minimum ~2-3px
        const thick = (0.15 + 0.85 * t) * this.bodyThickness;

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = thick;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = this.opacity;
        ctx.stroke();
      }

      // === Highlight stroke (narrow, light, on top) ===
      for (let i = 0; i < bodyPoints.length - 3; i += 2) {
        const p0 = bodyPoints[i];
        const p1 = bodyPoints[i + 1];
        const t = 1 - i / (bodyPoints.length - 1);
        const thick = (0.15 + 0.85 * t) * this.bodyThickness * 0.3;

        if (thick < 1.5) continue;

        // Offset slightly toward the "top" of the body (perpendicular right)
        const nx = -Math.sin(bodyPoints[i].angle + 0.3) * 2;
        const ny = Math.cos(bodyPoints[i].angle + 0.3) * 2;

        ctx.beginPath();
        ctx.moveTo(p0.x + nx, p0.y + ny);
        ctx.lineTo(p1.x + nx, p1.y + ny);
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = thick;
        ctx.lineCap = 'round';
        ctx.globalAlpha = this.opacity;
        ctx.stroke();
      }

      // === Head ===
      const head = bodyPoints[0];
      const headR = this.headRadius;

      // Head shadow
      ctx.beginPath();
      ctx.arc(head.x + 2, head.y + 2, headR + 1, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.globalAlpha = this.opacity * 0.3;
      ctx.fill();

      // Head body
      ctx.beginPath();
      ctx.arc(head.x, head.y, headR, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = Math.min(1, this.opacity * 1.1);
      ctx.fill();

      // Highlight
      const hx = Math.cos(this.angle) * headR * 0.3 - Math.sin(this.angle) * headR * 0.2;
      const hy = Math.sin(this.angle) * headR * 0.3 + Math.cos(this.angle) * headR * 0.2;
      ctx.beginPath();
      ctx.arc(head.x + hx, head.y + hy, headR * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.globalAlpha = Math.min(1, this.opacity);
      ctx.fill();

      // Eyes
      const eyeR = Math.max(2, headR * 0.18);
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

      // Tongue
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
        ctx.beginPath(); ctx.arc(head.x, head.y, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillText('HEAD', head.x + 10, head.y - 10);

        // Body point markers
        for (let i = 5; i < bodyPoints.length; i += 5) {
          const p = bodyPoints[i];
          ctx.fillStyle = 'rgba(255,0,0,0.3)';
          ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(255,0,0,0.5)';
          ctx.font = '8px monospace';
          ctx.fillText(String(i), p.x + 5, p.y - 5);
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
    this.snake = new SerpentineSnake(rng, this.canvas.width, this.canvas.height, getSafeZone());
    if (this.canvas.width < 768) {
      this.snake.headRadius *= 0.75;
      this.snake.bodyThickness *= 0.75;
      this.snake.segmentCount = 40;
      this.snake.waveAmp *= 0.7;
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
