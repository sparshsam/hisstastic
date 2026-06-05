/**
 * Input handler for Hiss-Tastic browser game.
 * Supports keyboard, touch/swipe, and directional overlay.
 */

class InputHandler {
  constructor(game) {
    this.game = game;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.swipeThreshold = 30;

    // Directional overlay buttons
    this.upBtn = document.getElementById('btn-up');
    this.downBtn = document.getElementById('btn-down');
    this.leftBtn = document.getElementById('btn-left');
    this.rightBtn = document.getElementById('btn-right');

    this._bindEvents();
  }

  _bindEvents() {
    // Keyboard
    document.addEventListener('keydown', (e) => this._onKey(e));

    // Touch/swipe on canvas
    const canvas = this.game.canvas;
    if (canvas) {
      canvas.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: true });
      canvas.addEventListener('touchend', (e) => this._onTouchEnd(e), { passive: true });
      canvas.addEventListener('click', (e) => this._onClick(e));
    }

    // Directional buttons
    if (this.upBtn) this.upBtn.addEventListener('click', () => this._dir(0, -1));
    if (this.downBtn) this.downBtn.addEventListener('click', () => this._dir(0, 1));
    if (this.leftBtn) this.leftBtn.addEventListener('click', () => this._dir(-1, 0));
    if (this.rightBtn) this.rightBtn.addEventListener('click', () => this._dir(1, 0));

    // Touch on directional buttons (prevent default to avoid double-firing)
    [this.upBtn, this.downBtn, this.leftBtn, this.rightBtn].forEach(btn => {
      if (btn) {
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); }, { passive: false });
      }
    });
  }

  _dir(dx, dy) {
    const g = this.game;
    if (g.state === 'PLAYING') {
      g.snake.setDirection(dx * CONFIG.grid.blockSize, dy * CONFIG.grid.blockSize);
      g.pushReplayInput([dx, dy]);
    }
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
    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
  }

  _onTouchEnd(e) {
    const g = this.game;
    if (g.state === 'TITLE' || g.state === 'GAME_OVER') {
      // Tap to start/restart
      if (g.state === 'TITLE') g.startGame();
      else if (g.state === 'GAME_OVER') g.startGame();
      return;
    }

    if (g.state !== 'PLAYING') return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - this.touchStartX;
    const dy = touch.clientY - this.touchStartY;

    // Swipe detection
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
