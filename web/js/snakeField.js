/**
 * Hiss-Tastic Snake Border — decorative animated snake frame around the game panel.
 *
 * Each snake is a compact curled/slithering creature confined to a small
 * bounding area near the viewport perimeter. No straight-line body trails,
 * no full-screen traversal, no noise artifacts.
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
    '#827717', '#9E9D24', '#AFB42B', '#C0CA33', '#689F38',
    '#BF360C', '#D84315', '#E64A19', '#F57C00', '#E65100', '#FF8F00',
    '#00695C', '#00796B', '#00897B', '#26A69A',
    '#4E342E', '#5D4037', '#3E2723', '#33691E',
    '#827D6E', '#A4A07C', '#B8B294',
  ];

  /**
   * BorderSnake — a compact decorative snake near a viewport edge.
   * Body is an S-curve within a small bounding circle so it never strays
   * far from its anchor point.
   */
  class BorderSnake {
    constructor(rng, viewW, viewH, safe) {
      this.zone = this._pickZone(rng);

      // Physical
      this.bodyLength = rng() * 50 + 40;    // 40–90 px (compact!)
      this.thickness = rng() * 4 + 4;       // 4–8 px
      this.color = COLORS[Math.floor(rng() * COLORS.length)];
      this.opacity = rng() * 0.2 + 0.65;    // 0.65–0.85

      // Curl parameters — body naturally loops into an S/coil
      this.curlRadius = rng() * 18 + 14;     // 14–32 px curl radius
      this.curlTurns = rng() * 0.8 + 0.6;    // 0.6–1.4 turns
      this.curlStretch = rng() * 0.3 + 0.6;  // 0.6–0.9 (vertical squash)
      this.phase = rng() * Math.PI * 2;
      this.speed = rng() * 0.012 + 0.006;

      // Head
      this.headSize = this.thickness * 0.85;

      // Details
      this.banded = rng() > 0.6;
      this.bandColor = this._bandColor(rng);
      this.tongueFlick = rng() > 0.4;
      this.tonguePhase = rng() * Math.PI * 2;

      // Anchor in a safe border zone
      this.anchorX = 0;
      this.anchorY = 0;
      this._placeInZone(viewW, viewH, safe, rng);
    }

    _pickZone(rng) {
      const zones = ['top', 'bottom', 'left', 'right', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight'];
      return zones[Math.floor(rng() * zones.length)];
    }

    _bandColor(rng) {
      const d = ['#1A1A1A', '#222', '#2C2C2C', '#111'];
      const y = ['#FFD600', '#FFEA00', '#FDD835'];
      const c = ['#E0E0E0', '#BDBDBD', '#D7CCC8'];
      const p = rng() > 0.5 ? d : (rng() > 0.5 ? y : c);
      return p[Math.floor(rng() * p.length)];
    }

    /**
     * Place the snake in a border zone, away from the central game area.
     */
    _placeInZone(viewW, viewH, safe, rng) {
      const margin = 15;
      const zoneW = Math.max(10, safe.x - margin);
      const zoneH = Math.max(10, safe.y - margin);

      switch (this.zone) {
        case 'top':
          this.anchorX = safe.x + margin + rng() * Math.max(10, safe.w - margin * 2);
          this.anchorY = margin + rng() * zoneH * 0.6;
          break;
        case 'bottom':
          this.anchorX = safe.x + margin + rng() * Math.max(10, safe.w - margin * 2);
          this.anchorY = safe.y + safe.h + margin + rng() * Math.max(10, viewH - safe.y - safe.h - margin * 2);
          break;
        case 'left':
          this.anchorX = margin + rng() * zoneW * 0.6;
          this.anchorY = safe.y + margin + rng() * Math.max(10, safe.h - margin * 2);
          break;
        case 'right':
          this.anchorX = safe.x + safe.w + margin + rng() * Math.max(10, viewW - safe.x - safe.w - margin * 2);
          this.anchorY = safe.y + margin + rng() * Math.max(10, safe.h - margin * 2);
          break;
        case 'topLeft':
          this.anchorX = margin + rng() * zoneW * 0.7;
          this.anchorY = margin + rng() * zoneH * 0.7;
          break;
        case 'topRight':
          this.anchorX = safe.x + safe.w + margin + rng() * Math.max(10, viewW - safe.x - safe.w - margin * 2) * 0.7;
          this.anchorY = margin + rng() * zoneH * 0.7;
          break;
        case 'bottomLeft':
          this.anchorX = margin + rng() * zoneW * 0.7;
          this.anchorY = safe.y + safe.h + margin + rng() * Math.max(10, viewH - safe.y - safe.h - margin * 2) * 0.7;
          break;
        case 'bottomRight':
          this.anchorX = safe.x + safe.w + margin + rng() * Math.max(10, viewW - safe.x - safe.w - margin * 2) * 0.7;
          this.anchorY = safe.y + safe.h + margin + rng() * Math.max(10, viewH - safe.y - safe.h - margin * 2) * 0.7;
          break;
      }

      this.anchorX = Math.max(margin, Math.min(viewW - margin, this.anchorX));
      this.anchorY = Math.max(margin, Math.min(viewH - margin, this.anchorY));
    }

    /**
     * Get body points forming a compact S-curve / coil around the anchor.
     * The body naturally curves back on itself, staying within ~curlRadius × 2.
     */
    getBodyPoints(time) {
      const steps = 16;
      const points = [];
      const tPhase = this.phase + time * this.speed * 8;
      const curlR = this.curlRadius;
      const turns = this.curlTurns;
      const stretch = this.curlStretch;

      for (let i = 0; i <= steps; i++) {
        const t = i / steps; // 0 = tail, 1 = head

        // Parametric S-curve: angle sweeps from -turns*PI to +turns*PI
        const angle = (t - 0.5) * turns * Math.PI * 2 + tPhase * 0.3;

        // Radius shrinks toward head (tapered coil)
        const r = curlR * (0.3 + 0.7 * (1 - t * 0.5));

        // S-curve: horizontal figure-8-ish path
        const bx = this.anchorX + Math.sin(angle) * r;
        const by = this.anchorY + Math.cos(angle * 1.2) * r * stretch + Math.sin(t * Math.PI) * 6;

        // Extra wiggle for liveliness
        const wiggle = Math.sin(tPhase + t * 5) * 2;
        const fx = bx + Math.cos(angle + tPhase) * wiggle * 0.3;
        const fy = by + Math.sin(angle * 0.7 + tPhase) * wiggle * 0.3;

        points.push({ x: fx, y: fy });
      }

      return points;
    }

    draw(ctx, time) {
      const points = this.getBodyPoints(time);
      if (points.length < 2) return;

      ctx.save();

      // ---- Body from tail to head ----
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const t = i / (points.length - 1);

        const lineW = this.thickness * (0.15 + 0.85 * t);

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = lineW;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = this.opacity;
        ctx.stroke();

        // Banded pattern
        if (this.banded && i > 1 && i < points.length - 3 && i % 3 === 0) {
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.strokeStyle = this.bandColor;
          ctx.lineWidth = lineW * 0.5;
          ctx.globalAlpha = this.opacity * 0.35;
          ctx.stroke();
        }
      }

      // ---- Head ----
      const head = points[points.length - 1];
      const prev = points[points.length - 2] || head;
      const headAngle = Math.atan2(head.y - prev.y, head.x - prev.x);
      const headR = this.headSize;

      // Head circle
      ctx.beginPath();
      ctx.arc(head.x, head.y, headR, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = Math.min(1, this.opacity * 1.15);
      ctx.fill();

      // Highlight
      ctx.beginPath();
      ctx.arc(head.x - headR * 0.2, head.y - headR * 0.25, headR * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fill();

      // Eyes
      const eyeR = Math.max(1.5, headR * 0.22);
      const eDist = headR * 0.45;
      for (let s = -1; s <= 1; s += 2) {
        ctx.beginPath();
        ctx.arc(
          head.x + Math.cos(headAngle) * eDist * 0.4 + Math.sin(headAngle) * s * eDist * 0.6,
          head.y + Math.sin(headAngle) * eDist * 0.4 - Math.cos(headAngle) * s * eDist * 0.6,
          eyeR, 0, Math.PI * 2
        );
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.globalAlpha = Math.min(1, this.opacity * 1.3);
        ctx.fill();
      }

      // ---- Tongue flick ----
      if (this.tongueFlick) {
        const flick = Math.sin(time * this.speed * 4 + this.tonguePhase);
        if (flick > 0.7) {
          const tLen = headR * 1.2;
          const fA = 0.3;
          const tx = head.x + Math.cos(headAngle) * (headR + 2);
          const ty = head.y + Math.sin(headAngle) * (headR + 2);
          const alpha = this.opacity * 0.7 * ((flick - 0.7) / 0.3);

          ctx.strokeStyle = '#CC4444';
          ctx.lineWidth = 1.2;
          ctx.globalAlpha = alpha;

          // Tongue stem
          ctx.beginPath();
          ctx.moveTo(head.x + Math.cos(headAngle) * headR * 0.7, head.y + Math.sin(headAngle) * headR * 0.7);
          ctx.lineTo(tx, ty);
          ctx.stroke();

          // Fork left
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(tx + Math.cos(headAngle - fA) * tLen * 0.6, ty + Math.sin(headAngle - fA) * tLen * 0.6);
          ctx.stroke();

          // Fork right
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(tx + Math.cos(headAngle + fA) * tLen * 0.6, ty + Math.sin(headAngle + fA) * tLen * 0.6);
          ctx.stroke();
        }
      }

      ctx.restore();
    }
  }

  // ---- Safe zone: central game area ----
  function getSafeZone() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const panelW = Math.min(600, w * 0.85);
    const panelH = Math.min(400, h * 0.45);

    const cx = w / 2;
    const cy = h / 2;

    return {
      x: cx - panelW / 2 - 15,
      y: cy - panelH / 2 - 60,
      w: panelW + 30,
      h: panelH + 140,
    };
  }

  // ---- Main ----
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
    const density = this.reducedMotion ? 0.5 : 1;

    let count;
    if (isMobile) count = Math.floor((4 + Math.random() * 4) * density);
    else if (isTablet) count = Math.floor((6 + Math.random() * 6) * density);
    else count = Math.floor((10 + Math.random() * 8) * density);

    const safe = getSafeZone();
    this.snakes = [];
    for (let i = 0; i < count; i++) {
      this.snakes.push(new BorderSnake(rng, w, h, safe));
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
    const elapsed = (timestamp - this.startTime) / 1000;

    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < this.snakes.length; i++) {
      this.snakes[i].draw(ctx, this.reducedMotion ? 0 : elapsed);
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
    document.removeEventListener('visibilitychange', this.handleVis);
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  };

  window.SnakeField = SnakeField;
})();
