/**
 * Input handler for HissTastic browser game.
 * Supports keyboard, touch/swipe (anywhere on screen), and directional overlay.
 *
 * v2 — Swipe works anywhere on the page, D-pad uses touchstart for instant
 * response on mobile, and D-pad touches don't trigger swipe detection.
 */

class InputHandler {
  constructor(game) {
    this.game = game;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.swipeThreshold = 30;
    this._touchingDpad = false; // true while a dpad touch is in progress

    // Directional overlay buttons
    this.upBtn = document.getElementById('btn-up');
    this.downBtn = document.getElementById('btn-down');
    this.leftBtn = document.getElementById('btn-left');
    this.rightBtn = document.getElementById('btn-right');

    this._bindEvents();
  }

  _bindEvents() {
    // Keyboard — always on document
    document.addEventListener('keydown', (e) => this._onKey(e));

    // Touch/swipe on the ENTIRE document, not just the canvas.
    // This way swiping anywhere on the phone screen works.
    document.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: true });
    document.addEventListener('touchend', (e) => this._onTouchEnd(e), { passive: true });

    // Click on the canvas for desktop click-to-start/tap
    const canvas = this.game.canvas;
    if (canvas) {
      canvas.addEventListener('click', (e) => this._onClick(e));
    }

    // ---- D-pad: use touchstart (not click) for instant response on mobile ----
    const setDir = (dx, dy) => {
      const g = this.game;
      if (g.state === 'PLAYING') {
        g.snake.setDirection(dx * CONFIG.grid.blockSize, dy * CONFIG.grid.blockSize);
        g.pushReplayInput([dx, dy]);
      }
    };

    if (this.upBtn) {
      this.upBtn.addEventListener('touchstart', (e) => {
        this._touchingDpad = true;
        setDir(0, -1);
        e.preventDefault();
      }, { passive: false });
      this.upBtn.addEventListener('click', (e) => { setDir(0, -1); e.preventDefault(); });
      this.upBtn.addEventListener('mousedown', (e) => e.preventDefault());
    }
    if (this.downBtn) {
      this.downBtn.addEventListener('touchstart', (e) => {
        this._touchingDpad = true;
        setDir(0, 1);
        e.preventDefault();
      }, { passive: false });
      this.downBtn.addEventListener('click', (e) => { setDir(0, 1); e.preventDefault(); });
      this.downBtn.addEventListener('mousedown', (e) => e.preventDefault());
    }
    if (this.leftBtn) {
      this.leftBtn.addEventListener('touchstart', (e) => {
        this._touchingDpad = true;
        setDir(-1, 0);
        e.preventDefault();
      }, { passive: false });
      this.leftBtn.addEventListener('click', (e) => { setDir(-1, 0); e.preventDefault(); });
      this.leftBtn.addEventListener('mousedown', (e) => e.preventDefault());
    }
    if (this.rightBtn) {
      this.rightBtn.addEventListener('touchstart', (e) => {
        this._touchingDpad = true;
        setDir(1, 0);
        e.preventDefault();
      }, { passive: false });
      this.rightBtn.addEventListener('click', (e) => { setDir(1, 0); e.preventDefault(); });
      this.rightBtn.addEventListener('mousedown', (e) => e.preventDefault());
    }

    // Clear the D-pad touch flag when the touch ends (anywhere)
    document.addEventListener('touchend', () => {
      this._touchingDpad = false;
    }, { passive: true });
    document.addEventListener('touchcancel', () => {
      this._touchingDpad = false;
    }, { passive: true });
  }

  _onKey(e) {
    const g = this.game;

    switch (e.key) {
      case 'ArrowLeft':
        if (g.state === 'PLAYING') {
          g.snake.setDirection(-CONFIG.grid.blockSize, 0);
          g.pushReplayInput([-1, 0]);
        }
        e.preventDefault();
        break;
      case 'ArrowRight':
        if (g.state === 'PLAYING') {
          g.snake.setDirection(CONFIG.grid.blockSize, 0);
          g.pushReplayInput([1, 0]);
        }
        e.preventDefault();
        break;
      case 'ArrowUp':
        if (g.state === 'PLAYING') {
          g.snake.setDirection(0, -CONFIG.grid.blockSize);
          g.pushReplayInput([0, -1]);
        }
        e.preventDefault();
        break;
      case 'ArrowDown':
        if (g.state === 'PLAYING') {
          g.snake.setDirection(0, CONFIG.grid.blockSize);
          g.pushReplayInput([0, 1]);
        }
        e.preventDefault();
        break;
      case ' ':
      case 'Space':
        e.preventDefault();
        if (g.state === 'TITLE') {
          g.startGame();
        } else if (g.state === 'GAME_OVER') {
          g.startGame();
        }
        break;
      case 'p':
      case 'P':
      case 'Escape':
        if (g.state === 'PLAYING') g.state = 'PAUSED';
        else if (g.state === 'PAUSED') g.state = 'PLAYING';
        break;
      case 'r':
      case 'R':
        if (g.state === 'GAME_OVER') {
          g.startGame();
        }
        break;
      case 'q':
      case 'Q':
        if (g.state === 'GAME_OVER' || g.state === 'PAUSED') {
          g.state = 'TITLE';
        }
        break;
      case 'm':
      case 'M':
        g.muted = !g.muted;
        break;
      case '1':
        if (g.state === 'TITLE') {
          g.difficultyMode = 'easy';
          g.emit('difficulty', 'easy');
        }
        break;
      case '2':
        if (g.state === 'TITLE') {
          g.difficultyMode = 'normal';
          g.emit('difficulty', 'normal');
        }
        break;
      case '3':
        if (g.state === 'TITLE') {
          g.difficultyMode = 'hard';
          g.emit('difficulty', 'hard');
        }
        break;
    }
  }

  _onTouchStart(e) {
    // Don't track swipe start if touching a D-pad button
    const target = e.target;
    if (target && target.classList && target.classList.contains('dpad-btn')) {
      return;
    }

    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
  }

  _onTouchEnd(e) {
    const g = this.game;

    // Tap to start/restart on title/game-over screens
    if (g.state === 'TITLE' || g.state === 'GAME_OVER') {
      if (g.state === 'TITLE') g.startGame();
      else if (g.state === 'GAME_OVER') g.startGame();
      return;
    }

    if (g.state !== 'PLAYING') return;

    // If we were touching a D-pad button, don't interpret as swipe
    if (this._touchingDpad) {
      return;
    }

    const touch = e.changedTouches[0];
    const dx = touch.clientX - this.touchStartX;
    const dy = touch.clientY - this.touchStartY;

    // Swipe detection — only if the finger moved enough
    if (Math.abs(dx) > this.swipeThreshold || Math.abs(dy) > this.swipeThreshold) {
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe
        if (dx > 0) {
          g.snake.setDirection(CONFIG.grid.blockSize, 0);
          g.pushReplayInput([1, 0]);
        } else {
          g.snake.setDirection(-CONFIG.grid.blockSize, 0);
          g.pushReplayInput([-1, 0]);
        }
      } else {
        // Vertical swipe
        if (dy > 0) {
          g.snake.setDirection(0, CONFIG.grid.blockSize);
          g.pushReplayInput([0, 1]);
        } else {
          g.snake.setDirection(0, -CONFIG.grid.blockSize);
          g.pushReplayInput([0, -1]);
        }
      }
    }
  }

  _onClick(e) {
    const g = this.game;
    if (g.state === 'TITLE') {
      g.startGame();
    } else if (g.state === 'GAME_OVER') {
      g.startGame();
    }
  }
}

window.InputHandler = InputHandler;
