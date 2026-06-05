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

      // ---- Species pattern overlay ----
      if (this.patternType && this.patternType !== 'none' && this.patternColor) {
        for (let i = 2; i < spine.length - 3; i += 3) {
          const p = spine[i];
          const t = i / (spine.length - 1);
          const nx = -Math.sin(p.angle);
          const ny = Math.cos(p.angle);
          const r = bodyRadius(t) * this.baseRadius;
          const patR = r * (0.3 + rng() * 0.2);

          // Skip head and tail regions
          if (t < 0.1 || t > 0.85) continue;

          let drawPattern = false;
          if (this.patternType === 'bands') {
            drawPattern = (i % 6 < 2);
          } else if (this.patternType === 'diamonds') {
            drawPattern = (i % 5 < 1 || (i + 2) % 5 < 1);
          } else if (this.patternType === 'spots') {
            drawPattern = (i % 4 < 1);
          } else if (this.patternType === 'saddles') {
            drawPattern = (i % 5 < 2);
          } else if (this.patternType === 'triangles') {
            drawPattern = (i % 6 < 2);
          } else if (this.patternType === 'blotches') {
            drawPattern = (i % 4 < 1 && i % 2 === 0);
          } else if (this.patternType === 'stripes') {
            // Thin horizontal stripe along body centerline
            ctx.beginPath();
            const sx1 = p.x + nx * r * 0.1;
            const sy1 = p.y + ny * r * 0.1;
            const sx2 = p.x - nx * r * 0.1;
            const sy2 = p.y - ny * r * 0.1;
            ctx.moveTo(sx1, sy1);
            ctx.lineTo(sx2, sy2);
            ctx.strokeStyle = this.patternColor;
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = this.opacity * 0.5;
            ctx.stroke();
            continue;
          }

          if (drawPattern) {
            ctx.beginPath();
            ctx.arc(p.x + nx * patR * 0.2, p.y + ny * patR * 0.2, patR, 0, Math.PI * 2);
            ctx.fillStyle = this.patternColor;
            ctx.globalAlpha = this.opacity * 0.35;
            ctx.fill();
          }
        }
      }

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

  // ---- 27 Snake Species ----
  const SPECIES = [
    { name:'Reticulated Python', color:'#C8A84E', pattern:'diamonds', patColor:'#4A3728', size:1.0, speed:0.35, spines:55, thick:1.0 },
    { name:'King Cobra', color:'#5B7B3A', pattern:'none', patColor:'', size:0.9, speed:0.45, spines:50, thick:0.8, hood:true },
    { name:'Burmese Python', color:'#6B4E2E', pattern:'blotches', patColor:'#3D2B1A', size:0.95, speed:0.3, spines:50, thick:1.1 },
    { name:'Diamondback Rattlesnake', color:'#A0825A', pattern:'diamonds', patColor:'#5C4033', size:0.7, speed:0.4, spines:38, thick:0.85 },
    { name:'Green Tree Python', color:'#2E8B2E', pattern:'spots', patColor:'#90EE90', size:0.6, speed:0.35, spines:35, thick:0.6 },
    { name:'Black Mamba', color:'#2C2C2C', pattern:'none', patColor:'', size:0.8, speed:0.7, spines:55, thick:0.7 },
    { name:'Corn Snake', color:'#D2691E', pattern:'saddles', patColor:'#8B0000', size:0.6, speed:0.4, spines:35, thick:0.65 },
    { name:'Ball Python', color:'#3D2B1A', pattern:'blotches', patColor:'#C8A84E', size:0.55, speed:0.25, spines:28, thick:0.8 },
    { name:'Gaboon Viper', color:'#8B5E8B', pattern:'triangles', patColor:'#4A2B4A', size:0.5, speed:0.2, spines:25, thick:1.0 },
    { name:'Copperhead', color:'#C68E5B', pattern:'bands', patColor:'#5C3317', size:0.55, speed:0.35, spines:30, thick:0.7 },
    { name:'Garter Snake', color:'#2C4A2C', pattern:'stripes', patColor:'#FFD700', size:0.4, speed:0.5, spines:28, thick:0.4 },
    { name:'Boa Constrictor', color:'#A08050', pattern:'saddles', patColor:'#4A3520', size:0.85, speed:0.3, spines:45, thick:1.0 },
    { name:'Green Anaconda', color:'#3A5A1A', pattern:'spots', patColor:'#1A2A0A', size:0.95, speed:0.2, spines:45, thick:1.3 },
    { name:'Cottonmouth', color:'#3C2A1A', pattern:'none', patColor:'', size:0.6, speed:0.35, spines:32, thick:0.85 },
    { name:'Milk Snake', color:'#CC3333', pattern:'bands', patColor:'#000000', size:0.4, speed:0.4, spines:28, thick:0.45 },
    { name:'Hognose Snake', color:'#A08050', pattern:'blotches', patColor:'#2C1A0A', size:0.35, speed:0.35, spines:22, thick:0.5, hog:true },
    { name:'Vine Snake', color:'#32CD32', pattern:'none', patColor:'', size:0.5, speed:0.45, spines:45, thick:0.3 },
    { name:'Sea Snake', color:'#4A6B8C', pattern:'bands', patColor:'#2A3B5C', size:0.5, speed:0.35, spines:30, thick:0.55 },
    { name:'Carpet Python', color:'#8B7355', pattern:'diamonds', patColor:'#2B1A0A', size:0.65, speed:0.35, spines:35, thick:0.7 },
    { name:'Sidewinder', color:'#C4A882', pattern:'spots', patColor:'#6B5040', size:0.35, speed:0.5, spines:22, thick:0.5 },
    { name:'Tiger Snake', color:'#4A3520', pattern:'bands', patColor:'#FFD700', size:0.5, speed:0.45, spines:30, thick:0.6 },
    { name:'Bush Viper', color:'#2E8B57', pattern:'spots', patColor:'#1E5B37', size:0.35, speed:0.3, spines:22, thick:0.5 },
    { name:'Rainbow Boa', color:'#C87A3A', pattern:'saddles', patColor:'#5A2A0A', size:0.55, speed:0.35, spines:32, thick:0.65 },
    { name:'Sand Boa', color:'#D4A85A', pattern:'spots', patColor:'#8B6B2E', size:0.35, speed:0.25, spines:20, thick:0.7 },
    { name:'Woma Python', color:'#C4A060', pattern:'bands', patColor:'#5C4020', size:0.55, speed:0.35, spines:32, thick:0.65 },
    { name:'Eastern Indigo', color:'#1A2B4A', pattern:'none', patColor:'', size:0.7, speed:0.5, spines:45, thick:0.65 },
    { name:'Rough Green Snake', color:'#5CAD5C', pattern:'none', patColor:'', size:0.3, speed:0.6, spines:25, thick:0.3 },
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
   * Create 27 snakes from the species definitions.
   */
  SnakeField.prototype._populateSnakes = function () {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const safe = getSafeZone();
    const isMobile = w < 768;
    const scale = isMobile ? 0.55 : 1;
    this.snakes = [];

    for (let i = 0; i < SPECIES.length; i++) {
      const sp = SPECIES[i];
      const snake = new ProceduralSnake(rng, w, h, safe);

      // Species configuration
      snake.species = sp.name;
      snake.color = sp.color;
      snake.patternType = sp.pattern;
      snake.patternColor = sp.patColor;
      snake.baseRadius = (rng() * 3 + 7) * sp.thick * scale;  // 7-10px base × thickness multiplier
      snake.headRadius = snake.baseRadius * (0.65 + rng() * 0.15);
      snake.spineCount = Math.floor(sp.spines * (0.8 + rng() * 0.4) * scale);
      snake.spacing = 5 + rng() * 3; // 5-8px
      snake.speed = sp.speed * (0.85 + rng() * 0.3);
      snake.opacity = 0.6 + rng() * 0.3;
      snake.hasTongue = rng() > 0.3;
      snake.outlineColor = this._darken(sp.color, 0.4);

      // Scale down maxPath proportional to spineCount
      snake.maxPath = Math.min(4000, Math.ceil(snake.spineCount * 6));
      snake.waveAmp = (rng() * 8 + 8) * scale;

      // Random wander personality per species
      snake.wanderInterval = rng() * 400 + 200;
      snake.turnSpeed = rng() * 0.004 + 0.002;

      // Random spawn position
      snake.x = rng() * w;
      snake.y = rng() * h;
      snake.angle = rng() * Math.PI * 2;
      snake.wanderAngle = snake.angle;

      // Rebuild path at new position
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

  // Simple color darkening helper
  SnakeField.prototype._darken = function (hex, factor) {
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return 'rgb(' + Math.floor(r * factor) + ',' + Math.floor(g * factor) + ',' + Math.floor(b * factor) + ')';
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
