/**
 * Canvas renderer for HissTastic browser game.
 * Renders game state to an HTML5 Canvas element with responsive scaling.
 */

class Renderer {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.game = game;

    // Internal grid dimensions (logical)
    this.gw = CONFIG.grid.width;
    this.gh = CONFIG.grid.height;
    this.bs = CONFIG.grid.blockSize;

    this.dpr = window.devicePixelRatio || 1;
    this.scale = 1;
  }

  // ---- Scale canvas to container (with devicePixelRatio for crisp rendering) ----
  resize() {
    this.gw = this.game.getGridWidth();
    this.gh = this.game.getGridHeight();
    const dpr = window.devicePixelRatio || 1;
    const parent = this.canvas.parentElement;
    const maxW = parent.clientWidth;
    const maxH = window.innerHeight * 0.85;
    const scale = Math.min(maxW / this.gw, maxH / this.gh, 3);
    // Canvas buffer at full DPR resolution for crisp rendering on high-DPI screens
    this.canvas.width = Math.round(this.gw * dpr);
    this.canvas.height = Math.round(this.gh * dpr);
    this.canvas.style.width = (this.gw * scale) + 'px';
    this.canvas.style.height = (this.gh * scale) + 'px';
    // Scale context so all drawing ops use logical coordinates (0..gw, 0..gh)
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    this.scale = scale;
  }

  // ---- Clear ----
  clear() {
    this.ctx.fillStyle = CONFIG.colors.brightWhite;
    this.ctx.fillRect(0, 0, this.gw, this.gh);
  }

  // ---- Draw grid lines (subtle) ----
  drawGrid() {
    const ctx = this.ctx;
    ctx.strokeStyle = CONFIG.colors.gridLine;
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= this.gw; x += this.bs) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.gh); ctx.stroke();
    }
    for (let y = 0; y <= this.gh; y += this.bs) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.gw, y); ctx.stroke();
    }
  }

  // ---- Draw snake ----
  drawSnake() {
    const ctx = this.ctx;
    const s = this.game.snake;
    if (!s || s.body.length === 0) return;
    const bs = this.bs;
    const gap = 1;
    const body = s.body;
    const len = body.length;

    // Body segments (all except head) — use for loop to avoid per-frame closure allocation
    ctx.fillStyle = CONFIG.colors.snake;
    for (let i = 0; i < len - 1; i++) {
      const seg = body[i];
      this._roundRect(seg.x + gap, seg.y + gap, bs - gap * 2, bs - gap * 2, 2);
    }

    // Head
    const head = body[len - 1];
    ctx.fillStyle = CONFIG.colors.snakeHead;
    this._roundRect(head.x + gap, head.y + gap, bs - gap * 2, bs - gap * 2, 3);

    // Eyes on head
    ctx.fillStyle = '#FFF';
    const eyeSize = 3;
    let ex1, ey1, ex2, ey2;
    if (s.directionX > 0) { ex1 = head.x + 14; ey1 = head.y + 4; ex2 = head.x + 14; ey2 = head.y + 13; }
    else if (s.directionX < 0) { ex1 = head.x + 3; ey1 = head.y + 4; ex2 = head.x + 3; ey2 = head.y + 13; }
    else if (s.directionY > 0) { ex1 = head.x + 4; ey1 = head.y + 14; ex2 = head.x + 13; ey2 = head.y + 14; }
    else { ex1 = head.x + 4; ey1 = head.y + 3; ex2 = head.x + 13; ey2 = head.y + 3; }
    ctx.beginPath(); ctx.arc(ex1, ey1, eyeSize, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(ex2, ey2, eyeSize, 0, Math.PI * 2); ctx.fill();
  }

  _roundRect(x, y, w, h, r) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  }

  // ---- Draw food ----
  drawFood() {
    if (!this.game.food) return;
    const ctx = this.ctx;
    const bs = this.bs;
    ctx.fillStyle = CONFIG.colors.food;
    ctx.beginPath();
    ctx.arc(this.game.food.x + bs / 2, this.game.food.y + bs / 2, bs / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    // Highlight
    ctx.fillStyle = '#FF8888';
    ctx.beginPath();
    ctx.arc(this.game.food.x + bs / 2 - 3, this.game.food.y + bs / 2 - 3, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- Draw obstacles ----
  drawObstacles() {
    const obs = this.game.obstacles;
    if (!obs || obs.length === 0) return;
    const ctx = this.ctx;
    const bs = this.bs;
    for (let i = 0; i < obs.length; i++) {
      const ob = obs[i];
      ctx.fillStyle = CONFIG.colors.obstacle;
      ctx.fillRect(ob.x + 1, ob.y + 1, bs - 2, bs - 2);
      // X pattern
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ob.x + 3, ob.y + 3); ctx.lineTo(ob.x + bs - 3, ob.y + bs - 3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ob.x + bs - 3, ob.y + 3); ctx.lineTo(ob.x + 3, ob.y + bs - 3); ctx.stroke();
    }
  }

  // ---- Draw power-up ----
  drawPowerUp() {
    if (!this.game.powerUp || !this.game.powerUp.active) return;
    const ctx = this.ctx;
    const bs = this.bs;

    const typeColors = {
      immunity: '#FFD700',
      speed_boost: '#2196F3',
      shield: '#9E9E9E',
      score_multiplier: '#9C27B0',
    };

    const typeGlow = {
      immunity: '#FFEE44',
      speed_boost: '#64B5F6',
      shield: '#BDBDBD',
      score_multiplier: '#CE93D8',
    };

    const puType = this.game.powerUp.powerUpType;
    ctx.fillStyle = typeColors[puType] || CONFIG.colors.powerUp;
    ctx.beginPath();
    ctx.arc(this.game.powerUp.x + bs / 2, this.game.powerUp.y + bs / 2, bs / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    // Inner glow
    ctx.fillStyle = typeGlow[puType] || '#FFEE44';
    ctx.beginPath();
    ctx.arc(this.game.powerUp.x + bs / 2, this.game.powerUp.y + bs / 2, bs / 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- Draw score ----
  drawScore() {
    if (this.game.state === 'TITLE') return;
    const ctx = this.ctx;
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = CONFIG.colors.black;
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + this.game.score, 8, 20);

    // Active power-up indicators
    const indicators = [];
    if (this.game.immune) indicators.push({ text: 'IMMUNE', color: '#FFD700' });
    if (this.game.speedBoostActive) indicators.push({ text: 'SPEED', color: '#2196F3' });
    if (this.game.shielded) indicators.push({ text: 'SHIELD', color: '#9E9E9E' });
    if (this.game.scoreMultiplier > 1) indicators.push({ text: 'x' + this.game.scoreMultiplier + ' SCORE', color: '#9C27B0' });

    let xPos = this.gw - 8;
    for (let i = indicators.length - 1; i >= 0; i--) {
      const ind = indicators[i];
      ctx.fillStyle = ind.color;
      ctx.textAlign = 'right';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(ind.text, xPos, 20);
      xPos -= ctx.measureText(ind.text).width + 10;
    }
  }

  // ---- Draw watermark ----
  drawWatermark() {
    const ctx = this.ctx;
    ctx.font = '14px monospace';
    ctx.fillStyle = CONFIG.colors.fadedBlack;
    ctx.textAlign = 'center';
    ctx.fillText('by SPARSH', this.gw / 2, this.gh - 15);
  }

  // ---- Draw mute indicator ----
  drawMuteIndicator() {
    if (this.game.state === 'TITLE') return;
    const ctx = this.ctx;
    if (this.game.muted) {
      ctx.font = '12px monospace';
      ctx.fillStyle = '#CC0000';
      ctx.textAlign = 'right';
      ctx.fillText('MUTED', this.gw - 8, 36);
    }
  }

  // ---- Title screen ----
  drawTitle() {
    this.clear();
    const ctx = this.ctx;

    ctx.fillStyle = CONFIG.colors.neonPink;
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('HISSTASTIC', this.gw / 2, this.gh / 3);

    ctx.fillStyle = CONFIG.colors.black;
    ctx.font = '18px monospace';
    ctx.fillText('by SPARSH', this.gw / 2, this.gh / 2.4);

    ctx.font = '14px monospace';
    ctx.fillText('Press SPACE or tap to start', this.gw / 2, this.gh / 1.8);

    // Difficulty display
    const mode = this.game.difficultyMode;
    ctx.font = '12px monospace';
    ctx.fillStyle = '#666';
    ctx.fillText('1:Easy  2:Normal  3:Hard', this.gw / 2, this.gh / 1.55);
    ctx.fillStyle = CONFIG.colors.neonPink;
    ctx.fillText('[' + mode.toUpperCase() + ']', this.gw / 2, this.gh / 1.45);

    // Replay import hint
    ctx.fillStyle = '#999';
    ctx.font = '11px monospace';
    ctx.fillText('Drop a replay .json file to view it', this.gw / 2, this.gh - 35);
  }

  // ---- Game over screen ----
  drawGameOver() {
    this.clear();
    const ctx = this.ctx;
    const score = this.game.score;

    // Get snake-fact roast via commentary engine (falls back to legacy insults)
    let msg;
    if (window.commentary && window.commentary.enabled) {
      msg = window.commentary.showGameOverRoast({
        score: this.game.score,
        selfCollision: this.game._lastCollisionType === 'self',
      });
    } else {
      msg = this.game.getMeanMessage();
    }

    ctx.fillStyle = CONFIG.colors.neonPink;
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    this._wrapText(ctx, msg, this.gw / 2, this.gh / 3.5, this.gw - 40, 16);

    ctx.fillStyle = CONFIG.colors.black;
    ctx.font = 'bold 32px monospace';
    ctx.fillText('Score: ' + score, this.gw / 2, this.gh / 2.2);

    ctx.font = '14px monospace';
    ctx.fillText('Press R or tap to retry', this.gw / 2, this.gh / 1.7);
    ctx.fillText('Press Q to quit', this.gw / 2, this.gh / 1.55);

    // Replay info
    const replay = this.game.getReplaySummary();
    if (replay.inputs > 0) {
      ctx.fillStyle = '#999';
      ctx.font = '11px monospace';
      ctx.fillText('Replay recorded (' + replay.inputs + ' inputs)', this.gw / 2, this.gh / 1.35);
    }

    this.drawWatermark();
  }

  // ---- Pause overlay ----
  drawPauseOverlay() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(0, 0, this.gw, this.gh);
    ctx.fillStyle = CONFIG.colors.neonPink;
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', this.gw / 2, this.gh / 2);
    ctx.fillStyle = CONFIG.colors.black;
    ctx.font = '14px monospace';
    ctx.fillText('Press P or ESC to resume', this.gw / 2, this.gh / 2 + 30);
  }

  // ---- Word-wrap helper for long text ----
  _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let lineY = y;

    for (const word of words) {
      const testLine = line ? line + ' ' + word : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line) {
        ctx.fillText(line, x, lineY);
        line = word;
        lineY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line) {
      ctx.fillText(line, x, lineY);
    }
  }

  // ---- Replay info overlay ----
  drawReplayInfo(info) {
    const ctx = this.ctx;
    this.clear();
    ctx.fillStyle = CONFIG.colors.black;
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Replay Details', this.gw / 2, 40);

    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    const lines = [
      'Seed: ' + info.seed,
      'Score: ' + info.expected_score,
      'Snake Length: ' + info.snake_length,
      'Inputs: ' + info.input_count,
      'Version: ' + info.version,
      'Timestamp: ' + (info.timestamp || 'N/A'),
    ];
    lines.forEach((line, i) => {
      ctx.fillText(line, 40, 80 + i * 24);
    });

    ctx.textAlign = 'center';
    ctx.fillStyle = '#666';
    ctx.font = '12px monospace';
    ctx.fillText('Press SPACE to play this replay', this.gw / 2, this.gh - 60);
    ctx.fillText('Press ESC to return to title', this.gw / 2, this.gh - 40);
  }

  // ---- Full frame render ----
  render() {
    this.resize();

    if (this.game.state === 'TITLE') {
      this.drawTitle();
      return;
    }

    this.clear();
    this.drawGrid();

    if (this.game.state === 'PLAYING' || this.game.state === 'PAUSED' || this.game.state === 'GAME_OVER') {
      this.drawFood();
      if (this.game.powerUp && this.game.powerUp.active) this.drawPowerUp();
      this.drawSnake();
      this.drawObstacles();
      this.drawScore();
      this.drawWatermark();
      this.drawMuteIndicator();
    }

    if (this.game.state === 'PAUSED') {
      this.drawPauseOverlay();
    }

    if (this.game.state === 'GAME_OVER') {
      this.drawGameOver();
    }
  }
}

window.Renderer = Renderer;
