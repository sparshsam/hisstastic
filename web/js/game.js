/**
 * Hiss-Tastic Browser Game Engine
 * Canvas-based snake game matching the Python runtime behavior.
 * No external dependencies.
 */

// ---- Game version ----
const GAME_VERSION = '0.6.0';

// ---- Constants ----
const CONFIG = {
  colors: {
    brightWhite: '#FFFFFF',
    neonPink: '#4CAF50',
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
    speedBoostDuration: 4.0,
    scoreMultiplierDuration: 5.0,
    powerUpTypes: ['immunity', 'speed_boost', 'shield', 'score_multiplier'],
  },
  difficulty: {
    mode: 'normal',
    presets: {
      easy: { initialSpeed: 4, speedIncrement: 1, obstacleCount: 3, immunityDuration: 5.0 },
      normal: { initialSpeed: 5, speedIncrement: 1, obstacleCount: 5, immunityDuration: 3.8 },
      hard: { initialSpeed: 7, speedIncrement: 2, obstacleCount: 8, immunityDuration: 2.5 },
    },
  },
  themes: {
    classic: {
      name: 'Classic',
      bg: '#FFFFFF',
      snake: '#4CAF50',
      snakeHead: '#2E7D32',
      food: '#FF4444',
      obstacle: '#666666',
      powerUp: '#FFD700',
      accent: '#4CAF50',
      gridLine: '#F0F0F0',
    },
    midnight: {
      name: 'Midnight',
      bg: '#1a1a2e',
      snake: '#00d2ff',
      snakeHead: '#0099cc',
      food: '#ff6b6b',
      obstacle: '#4a4a6a',
      powerUp: '#ffd93d',
      accent: '#00d2ff',
      gridLine: '#2a2a4e',
    },
    desert: {
      name: 'Desert',
      bg: '#f4e4c1',
      snake: '#c4843a',
      snakeHead: '#8b5e2b',
      food: '#e74c3c',
      obstacle: '#a0845c',
      powerUp: '#f39c12',
      accent: '#c4843a',
      gridLine: '#e8d5a3',
    },
    ocean: {
      name: 'Ocean',
      bg: '#e8f4f8',
      snake: '#1a8a9e',
      snakeHead: '#0d5c6e',
      food: '#ff6f61',
      obstacle: '#5a8a9e',
      powerUp: '#ffd700',
      accent: '#1a8a9e',
      gridLine: '#d0e8f0',
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
    this.body = [{ x, y }];
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
    const hx = this.head.x, hy = this.head.y;
    this.body.push({ x: hx + this.directionX, y: hy + this.directionY });
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
      if (this.body[i].x === h.x && this.body[i].y === h.y) return true;
    }
    return false;
  }

  isOn(x, y) {
    return this.body.some(seg => seg.x === x && seg.y === y);
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
  constructor(x, y, powerUpType) {
    this.x = x;
    this.y = y;
    this.active = true;
    this.powerUpType = powerUpType || 'immunity';
  }
  get position() { return [this.x, this.y]; }
  deactivate() { this.active = false; }
  reactivate(x, y, powerUpType) {
    this.x = x;
    this.y = y;
    this.active = true;
    if (powerUpType) this.powerUpType = powerUpType;
  }
}

// ---- Spawn helpers ----
function randomGridPosition(bs, gw, gh, rng) {
  const r = rng || Math.random;
  const cols = Math.floor(gw / bs);
  const rows = Math.floor(gh / bs);
  return [Math.floor(r() * cols) * bs, Math.floor(r() * rows) * bs];
}

function isOnSnake(x, y, snakeBody) {
  return snakeBody.some(seg => seg.x === x && seg.y === y);
}

function isOnObstacles(x, y, obstacles) {
  return obstacles.some(o => o.x === x && o.y === y);
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
      if (!obs.some(o => o.x === x && o.y === y) && !(x === snakeHead.x && y === snakeHead.y)) {
        obs.push({ x, y });
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
    this.currentTheme = 'classic';
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

    // Gameplay stats tracking
    this.stats = {
      gamesPlayed: 0,
      totalFood: 0,
      totalScore: 0,
      longestSnake: 1,
      highestScore: 0,
      lastTenScores: [],
    };

    // DOM references (set by app.js)
    this.canvas = null;
    this.ctx = null;
    this.overlay = null;
  }

  // ---- Portrait mode detection ----
  isPortrait() {
    return window.innerHeight > window.innerWidth;
  }

  getGridWidth() {
    return this.isPortrait() ? 280 : CONFIG.grid.width;
  }

  getGridHeight() {
    return this.isPortrait() ? 460 : CONFIG.grid.height;
  }

  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
  }

  emit(event, data) {
    (this._listeners[event] || []).forEach(cb => cb(data));
  }

  // ---- Theme ----
  setTheme(name) {
    const theme = CONFIG.themes[name];
    if (!theme) return;
    this.currentTheme = name;
    CONFIG.colors.brightWhite = theme.bg;
    CONFIG.colors.neonPink = theme.accent;
    CONFIG.colors.snake = theme.snake;
    CONFIG.colors.snakeHead = theme.snakeHead;
    CONFIG.colors.food = theme.food;
    CONFIG.colors.obstacle = theme.obstacle;
    CONFIG.colors.powerUp = theme.powerUp;
    CONFIG.colors.gridLine = theme.gridLine;
    localStorage.setItem('hissTasticTheme', name);
  }

  // ---- Game session ----
  startGame(seed) {
    const preset = CONFIG.difficulty.presets[this.difficultyMode] || CONFIG.difficulty.presets.normal;
    seed = seed || Math.floor(Math.random() * 2147483647);
    this.replaySeed = seed;
    const rng = createRNG(seed);

    const bs = CONFIG.grid.blockSize;
    const gw = this.getGridWidth();
    const gh = this.getGridHeight();

    this.rng = rng;
    this.snake = new Snake(Math.floor(gw / bs / 2) * bs, Math.floor(gh / bs / 2) * bs);
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
    const types = CONFIG.gameplay.powerUpTypes;
    const type = types[Math.floor(rng() * types.length)];
    this.powerUp = new PowerUp(px, py, type);

    this.powerupsCollected = 0;
    this.immune = false;
    this.immuneStartTime = 0;
    this.speedBoostActive = false;
    this.speedBoostStartTime = 0;
    this.shielded = false;
    this.scoreMultiplier = 1;
    this.scoreMultiplierStartTime = 0;
    this.lastDirection = null;
    this._lastCollisionType = null;

    this.state = 'PLAYING';
    this.stats.gamesPlayed++;
    this.emit(EVENTS.START, { seed });
  }

  // ---- Replay playback ----
  loadReplay(replayData) {
    const preset = CONFIG.difficulty.presets[this.difficultyMode] || CONFIG.difficulty.presets.normal;
    const seed = replayData.seed;
    const rng = createRNG(seed);

    const bs = CONFIG.grid.blockSize;
    const gw = this.getGridWidth();
    const gh = this.getGridHeight();

    this.rng = rng;
    this.snake = new Snake(Math.floor(gw / bs / 2) * bs, Math.floor(gh / bs / 2) * bs);
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
    const types = CONFIG.gameplay.powerUpTypes;
    const type = types[Math.floor(rng() * types.length)];
    this.powerUp = new PowerUp(px, py, type);

    this.powerupsCollected = 0;
    this.immune = false;
    this.immuneStartTime = 0;
    this.speedBoostActive = false;
    this.speedBoostStartTime = 0;
    this.shielded = false;
    this.scoreMultiplier = 1;
    this.scoreMultiplierStartTime = 0;
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
    const gw = this.getGridWidth();
    const gh = this.getGridHeight();

    // Check wall collision BEFORE moving
    const hx = this.snake.head.x, hy = this.snake.head.y;
    if (hx >= gw || hx < 0 || hy >= gh || hy < 0) {
      if (this.shielded) {
        this.shielded = false;
        // Shield consumed — survive this collision
      } else {
        this.state = 'GAME_OVER';
        this._lastCollisionType = 'wall';
        this._recordGameOverStats();
        this.emit(EVENTS.QUIT, { score: this.score, collisionType: 'wall' });
        return;
      }
    }

    // Move
    this.snake.move();

    // Self collision
    if (this.snake.collidesWithSelf()) {
      if (this.shielded) {
        this.shielded = false;
        // Shield consumed — survive this collision
      } else if (!this.immune) {
        this.state = 'GAME_OVER';
        this._lastCollisionType = 'self';
        this._recordGameOverStats();
        this.emit(EVENTS.QUIT, { score: this.score, collisionType: 'self' });
        return;
      }
    }

    // Obstacle collision
    for (const o of this.obstacles) {
      if (this.snake.head.x === o.x && this.snake.head.y === o.y) {
        if (this.shielded) {
          this.shielded = false;
          // Shield consumed — survive this collision
        } else if (!this.immune) {
          this.state = 'GAME_OVER';
          this._lastCollisionType = 'obstacle';
          this._recordGameOverStats();
          this.emit(EVENTS.QUIT, { score: this.score, collisionType: 'obstacle' });
          return;
        }
        break;
      }
    }

    // Food collection
    if (this.snake.head.x === this.food.x && this.snake.head.y === this.food.y) {
      const [fx, fy] = safeFoodPosition(bs, gw, gh, this.snake.body, this.obstacles, this.rng);
      this.food = new Food(fx, fy);
      this.snake.grow();
      this.snakeSpeed += CONFIG.gameplay.speedIncrement;
      this.foodCount++;
      this.stats.totalFood++;
      this.score += getQuadraticScore(this.foodCount) * this.scoreMultiplier;
      this.emit(EVENTS.DIRECTION, { type: 'eat' });
    }

    // Power-up collection
    if (this.powerUp.active &&
        this.snake.head.x === this.powerUp.x &&
        this.snake.head.y === this.powerUp.y) {
      this.powerUp.deactivate();
      const type = this.powerUp.powerUpType;

      switch (type) {
        case 'immunity':
          this.immune = true;
          this.immuneStartTime = performance.now();
          break;
        case 'speed_boost':
          this.speedBoostActive = true;
          this.speedBoostStartTime = performance.now();
          break;
        case 'shield':
          this.shielded = true;
          break;
        case 'score_multiplier':
          this.scoreMultiplier = 2;
          this.scoreMultiplierStartTime = performance.now();
          break;
      }

      this.emit(EVENTS.DIRECTION, { type: 'powerup', powerUpType: type });
      this.powerupsCollected++;
    }

    // Immunity timeout
    if (this.immune && (performance.now() - this.immuneStartTime) > CONFIG.gameplay.immunityDuration * 1000) {
      this.immune = false;
    }

    // Speed boost timeout
    if (this.speedBoostActive && (performance.now() - this.speedBoostStartTime) > CONFIG.gameplay.speedBoostDuration * 1000) {
      this.speedBoostActive = false;
    }

    // Score multiplier timeout
    if (this.scoreMultiplier > 1 && (performance.now() - this.scoreMultiplierStartTime) > CONFIG.gameplay.scoreMultiplierDuration * 1000) {
      this.scoreMultiplier = 1;
    }

    // Power-up respawn
    if (!this.powerUp.active && this.rng() < 1 / CONFIG.gameplay.powerUpRespawnChance) {
      const [px, py] = safePowerUpPosition(bs, gw, gh, this.obstacles, this.rng);
      const types = CONFIG.gameplay.powerUpTypes;
      const type = types[Math.floor(this.rng() * types.length)];
      this.powerUp.reactivate(px, py, type);
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

  get effectiveSpeed() {
    return this.snakeSpeed + (this.speedBoostActive ? 3 : 0);
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

  _recordGameOverStats() {
    this.stats.totalScore += this.score;
    this.stats.longestSnake = Math.max(this.stats.longestSnake, this.snake.length);
    this.stats.highestScore = Math.max(this.stats.highestScore, this.score);
    this.stats.lastTenScores.push(this.score);
    if (this.stats.lastTenScores.length > 10) this.stats.lastTenScores.shift();
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
