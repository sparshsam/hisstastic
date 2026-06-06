/**
 * Hiss-Tastic Browser App — main entry point.
 * Initializes game engine, renderer, input, audio, and replay manager.
 * Runs the main loop via requestAnimationFrame with fixed-tick timing.
 */

(function() {
  'use strict';

  let game, renderer, input, audio, replay, commentary, snakeField;
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

    // Initialize snake field background
    snakeField = new SnakeField();
    snakeField.init();

    // Initialize live commentary
    commentary = new CommentaryEngine();
    commentary.init(game);
    window.commentary = commentary;

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

    // Music toggle button
    const musicBtn = document.getElementById('btn-music');
    if (musicBtn) {
      // Check if background music file is available after a short delay
      // (the Audio element fires 'canplaythrough' or 'error' asynchronously)
      setTimeout(() => {
        if (!audio.bgMusicReady) {
          // Audio file didn't load; disable the button
          musicBtn.disabled = true;
          musicBtn.textContent = '\uD83D\uDD07 Music';
          musicBtn.title = 'Background music file not available';
          musicBtn.classList.remove('music-on');
          return;
        }
      }, 3000);

      musicBtn.addEventListener('click', () => {
        const on = audio.toggleBgMusic();
        musicBtn.textContent = on ? '\uD83C\uDFB5 Music' : '\uD83D\uDD07 Music';
        musicBtn.classList.toggle('music-on', on);
      });
      // Reflect initial state
      if (audio.bgMusicEnabled) {
        musicBtn.classList.add('music-on');
      }
    }

    // Resume background music on first user interaction (autoplay policy)
    const resumeMusic = () => {
      audio.resumeBgMusic();
      document.removeEventListener('pointerdown', resumeMusic);
      document.removeEventListener('keydown', resumeMusic);
    };
    document.addEventListener('pointerdown', resumeMusic);
    document.addEventListener('keydown', resumeMusic);

    // Start main loop
    lastTick = performance.now();
    mainLoop(lastTick);
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      return;
    }
    // Skip service worker registration on plain HTTP localhost
    // to avoid developer confusion with stale caches during dev.
    // Service worker still registers on HTTPS or secure contexts.
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
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
