/**
 * Hiss-Tastic Live Commentary Engine.
 * Listens to gameplay events and produces deterministic snake-fact roasts.
 * No external APIs, no AI/LLM calls, no telemetry.
 * Local-only, offline-compatible.
 */

(function () {
  'use strict';

  function CommentaryEngine() {
    this.enabled = true;
    this.commentaryEl = null;
    this.lastTriggerTime = 0;
    this.cooldownMs = 4000; // minimum gap between comments
    this.seenIds = new Set();
    this.currentCommentary = null;
    this.fadeTimer = null;

    // Track gameplay stats for context-aware roasts
    this.stats = {
      wallCollisions: 0,
      selfCollisions: 0,
      obstacleCollisions: 0,
      earlyDeath: false,
      longSurvival: false,
      rapidDirectionChanges: 0,
      lastDirection: null,
      directionChangeCount: 0,
      powerUpCollected: false,
      powerUpMissed: false,
      missedFoodCount: 0,
      foodProximityEvents: [],
      foodCount: 0,
      score: 0,
      maxScore: 0,
      startTime: 0,
      deathTick: 0,
      idleStart: 0,
    };

    // Seeded RNG for deterministic commentary
    this.rng = null;
    this.seed = null;
  }

  /**
   * Initialize commentary UI and event listeners.
   */
  CommentaryEngine.prototype.init = function (gameInstance) {
    this.game = gameInstance;
    this.seed = Math.floor(Math.random() * 2147483647);
    this.rng = this._createRNG(this.seed);

    // Create commentary UI element
    this.commentaryEl = document.createElement('div');
    this.commentaryEl.id = 'commentary-box';
    this.commentaryEl.className = 'commentary-box';
    this.commentaryEl.setAttribute('aria-live', 'polite');
    this.commentaryEl.setAttribute('aria-atomic', 'true');
    this.commentaryEl.style.display = 'none';

    // Insert after game container
    const gameContainer = document.getElementById('game-container');
    if (gameContainer && gameContainer.parentNode) {
      gameContainer.parentNode.insertBefore(this.commentaryEl, gameContainer.nextSibling);
    } else {
      document.body.appendChild(this.commentaryEl);
    }

    // Wire up game events
    this._wireEvents();
  };

  /**
   * Subscribe to game events.
   */
  CommentaryEngine.prototype._wireEvents = function () {
    const game = this.game;
    if (!game) return;

    // Track direction changes
    const origSetDirection = game.snake ? game.snake.setDirection.bind(game.snake) : null;
    if (origSetDirection) {
      // We track this via the existing event system
    }

    // Use game event system
    game.on('direction', function (data) {
      if (data.type === 'eat') {
        this.stats.foodCount++;
      }
      if (data.type === 'powerup') {
        this.stats.powerUpCollected = true;
        // Live commentary disabled
      }
    }.bind(this));

    game.on('quit', function (data) {
      this.stats.score = data.score;
      this.stats.deathTick = game.currentTick || 0;
    }.bind(this));

    game.on('start', function () {
      this._resetStats();
    }.bind(this));

    // Pass through tick (live commentary disabled — game-over roasts only)
    const origTick = game.tick.bind(game);
    game.tick = function (dt) {
      origTick(dt);
    };
  };

  /**
   * Detect gameplay events after each tick.
   */
  CommentaryEngine.prototype._detectEvents = function (game, prevHead, prevFood) {
    if (game.state !== 'PLAYING') return;

    const stats = this.stats;

    // Detect wall collision
    if (game.snake) {
      const head = game.snake.head;
      const gw = CONFIG.grid.width;
      const gh = CONFIG.grid.height;

      if (head.x >= gw || head.x < 0 || head.y >= gh || head.y < 0) {
        stats.wallCollisions++;
        // Don't trigger commentary on death wall hit — game-over handles it
        if (game.state === 'PLAYING') {
          // Near-wall repeated behavior
          if (stats.wallCollisions > 2) {
            this._trigger('wall_collision');
          }
        }
      }
    }

    // Detect direction changes
    if (game.snake && game.snake.directionX !== 0 && game.snake.directionY !== 0) {
      const dirKey = game.snake.directionX + ',' + game.snake.directionY;
      if (stats.lastDirection && stats.lastDirection !== dirKey) {
        stats.directionChangeCount++;
        if (stats.directionChangeCount > 10 && stats.directionChangeCount % 5 === 0) {
          this._trigger('rapid_direction');
        }
      }
      stats.lastDirection = dirKey;
    }

    // Track missed food (food was nearby but snake didn't get it)
    if (game.food && game.snake) {
      const head = game.snake.head;
      const dx = Math.abs(head.x - game.food.x);
      const dy = Math.abs(head.y - game.food.y);

      // If snake passed within 2 blocks of food without eating it
      if (dx <= 40 && dy <= 40 && prevFood) {
        const prevDx = Math.abs(prevHead ? prevHead.x - prevFood.x : 999);
        const prevDy = Math.abs(prevHead ? prevHead.y - prevFood.y : 999);
        // Snake was close and moved away
        if ((dx + dy) < 80 && (dx + dy) > 0 && (prevDx + prevDy) <= (dx + dy)) {
          stats.missedFoodCount++;
          if (stats.missedFoodCount > 1 && stats.missedFoodCount % 2 === 0) {
            this._trigger('missed_food');
          }
        }
      }
    }

    // Survival tracking
    stats.score = game.score;
    if (game.score > 75 && !stats.longSurvival) {
      stats.longSurvival = true;
      this._trigger('long_survival');
    }
  };

  /**
   * Trigger a commentary event with rate limiting.
   */
  CommentaryEngine.prototype._trigger = function (tag) {
    if (!this.enabled) return;

    const now = performance.now();
    if (now - this.lastTriggerTime < this.cooldownMs) return;

    // Use the seeded RNG for determinism
    const roast = getSnakeRoast([tag], this.rng);
    if (!roast) return;

    // Avoid repeating the same fact
    if (this.seenIds.has(roast.id)) return;
    this.seenIds.add(roast.id);

    this._showCommentary(roast.fact + ' ' + roast.roast);
    this.lastTriggerTime = now;
  };

  /**
   * Display a commentary message in the UI.
   */
  CommentaryEngine.prototype._showCommentary = function (text) {
    // Live commentary disabled
    if (this.commentaryEl) {
      this.commentaryEl.textContent = text;
    }
  };

  /**
   * Show a game-over roast using snake facts.
   * Falls back to legacy insult messages.
   */
  CommentaryEngine.prototype.showGameOverRoast = function (gameState) {
    if (!this.enabled) {
      // Legacy fallback
      return getLegacyInsult(gameState.score);
    }

    // Build game state for roast
    const context = {
      score: gameState.score,
      wallCollision: this.stats.wallCollisions > 0,
      selfCollision: gameState.selfCollision || false,
      obstacleCollision: this.stats.obstacleCollisions > 0,
      earlyDeath: gameState.score < 10,
      longSurvival: gameState.score >= 75,
      rapidDirectionChanges: this.stats.directionChangeCount > 10,
      powerUpCollected: this.stats.powerUpCollected,
      powerUpMissed: this.stats.powerUpMissed,
      missedFoodCount: this.stats.missedFoodCount,
    };

    const roast = getGameOverRoast(context, this.rng);

    // Show in commentary box
    this._showCommentary(roast);

    return roast;
  };

  /**
   * Show an idle reminder.
   */
  CommentaryEngine.prototype.showIdleHint = function () {
    // Live commentary disabled
  };

  /**
   * Reset stats for a new game.
   */
  CommentaryEngine.prototype._resetStats = function () {
    this.stats = {
      wallCollisions: 0,
      selfCollisions: 0,
      obstacleCollisions: 0,
      earlyDeath: false,
      longSurvival: false,
      rapidDirectionChanges: 0,
      lastDirection: null,
      directionChangeCount: 0,
      powerUpCollected: false,
      powerUpMissed: false,
      missedFoodCount: 0,
      foodProximityEvents: [],
      foodCount: 0,
      score: 0,
      maxScore: 0,
      startTime: performance.now(),
      deathTick: 0,
      idleStart: 0,
    };
    this.seenIds.clear();
  };

  CommentaryEngine.prototype._createRNG = function (seed) {
    let s = seed | 0;
    return function () {
      s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  CommentaryEngine.prototype.destroy = function () {
    this.enabled = false;
    if (this.fadeTimer) {
      clearTimeout(this.fadeTimer);
    }
    if (this.commentaryEl && this.commentaryEl.parentNode) {
      this.commentaryEl.parentNode.removeChild(this.commentaryEl);
    }
  };

  // Export
  window.CommentaryEngine = CommentaryEngine;
})();
