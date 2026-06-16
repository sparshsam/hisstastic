/**
 * Hiss-Tastic Browser Game Engine
 * Canvas-based snake game matching the Python runtime behavior.
 * No external dependencies.
 */

// ---- Game version ----
const GAME_VERSION = '0.5.2';

// ---- Constants ----
const CONFIG = {
  colors: {
    brightWhite: '#FFFFFF',
    neonPink: '#FF1493',
    black: '#000000',
    fadedBlack: 'rgba(0,0,0,0.08)',
    gridLine: '#F0F0F0',
    snake: '#4CAF50',
    snakeHead: '#2E7D32',
    food: '#FF4444',
    obstacle: '#666666',
    powerUp: '#FFD700',
  },
  grid: {
    width: 600,
    height: 400,
    blockSize: 20,
  },
  gameplay: {
    initialSpeed: 5,
    speedIncrement: 1,
    immunityDuration: 3.8,
    obstacleCount: 5,
    powerUpRespawnChance: 50,
  },
  difficulty: {
    mode: 'normal',
    presets: {
      easy: { initialSpeed: 4, speedIncrement: 1, obstacleCount: 3, immunityDuration: 5.0 },
      normal: { initialSpeed: 5, speedIncrement: 1, obstacleCount: 5, immunityDuration: 3.8 },
      hard: { initialSpeed: 7, speedIncrement: 2, obstacleCount: 8, immunityDuration: 2.5 },
    },
  },
};

// ---- Seeded PRNG (mulberry32) ----
function createRNG(seed) {
  let s = seed | 0;
  return function() {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- Legacy scoring messages ----
function getMeanMessage(score) {
  if (score < 10) return "Your IQ must be lower than room temperature!";
  if (score < 25) return "Try harder next time!";
  if (score < 50) return "Well, at least you tried!";
  if (score < 75) return "Not bad, but you can do better!";
  if (score < 100) return "Good effort, but still room for improvement!";
  if (score < 125) return "Great job, almost a pro!";
  if (score < 150) return "Wow, you're a snake master!";
  return "You're a legend!";
}

function getQuadraticScore(n) {
  return n * n;
}

// ---- Snake ----
class Snake {
  constructor(x, y) {
    this.body = [[x, y]];
    this.length = 1;
    this.directionX = 0;
    this.directionY = 0;
  }

  get head() {
    return this.body[this.body.length - 1];
  }

  setDirection(dx, dy) {
    // Prevent 180-degree reversal
    if (this.directionX !== 0 && dx === -this.directionX) return;
    if (this.directionY !== 0 && dy === -this.directionY) return;
    this.directionX = dx;
    this.directionY = dy;
  }

  move() {
    const [hx, hy] = this.head;
    this.body.push([hx + this.directionX, hy + this.directionY]);
    if (this.body.length > this.length) {
      this.body.shift();
    }
  }

  grow() {
    this.length++;
  }

  collidesWithSelf() {
    const h = this.head;
    for (let i = 0; i < this.body.length - 1; i++) {
      if (this.body[i][0] === h[0] && this.body[i][1] === h[1]) return true;
    }
    return false;
  }

  isOn(x, y) {
    return this.body.some(seg => seg[0] === x && seg[1] === y);
  }
}

// ---- Food ----
class Food {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  get position() { return [this.x, this.y]; }
}

// ---- PowerUp ----
class PowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.active = true;
  }
  get position() { return [this.x, this.y]; }
  deactivate() { this.active = false; }
  reactivate(x, y) { this.x = x; this.y = y; this.active = true; }
}

// ---- Spawn helpers ----
function randomGridPosition(bs, gw, gh, rng) {
  const r = rng || Math.random;
  const cols = Math.floor(gw / bs);
  const rows = Math.floor(gh / bs);
  return [Math.floor(r() * cols) * bs, Math.floor(r() * rows) * bs];
}

function isOnSnake(x, y, snakeBody) {
  return snakeBody.some(seg => seg[0] === x && seg[1] === y);
}

function isOnObstacles(x, y, obstacles) {
  return obstacles.some(o => o[0] === x && o[1] === y);
}

function safeFoodPosition(bs, gw, gh, snakeBody, obstacles, rng, maxAttempts) {
  maxAttempts = maxAttempts || 100;
  for (let i = 0; i < maxAttempts; i++) {
    const [x, y] = randomGridPosition(bs, gw, gh, rng);
    if (!isOnSnake(x, y, snakeBody) && !isOnObstacles(x, y, obstacles)) return [x, y];
  }
  return randomGridPosition(bs, gw, gh, rng);
}

