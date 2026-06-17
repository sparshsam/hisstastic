/**
 * Hiss-Tastic Browser App — main entry point.
 * v0.5.2 — Page navigation with Home, Game, Settings, and overlay screens.
 *
 * Initializes all subsystems and manages page transitions.
 */

(function() {
  'use strict';

  /**
   * Trigger haptic vibration if the device supports it.
   * Accepts a single number (duration in ms) or an array pattern.
   */
  function vibrate(pattern) {
    if (navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch (_) {}
    }
  }

  let game, renderer, input, audio, replay, commentary, snakeField;
  let lastTick = 0;
  let tickAccumulator = 0;
  let tickRate = 1000 / CONFIG.gameplay.initialSpeed;
  let animFrame = null;
  let _running = false;

  // ---- Debug FPS counter ----
  let frameCount = 0;
  let fpsTimer = 0;

  // ---- Page navigation ----

  function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const el = document.getElementById('page-' + pageId);
    if (el) el.classList.add('active');

    if (pageId === 'game') {
      startMainLoop();
    } else {
      stopMainLoop();
    }
  }

  function showOverlay(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex';
  }

  function hideOverlay(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  }

  function hideAllOverlays() {
    document.querySelectorAll('.overlay, .modal').forEach(el => {
      el.style.display = 'none';
    });
  }

  // ---- Main loop ----

  function startMainLoop() {
    if (_running) return;
    _running = true;
    lastTick = performance.now();
    mainLoop(lastTick);
  }

  function stopMainLoop() {
    _running = false;
    if (animFrame) {
      cancelAnimationFrame(animFrame);
      animFrame = null;
    }
  }

  function mainLoop(timestamp) {
    if (!_running) return;
    const dt = timestamp - lastTick;
    lastTick = timestamp;

    // Debug FPS counter (logged every second; uncomment console to enable)
    frameCount++;
    fpsTimer += dt;
    if (fpsTimer >= 1000) {
      // console.log(`FPS: ${frameCount}`);
      frameCount = 0;
      fpsTimer = 0;
    }

    if (game.state === 'PLAYING') {
      tickAccumulator += dt;
      tickRate = 1000 / game.effectiveSpeed;
      while (tickAccumulator >= tickRate) {
        game.tick(tickRate);
        tickAccumulator -= tickRate;
      }
    } else {
      tickAccumulator = 0;
    }

    renderer.render();
    animFrame = requestAnimationFrame(mainLoop);
  }

  // ---- High scores (localStorage) ----

  const HS_KEY = 'hissTasticHighScores';
  const MAX_HS = 10;

  function getHighScores() {
    try { return JSON.parse(localStorage.getItem(HS_KEY)) || []; }
    catch { return []; }
  }

  function saveHighScore(score, difficulty) {
    const scores = getHighScores();
    scores.push({ score, difficulty, date: new Date().toISOString() });
    scores.sort((a, b) => b.score - a.score);
    const updated = scores.slice(0, MAX_HS);
    localStorage.setItem(HS_KEY, JSON.stringify(updated));
    return updated;
  }

  function isHighScore(score) {
    const scores = getHighScores();
    if (scores.length < MAX_HS) return true;
    return score > scores[scores.length - 1].score;
  }

  // ---- Stats persistence ----

  function saveStats() {
    try { localStorage.setItem('hissTasticStats', JSON.stringify(game.stats)); } catch (_) {}
  }

  function loadStats() {
    try {
      const saved = JSON.parse(localStorage.getItem('hissTasticStats'));
      if (saved) Object.assign(game.stats, saved);
    } catch (_) {}
  }

  let _scoresSource = 'local';

  async function renderHighScores() {
    const list = document.getElementById('scores-list');
    const empty = document.getElementById('scores-empty');
    if (!list || !empty) return;

    // Toggle button
    const toggleHtml = '<div style="margin-bottom:10px;text-align:center;">' +
      '<button id="btn-scores-local" class="ctrl-btn" style="' + (_scoresSource === 'local' ? 'background:#4CAF50;color:#fff;' : '') + '">📱 Local</button> ' +
      '<button id="btn-scores-cloud" class="ctrl-btn" style="' + (_scoresSource === 'cloud' ? 'background:#4CAF50;color:#fff;' : '') + '">☁️ Cloud</button>' +
    '</div>';

    if (_scoresSource === 'local') {
      const scores = getHighScores();
      if (scores.length === 0) {
        list.innerHTML = toggleHtml;
        empty.style.display = 'block';
        _wireScoreToggles();
        return;
      }
      empty.style.display = 'none';
      list.innerHTML = toggleHtml + scores.map((s, i) =>
        '<div class="score-entry">' +
          '<span class="score-rank">#' + (i + 1) + '</span>' +
          '<span class="score-val">' + s.score + '</span>' +
          '<span class="score-meta">' + s.difficulty + '</span>' +
        '</div>'
      ).join('');

      // Stats below scores
      const stats = game.stats;
      if (stats.gamesPlayed > 0) {
        list.insertAdjacentHTML('afterend',
          '<div style="margin-top:12px;padding-top:8px;border-top:1px solid #eee;font-size:11px;color:#999;text-align:center;">' +
          stats.gamesPlayed + ' games · ' + stats.totalFood + ' food eaten · Avg ' + Math.round(stats.totalScore / stats.gamesPlayed) + '/game' +
          '</div>'
        );
      }
    } else {
      // Cloud scores
      list.innerHTML = toggleHtml + '<div style="text-align:center;padding:10px;font-size:12px;color:#999;">Loading cloud scores...</div>';
      empty.style.display = 'none';
      const cloudScores = await SupabaseClient.getTopScores(10);
      if (cloudScores.length === 0) {
        list.innerHTML = toggleHtml + '<div style="text-align:center;padding:20px;font-size:13px;color:#999;">No cloud scores yet. Play and save!</div>';
      } else {
        list.innerHTML = toggleHtml + cloudScores.map((s, i) =>
          '<div class="score-entry">' +
            '<span class="score-rank">#' + (i + 1) + '</span>' +
            '<span class="score-val">' + s.score + '</span>' +
            '<span class="score-meta">' + s.difficulty + '</span>' +
          '</div>'
        ).join('');
      }
    }
    _wireScoreToggles();
  }

  function _wireScoreToggles() {
    const localBtn = document.getElementById('btn-scores-local');
    const cloudBtn = document.getElementById('btn-scores-cloud');
    if (localBtn) localBtn.onclick = () => { _scoresSource = 'local'; renderHighScores(); };
    if (cloudBtn) cloudBtn.onclick = () => { _scoresSource = 'cloud'; renderHighScores(); };
  }

  // ---- Theme helpers ----

  function applyTheme(name) {
    game.setTheme(name);
    const theme = CONFIG.themes[name];
    if (theme) {
      const pageHome = document.getElementById('page-home');
      if (pageHome) pageHome.style.background = theme.bg;
      const canvas = document.getElementById('game-canvas');
      if (canvas) canvas.style.background = theme.bg;
    }
  }

  function loadTheme() {
    const saved = localStorage.getItem('hissTasticTheme') || 'classic';
    const select = document.getElementById('settings-theme');
    if (select) select.value = saved;
    applyTheme(saved);
  }

  // ---- Difficulty helpers ----

  function setDifficulty(mode, source) {
    game.difficultyMode = mode;
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.diff === mode);
    });
  }

  function syncDifficultyFromGame() {
    setDifficulty(game.difficultyMode, 'sync');
  }

  // ---- Game flow ----

  function startNewGame() {
    hideAllOverlays();
    game.startGame();
  }

  function goHome() {
    game.state = 'TITLE';
    hideAllOverlays();
    showPage('home');
  }

  function handleGameOver(e) {
    const score = e.score || game.score;
    document.getElementById('go-score-value').textContent = score;

    // Roast message via commentary engine
    const roastEl = document.getElementById('go-roast');
    if (roastEl) {
      if (window.commentary && window.commentary.enabled && window.commentary.showGameOverRoast) {
        roastEl.textContent = window.commentary.showGameOverRoast({
          score: score,
          selfCollision: game._lastCollisionType === 'self',
        });
      } else {
        roastEl.textContent = game.getMeanMessage();
      }
    }

    // High score check
    const hsEl = document.getElementById('go-highscore');
    if (isHighScore(score)) {
      hsEl.style.display = 'block';
    } else {
      hsEl.style.display = 'none';
    }

    // Game-over stats line
    const stats = game.stats;
    const statsEl = document.getElementById('go-stats');
    if (statsEl && stats.gamesPlayed > 0) {
      statsEl.textContent = 'Game #' + stats.gamesPlayed + ' · Avg ' + Math.round(stats.totalScore / stats.gamesPlayed) + '/game';
    }

    showOverlay('overlay-gameover');
  }

  function handlePause() {
    if (game.state === 'PLAYING') {
      game.state = 'PAUSED';
      showOverlay('overlay-pause');
    }
  }

  function handleResume() {
    if (game.state === 'PAUSED') {
      game.state = 'PLAYING';
      hideOverlay('overlay-pause');
    }
  }

  // ---- Initialization ----

  function init() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }

    game = new HissTastic();
    game.canvas = canvas;
    loadStats();

    renderer = new Renderer(canvas, game);
    input = new InputHandler(game);
    audio = new GameAudio();
    replay = new ReplayManager(game, renderer);

    // Snake field background
    snakeField = new SnakeField();
    snakeField.init();

    // Live commentary
    commentary = new CommentaryEngine();
    commentary.init(game);
    window.commentary = commentary;

    // Setup replay upload
    replay.setupUploadButton();

    // ---- Audio events ----
    game.on('direction', (data) => {
      if (data.type === 'eat') { audio.playEat(); vibrate(10); }
      if (data.type === 'powerup') { audio.playPowerUp(data.powerUpType); vibrate([15, 10, 15]); }
    });
    game.on('quit', (data) => {
      audio.playGameOver();
      vibrate([30, 20, 50]);
      saveStats();
      handleGameOver(data || {});
    });

    // Resume AudioContext on first user interaction
    const resumeAll = () => {
      audio.resumeAll();
      document.removeEventListener('pointerdown', resumeAll);
      document.removeEventListener('keydown', resumeAll);
    };
    document.addEventListener('pointerdown', resumeAll);
    document.addEventListener('keydown', resumeAll);

    // ---- HOME PAGE BUTTONS ----

    document.getElementById('btn-play').addEventListener('click', () => {
      showPage('game');
      startNewGame();
    });

    // Home page difficulty
    document.querySelectorAll('#page-home .diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setDifficulty(btn.dataset.diff, 'home');
      });
    });

    document.getElementById('btn-open-settings').addEventListener('click', () => {
      renderHighScores(); // pre-render for score display
      // Sync settings toggle states
      const musicBtn = document.getElementById('settings-music');
      if (musicBtn) {
        musicBtn.textContent = audio.bgMusicEnabled ? 'On' : 'Off';
        musicBtn.classList.toggle('on', audio.bgMusicEnabled);
      }
      showOverlay('modal-settings');
    });

    document.getElementById('btn-open-scores').addEventListener('click', () => {
      renderHighScores();
      showOverlay('overlay-scores');
    });

    // ---- GAME PAGE BUTTONS ----

    document.getElementById('btn-pause').addEventListener('click', handlePause);

    // Export replay button
    document.getElementById('btn-export-replay').addEventListener('click', () => {
      replay.exportCurrent();
    });

    // Music toggle button
    const musicBtn = document.getElementById('btn-music');
    if (musicBtn) {
      musicBtn.addEventListener('click', () => {
        const on = audio.toggleBgMusic();
        musicBtn.textContent = on ? '🎵 Music' : '🔇 Music';
        musicBtn.classList.toggle('music-on', on);
      });
      if (audio.bgMusicEnabled) {
        musicBtn.classList.add('music-on');
      }
    }

    // ---- GAME OVER OVERLAY ----

    document.getElementById('btn-retry').addEventListener('click', startNewGame);
    document.getElementById('btn-save-score').addEventListener('click', async () => {
      saveHighScore(game.score, game.difficultyMode);

      // Submit to Supabase cloud scores
      const btn = document.getElementById('btn-save-score');
      btn.textContent = '☁️ Saving...';
      btn.disabled = true;

      const result = await SupabaseClient.submitScore(
        game.score,
        game.difficultyMode,
        game.snake ? game.snake.length : 1,
        game.powerupsCollected || 0
      );
      btn.textContent = result.ok ? '✅ Saved to Cloud!' : '💾 Saved Locally';
    });
    document.getElementById('btn-home-from-go').addEventListener('click', goHome);

    // ---- PAUSE OVERLAY ----

    document.getElementById('btn-resume').addEventListener('click', handleResume);
    document.getElementById('btn-home-from-pause').addEventListener('click', goHome);

    // ---- SETTINGS MODAL ----

    document.getElementById('btn-close-settings').addEventListener('click', () => {
      hideOverlay('modal-settings');
    });

    // Settings difficulty
    document.querySelectorAll('#modal-settings .diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setDifficulty(btn.dataset.diff, 'settings');
      });
    });

    // Settings sound toggle
    const soundBtn = document.getElementById('settings-sound');
    soundBtn.addEventListener('click', () => {
      const on = soundBtn.classList.toggle('on');
      soundBtn.textContent = on ? 'On' : 'Off';
      game.muted = !on;
    });
    // Initial sync: game.muted starts false, so sound is on
    soundBtn.classList.add('on');
    soundBtn.textContent = 'On';

    // Settings music toggle
    const settingsMusicBtn = document.getElementById('settings-music');
    settingsMusicBtn.addEventListener('click', () => {
      const on = audio.toggleBgMusic();
      settingsMusicBtn.textContent = on ? 'On' : 'Off';
      settingsMusicBtn.classList.toggle('on', on);
      // Also sync the in-game music button
      const inGameMusicBtn = document.getElementById('btn-music');
      if (inGameMusicBtn) {
        inGameMusicBtn.textContent = on ? '🎵 Music' : '🔇 Music';
        inGameMusicBtn.classList.toggle('music-on', on);
      }
    });

    // Settings theme select
    const themeSelect = document.getElementById('settings-theme');
    themeSelect.addEventListener('change', () => {
      applyTheme(themeSelect.value);
    });

    // ---- SCORES OVERLAY ----

    document.getElementById('btn-close-scores').addEventListener('click', () => {
      hideOverlay('overlay-scores');
    });

    // ---- Window resize (orientation change) ----
    // resize() is called every render frame, no listener needed

    // ---- KEYBOARD SHORTCUTS (global) ----
    document.addEventListener('keydown', (e) => {
      // P key toggles pause during gameplay
      if ((e.key === 'p' || e.key === 'P' || e.key === 'Escape') && game.state === 'PLAYING') {
        handlePause();
        e.preventDefault();
      }
      if ((e.key === 'p' || e.key === 'P' || e.key === 'Escape') && game.state === 'PAUSED') {
        handleResume();
        e.preventDefault();
      }
      // Space to retry from game over overlay
      if ((e.key === ' ' || e.key === 'Space') && game.state === 'GAME_OVER') {
        startNewGame();
        e.preventDefault();
      }
      // R to retry from game over
      if ((e.key === 'r' || e.key === 'R') && game.state === 'GAME_OVER') {
        startNewGame();
        e.preventDefault();
      }
      // Q to go home from game over or pause
      if ((e.key === 'q' || e.key === 'Q') && (game.state === 'GAME_OVER' || game.state === 'PAUSED')) {
        goHome();
        e.preventDefault();
      }
    });

    // Initial difficulty sync
    syncDifficultyFromGame();

    // Load saved theme
    loadTheme();

    // Show home page, no main loop yet
    showPage('home');
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (window.location.protocol !== 'https:' &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1') {
      return;
    }
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((error) => {
        console.warn('Service worker registration failed:', error);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  registerServiceWorker();
})();
