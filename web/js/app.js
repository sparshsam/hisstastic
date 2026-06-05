/**
 * Hiss-Tastic Browser App — main entry point.
 * Initializes game engine, renderer, input, audio, and replay manager.
 * Runs the main loop via requestAnimationFrame with fixed-tick timing.
 */

(function() {
  'use strict';

  let game, renderer, input, audio, replay;
  let lastTick = 0;
  let tickAccumulator = 0;
  let tickRate = 1000 / CONFIG.gameplay.initialSpeed; // ms per tick
  let animFrame = null;

  function init() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }

    game = new HissTastic();
    game.canvas = canvas;

    renderer = new Renderer(canvas, game);
    input = new InputHandler(game);
    audio = new GameAudio();
    replay = new ReplayManager(game, renderer);

    // Setup replay upload
    replay.setupUploadButton();

    // Wire up audio events
    game.on('direction', (data) => {
      if (data.type === 'eat') audio.playEat();
      if (data.type === 'powerup') audio.playPowerUp();
    });
    game.on('quit', () => audio.playGameOver());

    // Export replay button
    const exportBtn = document.getElementById('btn-export-replay');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => replay.exportCurrent());
    }

    // Start main loop
    lastTick = performance.now();
    mainLoop(lastTick);
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      return;
    }
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((error) => {
        console.warn('Service worker registration failed:', error);
      });
    });
  }

  function mainLoop(timestamp) {
    const dt = timestamp - lastTick;
    lastTick = timestamp;

    if (game.state === 'PLAYING') {
      tickAccumulator += dt;

      // Determine current tick rate based on snake speed
      tickRate = 1000 / game.snakeSpeed;

      while (tickAccumulator >= tickRate) {
        game.tick(tickRate);
        tickAccumulator -= tickRate;
      }
    } else {
      tickAccumulator = 0;
    }

    // Render every frame
    renderer.render();

    animFrame = requestAnimationFrame(mainLoop);
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  registerServiceWorker();
})();