function safePowerUpPosition(bs, gw, gh, obstacles, rng, maxAttempts) {
  maxAttempts = maxAttempts || 100;
  for (let i = 0; i < maxAttempts; i++) {
    const [x, y] = randomGridPosition(bs, gw, gh, rng);
    if (!isOnObstacles(x, y, obstacles)) return [x, y];
  }
  return randomGridPosition(bs, gw, gh, rng);
}

function generateObstacles(count, bs, gw, gh, snakeHead, rng, maxAttempts) {
  maxAttempts = maxAttempts || 100;
  const obs = [];
  for (let i = 0; i < count; i++) {
    for (let j = 0; j < maxAttempts; j++) {
      const [x, y] = randomGridPosition(bs, gw, gh, rng);
      if (!obs.some(o => o[0] === x && o[1] === y) && !(x === snakeHead[0] && y === snakeHead[1])) {
        obs.push([x, y]);
        break;
      }
    }
  }
  return obs;
}

// ---- Events ----
const EVENTS = {
  DIRECTION: 'direction',
  QUIT: 'quit',
  RETRY: 'retry',
  PAUSE: 'pause',
  MUTE: 'mute',
  START: 'start',
  DIFFICULTY: 'difficulty',
};

// ---- Main Game Class ----
class HissTastic {
  constructor() {
    this.state = 'TITLE';  // TITLE, PLAYING, PAUSED, GAME_OVER
    this.difficultyMode = CONFIG.difficulty.mode;
    this.muted = false;
    this.score = 0;
    this.foodCount = 0;
    this.snakeSpeed = CONFIG.gameplay.initialSpeed;

    // Replay
    this.replayInputs = [];
    this.replaySeed = null;
    this.replayMode = false;  // true when playing back a replay
    this.replayIndex = 0;
    this.currentTick = 0;

    // Event listeners
    this._listeners = {};
    this._lastCollisionType = null;

    // DOM references (set by app.js)
    this.canvas = null;
    this.ctx = null;
    this.overlay = null;
  }

  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
  }

  emit(event, data) {
    (this._listeners[event] || []).forEach(cb => cb(data));
  }

  // ---- Game session ----
  startGame(seed) {
    const preset = CONFIG.difficulty.presets[this.difficultyMode] || CONFIG.difficulty.presets.normal;
    seed = seed || Math.floor(Math.random() * 2147483647);
    this.replaySeed = seed;
    const rng = createRNG(seed);

    const bs = CONFIG.grid.blockSize;
    const gw = CONFIG.grid.width;
    const gh = CONFIG.grid.height;

    this.rng = rng;
    this.snake = new Snake(gw / 2, gh / 2);
    this.snakeSpeed = preset.initialSpeed;
    this.score = 0;
    this.foodCount = 0;
    this.currentTick = 0;
    this.replayInputs = [];
    this.replayMode = false;

    this.obstacles = generateObstacles(
      preset.obstacleCount, bs, gw, gh,
      this.snake.head, rng
    );

    const [fx, fy] = safeFoodPosition(bs, gw, gh, this.snake.body, this.obstacles, rng);
    this.food = new Food(fx, fy);

    const [px, py] = safePowerUpPosition(bs, gw, gh, this.obstacles, rng);
    this.powerUp = new PowerUp(px, py);

    this.immune = false;
    this.immuneStartTime = 0;
    this.lastDirection = null;
    this._lastCollisionType = null;

    this.state = 'PLAYING';
    this.emit(EVENTS.START, { seed });
  }

  // ---- Replay playback ----
  loadReplay(replayData) {
    const preset = CONFIG.difficulty.presets[this.difficultyMode] || CONFIG.difficulty.presets.normal;
    const seed = replayData.seed;
    const rng = createRNG(seed);

    const bs = CONFIG.grid.blockSize;
    const gw = CONFIG.grid.width;
    const gh = CONFIG.grid.height;

    this.rng = rng;
    this.snake = new Snake(gw / 2, gh / 2);
    this.snakeSpeed = preset.initialSpeed;
    this.score = 0;
    this.foodCount = 0;
    this.currentTick = 0;

    this.obstacles = generateObstacles(
      preset.obstacleCount, bs, gw, gh,
      this.snake.head, rng
    );

    const [fx, fy] = safeFoodPosition(bs, gw, gh, this.snake.body, this.obstacles, rng);
    this.food = new Food(fx, fy);

    const [px, py] = safePowerUpPosition(bs, gw, gh, this.obstacles, rng);
    this.powerUp = new PowerUp(px, py);

    this.immune = false;
    this.immuneStartTime = 0;
    this.lastDirection = null;
    this._lastCollisionType = null;

    // Replay playback setup
    this.replayMode = true;
    this.replayInputs = replayData.inputs || [];
    this.replayIndex = 0;
    this.expectedScore = replayData.score;
    this.replaySeed = seed;

    this.state = 'PLAYING';
    this.emit(EVENTS.START, { seed, replay: true });
  }

  // ---- Game tick ----
  tick(dt) {
    if (this.state !== 'PLAYING') return;

    const bs = CONFIG.grid.blockSize;
    const gw = CONFIG.grid.width;
    const gh = CONFIG.grid.height;

    // Check wall collision BEFORE moving
    const [hx, hy] = this.snake.head;
    if (hx >= gw || hx < 0 || hy >= gh || hy < 0) {
      this.state = 'GAME_OVER';
      this._lastCollisionType = 'wall';
      this.emit(EVENTS.QUIT, { score: this.score, collisionType: 'wall' });
      return;
    }

    // Move
    this.snake.move();

    // Self collision
    if (this.snake.collidesWithSelf() && !this.immune) {
      this.state = 'GAME_OVER';
      this._lastCollisionType = 'self';
      this.emit(EVENTS.QUIT, { score: this.score, collisionType: 'self' });
      return;
    }

    // Obstacle collision
    for (const o of this.obstacles) {
      if (this.snake.head[0] === o[0] && this.snake.head[1] === o[1]) {
        if (!this.immune) {
          this.state = 'GAME_OVER';
          this._lastCollisionType = 'obstacle';
          this.emit(EVENTS.QUIT, { score: this.score, collisionType: 'obstacle' });
          return;
        }
        break;
      }
    }

    // Food collection
    if (this.snake.head[0] === this.food.x && this.snake.head[1] === this.food.y) {
      const [fx, fy] = safeFoodPosition(bs, gw, gh, this.snake.body, this.obstacles, this.rng);
      this.food = new Food(fx, fy);
      this.snake.grow();
      this.snakeSpeed += CONFIG.gameplay.speedIncrement;
      this.foodCount++;
      this.score += getQuadraticScore(this.foodCount);
      this.emit(EVENTS.DIRECTION, { type: 'eat' });
    }

    // Power-up collection
    if (this.powerUp.active &&
        this.snake.head[0] === this.powerUp.x &&
        this.snake.head[1] === this.powerUp.y) {
      this.powerUp.deactivate();
      this.immune = true;
      this.immuneStartTime = performance.now();
      this.emit(EVENTS.DIRECTION, { type: 'powerup' });
    }

    // Immunity timeout
    if (this.immune && (performance.now() - this.immuneStartTime) > CONFIG.gameplay.immunityDuration * 1000) {
      this.immune = false;
    }

    // Power-up respawn
    if (!this.powerUp.active && this.rng() < 1 / CONFIG.gameplay.powerUpRespawnChance) {
      const [px, py] = safePowerUpPosition(bs, gw, gh, this.obstacles, this.rng);
      this.powerUp.reactivate(px, py);
    }

    // Replay playback
    if (this.replayMode && this.replayIndex < this.replayInputs.length) {
      const input = this.replayInputs[this.replayIndex];
      if (input.tick === this.currentTick) {
        const dir = this._directionFromName(input.direction);
        if (dir) this.snake.setDirection(dir[0], dir[1]);
        this.replayIndex++;
      }
    }

    this.currentTick++;
  }

  // ---- Push direction to replay recording ----
  pushReplayInput(direction) {
    if (this.replayMode) return;
    const name = this._directionToName(direction);
    if (name && name !== this.lastDirection) {
      this.replayInputs.push({ tick: this.currentTick, direction: name });
      this.lastDirection = name;
    }
  }

  getReplayData() {
    return {
      version: '1.0.0',
      game: 'hiss-tastic',
      game_version: GAME_VERSION,
      seed: this.replaySeed,
      timestamp: new Date().toISOString(),
      score: this.score,
      snake_length: this.snake ? this.snake.length : 1,
      inputs: this.replayInputs,
    };
  }

  _directionToName(dir) {
    if (!dir) return null;
    if (dir[0] === -1 && dir[1] === 0) return 'LEFT';
    if (dir[0] === 1 && dir[1] === 0) return 'RIGHT';
    if (dir[0] === 0 && dir[1] === -1) return 'UP';
    if (dir[0] === 0 && dir[1] === 1) return 'DOWN';
    return null;
  }

  _directionFromName(name) {
    const map = { LEFT: [-1, 0], RIGHT: [1, 0], UP: [0, -1], DOWN: [0, 1] };
    return map[name] || null;
  }

  getMeanMessage() {
    return getMeanMessage(this.score);
  }

  getReplaySummary() {
    return {
      seed: this.replaySeed,
      score: this.score,
      length: this.snake ? this.snake.length : 1,
      inputs: this.replayInputs.length,
    };
  }
}

// Export for browser
window.HissTastic = HissTastic;
window.CONFIG = CONFIG;
