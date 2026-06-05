/**
 * Hiss-Tastic — one procedural snake rendered as a filled polygon silhouette.
 *
 * The snake body is built from a spine curve (path history + sine wave),
 * then expanded left/right using a natural radius profile. The result
 * is a clean continuous filled shape with proper head, tapered tail,
 * and traveling slither wave.
 *
 * Canvas 2D, no external deps, no image assets.
 */

(function () {
  'use strict';

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

  // ---- Radius profile: natural snake body width ----
  function bodyRadius(t) {
    // t = 0 at head, 1 at tail
    if (t < 0.05) {
      return 0.85 + t * 2.5;           // Head/neck
    } else if (t < 0.6) {
      return 0.9 + 0.1 * Math.sin(Math.PI * ((t - 0.05) / 0.55)); // Full body
    } else if (t < 0.75) {
      return 1.0 - (t - 0.6) * 1.0;    // Gentle rear taper: 0.85 at t=0.75
    } else {
      // Tail — smooth eased taper (not sharp linear drop)
      const tailT = (t - 0.75) / 0.25; // 0→1 across tail
      return 0.85 * (1 - tailT * tailT * 0.9); // Quadratic ease: 0.85→~0.09
    }
  }

  // ---- Procedural Snake ----
  class ProceduralSnake {
    constructor(rng, viewW, viewH, safe) {
      // Head position
      this.x = viewW / 2;
      this.y = rng() * viewH * 0.25 + viewH * 0.08;
      this.angle = rng() * 0.4 + 0.15;

      // Speed — calm gliding for a giant serpent
      this.speed = rng() * 0.2 + 0.4; // 0.4–0.6 (was 0.25–0.4)

      // Wander — slow, sweeping direction changes
      this.wanderAngle = this.angle;
      this.wanderTimer = 0;
      this.wanderInterval = rng() * 500 + 400;
      this.turnSpeed = rng() * 0.002 + 0.001; // very gentle turns

      // Spine / wave — long flowing waves
      this.waveSpeed = rng() * 0.012 + 0.006;
      this.waveFreq = rng() * 0.02 + 0.01;  // very low = long elegant waves
      this.waveAmp = rng() * 15 + 20;         // 20–35 px (was 10–18)
      this.wavePhase = rng() * Math.PI * 2;

      // Size constants — dramatically longer
      this.baseRadius = rng() * 4 + 14;       // 14–18 px
      this.headRadius = rng() * 2 + 10;       // 10–12 px
      this.spineCount = 240;                  // 240 × 8px = 1920px body (was 500px)
      this.spacing = 8;                       // px between spine points
      this.maxPath = 4000;                    // path history — supports the full body length

      // Path with angle tracking
      this.path = [];
      for (let i = 0; i < this.maxPath; i++) {
        this.path.push({
          x: this.x - Math.cos(this.angle) * 3 * (i + 1),
          y: this.y - Math.sin(this.angle) * 3 * (i + 1),
          angle: this.angle,
        });
      }

      this.color = '#2E7D32';
      this.outlineColor = '#1B5E20';
      this.highlightColor = 'rgba(255,255,255,0.12)';
      this.bellyColor = 'rgba(255,255,255,0.06)';
      this.opacity = 0.85;
      this.hasTongue = true;
      this.tonguePhase = rng() * Math.PI * 2;
    }

    update(dt, viewW, viewH, safe) {
      // Wander
      this.wanderTimer += dt;
      if (this.wanderTimer >= this.wanderInterval) {
        this.wanderTimer = 0;
        this.wanderAngle += (Math.random() - 0.5) * 0.8;
      }

      let targetAngle = this.wanderAngle;

      // Exclusion zone
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

      // Steer
      const diff = targetAngle - this.angle;
      const maxTurn = this.turnSpeed * dt;
      this.angle += Math.sign(Math.sin(diff)) * Math.min(Math.abs(Math.sin(diff)), maxTurn);

      // Move
      this.x += Math.cos(this.angle) * this.speed * 0.06 * dt;
      this.y += Math.sin(this.angle) * this.speed * 0.06 * dt;

      // DVD-logo-style bounce off edges — immediate angle reversal
      const bounceMargin = this.baseRadius + 5; // margin >= body half-width
      if (this.x < bounceMargin) {
        this.angle = Math.PI - this.angle;
        this.x = bounceMargin;
      }
      if (this.x > viewW - bounceMargin) {
        this.angle = Math.PI - this.angle;
        this.x = viewW - bounceMargin;
      }
      if (this.y < bounceMargin) {
        this.angle = -this.angle;
        this.y = bounceMargin;
      }
      if (this.y > viewH - bounceMargin) {
        this.angle = -this.angle;
        this.y = viewH - bounceMargin;
      }

      // Keep angle in 0-2PI range
      if (this.angle < 0) this.angle += Math.PI * 2;
      if (this.angle > Math.PI * 2) this.angle -= Math.PI * 2;

      // Record path
      this.path.unshift({ x: this.x, y: this.y, angle: this.angle });
      if (this.path.length > this.maxPath) this.path.length = this.maxPath;
    }

    /**
     * Build the spine: sample from path, apply sine wave, return array of spine points.
     */
    _buildSpine() {
      const path = this.path;
      if (path.length < 2) return [];

      // Sample from path
      let acc = 0, idx = 0;
      const spine = [];
      spine.push({ x: path[0].x, y: path[0].y, angle: path[0].angle });

      for (let s = 1; s < this.spineCount; s++) {
        const target = s * this.spacing;
        while (acc < target && idx < path.length - 1) {
          acc += Math.hypot(path[idx].x - path[idx + 1].x, path[idx].y - path[idx + 1].y);
          idx++;
        }
        if (idx >= path.length) break;
        const seg = path[idx - 1], next = path[idx];
        const over = acc - target;
        const sDist = Math.hypot(seg.x - next.x, seg.y - next.y) || 1;
        const t = Math.max(0, Math.min(1, 1 - over / sDist));
        let aDiff = next.angle - seg.angle;
        if (aDiff > Math.PI) aDiff -= Math.PI * 2;
        if (aDiff < -Math.PI) aDiff += Math.PI * 2;
        spine.push({
          x: seg.x + (next.x - seg.x) * t,
          y: seg.y + (next.y - seg.y) * t,
          angle: seg.angle + aDiff * t,
        });
      }

      if (spine.length < 4) return spine;

      // Apply sine wave
      const waveTime = performance.now() * 0.001;
      for (let i = 0; i < spine.length; i++) {
        const bp = spine[i];
        const t = i / (spine.length - 1);
        // Amplitude envelope: small at head, peak mid-body, gentle at tail
        const envelope = Math.sin(Math.PI * Math.pow(t, 0.7));
        const amp = this.waveAmp * envelope;
        const wave = Math.sin(waveTime * this.waveSpeed - t * this.waveFreq * spine.length + this.wavePhase);
        // Reduce wave in final 15% to prevent tail twist
        const tailFade = t > 0.85 ? 1 - (t - 0.85) / 0.15 : 1;
        const nx = -Math.sin(bp.angle);
        const ny = Math.cos(bp.angle);
        spine[i] = {
          x: bp.x + nx * wave * amp * tailFade,
          y: bp.y + ny * wave * amp * tailFade,
          angle: bp.angle,
        };
      }

      // Smooth last few spine points for clean tail
      const end = spine.length - 1;
      for (let s = 0; s < 3; s++) {
        const i = end - s;
        if (i < 2) break;
        spine[i].x = (spine[i].x + spine[i - 1].x) / 2;
        spine[i].y = (spine[i].y + spine[i - 1].y) / 2;
      }

      return spine;
    }

    /**
     * Draw the snake as a filled polygon silhouette.
     */
    draw(ctx) {
      const spine = this._buildSpine();
      if (spine.length < 4) return;

      ctx.save();

      // ---- Build left and right edge points ----
      const leftPoints = [];
      const rightPoints = [];

      for (let i = 0; i < spine.length; i++) {
        const p = spine[i];
        const t = i / (spine.length - 1);
        const nx = -Math.sin(p.angle);
        const ny = Math.cos(p.angle);

        // Radius from profile × base width
        const r = bodyRadius(t) * this.baseRadius;

        leftPoints.push({ x: p.x + nx * r, y: p.y + ny * r });
        rightPoints.push({ x: p.x - nx * r, y: p.y - ny * r });
      }

      // ---- Head wedge: wider tip for the head shape ----
      // Replace the first left/right point with a wider set for the head
      if (spine.length > 2) {
        const h0 = spine[0];
        const h1 = spine[1];
        const headAngle = Math.atan2(h0.y - h1.y, h0.x - h1.x);
        const hnX = -Math.sin(headAngle);
        const hnY = Math.cos(headAngle);

        const headW = this.headRadius;
        const headLen = this.headRadius * 0.7;

        // Head tip: a rounded wedge extending forward
        const tipX = h0.x + Math.cos(headAngle) * headLen;
        const tipY = h0.y + Math.sin(headAngle) * headLen;

        // Overwrite first left/right
        leftPoints[0] = { x: tipX + hnX * headW * 0.3, y: tipY + hnY * headW * 0.3 };
        rightPoints[0] = { x: tipX - hnX * headW * 0.3, y: tipY - hnY * headW * 0.3 };

        // Second point is wider (full head width)
        if (leftPoints.length > 1) {
          const w2 = this.headRadius * 0.6;
          leftPoints[1] = { x: h0.x + hnX * w2, y: h0.y + hnY * w2 };
          rightPoints[1] = { x: h0.x - hnX * w2, y: h0.y - hnY * w2 };
        }
      }

      // ---- Fill body polygon ----
      ctx.beginPath();
      // Left edge head-to-tail
      ctx.moveTo(leftPoints[0].x, leftPoints[0].y);
      for (let i = 1; i < leftPoints.length; i++) {
        ctx.lineTo(leftPoints[i].x, leftPoints[i].y);
      }
      // Right edge tail-to-head
      for (let i = rightPoints.length - 1; i >= 0; i--) {
        ctx.lineTo(rightPoints[i].x, rightPoints[i].y);
      }
      ctx.closePath();

      // Fill
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.opacity;
      ctx.fill();

      // Subtle outline
      ctx.strokeStyle = this.outlineColor;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = this.opacity * 0.4;
      ctx.stroke();

      // ---- Outline stroke (top highlight ridge) ----
      for (let i = 0; i < leftPoints.length - 1; i++) {
        const p0 = leftPoints[i];
        const p1 = leftPoints[i + 1];
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = this.opacity * 0.25;
        ctx.stroke();
      }

      // ---- Eyes ----
      if (spine.length > 2) {
        const h0 = spine[0];
        const h1 = spine[1];
        const headAngle = Math.atan2(h0.y - h1.y, h0.x - h1.x);
        const hnX = -Math.sin(headAngle);
        const hnY = Math.cos(headAngle);

        const eyeR = Math.max(1.8, this.headRadius * 0.17);
        const eDist = this.headRadius * 0.35;

        for (let s = -1; s <= 1; s += 2) {
          const ex = h0.x + Math.cos(headAngle) * eDist * 0.15 + Math.sin(headAngle) * s * eDist * 0.65;
          const ey = h0.y + Math.sin(headAngle) * eDist * 0.15 - Math.cos(headAngle) * s * eDist * 0.65;
          ctx.beginPath();
          ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0,0,0,0.75)';
          ctx.globalAlpha = Math.min(1, this.opacity * 1.3);
          ctx.fill();
        }

        // ---- Tongue ----
        if (this.hasTongue) {
          const flick = Math.sin(performance.now() * 0.004 + this.tonguePhase);
          if (flick > 0.65) {
            const tLen = this.headRadius * 1.2;
            const fA = 0.35;
            const tx = h0.x + Math.cos(headAngle) * (this.headRadius * 0.5 + 3);
            const ty = h0.y + Math.sin(headAngle) * (this.headRadius * 0.5 + 3);
            const alpha = this.opacity * 0.5 * ((flick - 0.65) / 0.35);

            ctx.strokeStyle = '#CC4444';
            ctx.lineWidth = 1.3;
            ctx.globalAlpha = alpha;

            const bx = h0.x + Math.cos(headAngle) * this.headRadius * 0.3;
            const by = h0.y + Math.sin(headAngle) * this.headRadius * 0.3;
            ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(tx, ty);
            ctx.lineTo(tx + Math.cos(headAngle - fA) * tLen * 0.5, ty + Math.sin(headAngle - fA) * tLen * 0.5);
            ctx.stroke();
            ctx.beginPath(); ctx.moveTo(tx, ty);
            ctx.lineTo(tx + Math.cos(headAngle + fA) * tLen * 0.5, ty + Math.sin(headAngle + fA) * tLen * 0.5);
            ctx.stroke();
          }
        }
      }

      // ---- Debug ----
      if (DEBUG) {
        ctx.fillStyle = 'red';
        ctx.font = '10px monospace';
        ctx.beginPath(); ctx.arc(spine[0].x, spine[0].y, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillText('HEAD', spine[0].x + 10, spine[0].y - 10);

        // Spine points
        for (let i = 10; i < spine.length; i += 10) {
          const p = spine[i];
          ctx.fillStyle = 'rgba(255,0,0,0.3)';
          ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(255,0,0,0.5)';
          ctx.font = '8px monospace';
          ctx.fillText(String(i), p.x + 5, p.y - 5);
        }

        // Body edge polygon
        ctx.strokeStyle = 'rgba(0,255,0,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        leftPoints.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();
        ctx.beginPath();
        rightPoints.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  // ---- 27 snake colors ----
  const SNAKE_COLORS = [
    '#2E7D32','#00695C','#827717','#4E342E','#BF360C',
    '#33691E','#5D4037','#C8A84E','#5B7B3A','#A0825A',
    '#2E8B2E','#2C2C2C','#D2691E','#3D2B1A','#8B5E8B',
    '#C68E5B','#2C4A2C','#A08050','#3A5A1A','#3C2A1A',
    '#CC3333','#32CD32','#4A6B8C','#8B7355','#C4A882',
    '#1A2B4A','#5CAD5C',
  ];

  // ---- SnakeField ----
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

  /**
   * Create 27 clean snakes with varied sizes and colors.
   */
  SnakeField.prototype._populateSnakes = function () {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const safe = getSafeZone();
    const isMobile = w < 768;
    const scale = isMobile ? 0.55 : 1;
    this.snakes = [];

    for (let i = 0; i < 27; i++) {
      const snake = new ProceduralSnake(rng, w, h, safe);
      snake.color = SNAKE_COLORS[i % SNAKE_COLORS.length];
      snake.outlineColor = '#1B5E20';

      // Varied sizes: index determines size tier
      if (i < 5) {
        // Large snakes (indices 0-4)
        snake.baseRadius = (8 + rng() * 4) * scale;
        snake.spineCount = Math.floor((45 + rng() * 20) * scale);
        snake.speed = 0.25 + rng() * 0.2;
      } else if (i < 14) {
        // Medium snakes (indices 5-13)
        snake.baseRadius = (6 + rng() * 3) * scale;
        snake.spineCount = Math.floor((30 + rng() * 20) * scale);
        snake.speed = 0.3 + rng() * 0.3;
      } else {
        // Small snakes (indices 14-26)
        snake.baseRadius = (4 + rng() * 2.5) * scale;
        snake.spineCount = Math.floor((18 + rng() * 15) * scale);
        snake.speed = 0.35 + rng() * 0.35;
      }

      snake.headRadius = snake.baseRadius * (0.6 + rng() * 0.15);
      snake.spacing = 5 + rng() * 3;
      snake.maxPath = Math.min(4000, Math.ceil(snake.spineCount * 8));
      snake.waveAmp = (rng() * 10 + 10) * scale;
      snake.opacity = 0.55 + rng() * 0.35;
      snake.hasTongue = rng() > 0.4;
      snake.wanderInterval = rng() * 400 + 200;
      snake.turnSpeed = rng() * 0.004 + 0.002;

      // Random spawn
      snake.x = rng() * w;
      snake.y = rng() * h;
      snake.angle = rng() * Math.PI * 2;
      snake.wanderAngle = snake.angle;

      // Rebuild path
      snake.path = [];
      for (let j = 0; j < snake.maxPath; j++) {
        snake.path.push({
          x: snake.x - Math.cos(snake.angle) * 3 * (j + 1),
          y: snake.y - Math.sin(snake.angle) * 3 * (j + 1),
          angle: snake.angle,
        });
      }
      this.snakes.push(snake);
    }
  };

  SnakeField.prototype._resize = function () {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this._populateSnakes();
  };

  SnakeField.prototype._animate = function (timestamp) {
    if (!this.running) return;
    if (!this.visible) { this.startTime = timestamp; this.animFrame = requestAnimationFrame(this._animate.bind(this)); return; }
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const dt = Math.min(timestamp - this.startTime, 33);
    this.startTime = timestamp;
    ctx.clearRect(0, 0, w, h);
    const safe = getSafeZone();
    for (let i = 0; i < this.snakes.length; i++) {
      const s = this.snakes[i];
      if (!this.reducedMotion) s.update(dt, w, h, safe);
      s.draw(ctx);
    }
    this.animFrame = requestAnimationFrame(this._animate.bind(this));
  };

  SnakeField.prototype._onVisibilityChange = function () { this.visible = !document.hidden; };

  SnakeField.prototype.destroy = function () {
    this.running = false;
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    document.removeEventListener('visibilitychange', this.handleVis);
    if (this.canvas && this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
  };

  window.SnakeField = SnakeField;
})();
