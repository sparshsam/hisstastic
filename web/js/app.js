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

  // ---- Scores and leaderboard ----

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

  function formatDate(value) {
    if (!value) return '';
    try { return new Date(value).toLocaleDateString(); }
    catch { return ''; }
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async function renderHighScores() {
    const list = document.getElementById('scores-list');
    const empty = document.getElementById('scores-empty');
    if (!list || !empty) return;

    const identity = PlayerIdentity.getIdentity();
    const personalBest = PlayerIdentity.getPersonalBest();

    const toggleHtml = '<div style="margin-bottom:10px;text-align:center;">' +
      '<button id="btn-scores-local" class="ctrl-btn" style="' + (_scoresSource === 'local' ? 'background:#4CAF50;color:#fff;' : '') + '">Local History</button> ' +
      '<button id="btn-scores-cloud" class="ctrl-btn" style="' + (_scoresSource === 'cloud' ? 'background:#4CAF50;color:#fff;' : '') + '">Global</button>' +
    '</div>';

    if (_scoresSource === 'local') {
      const scores = PlayerIdentity.getHistory();
      if (scores.length === 0) {
        list.innerHTML = toggleHtml +
          '<div class="scores-summary">' + escapeHtml(identity.username) + ' · Personal best ' + personalBest + '</div>';
        empty.style.display = 'block';
        _wireScoreToggles();
        return;
      }
      empty.style.display = 'none';
      list.innerHTML = toggleHtml +
        '<div class="scores-summary">' + escapeHtml(identity.username) + ' · Personal best ' + personalBest + '</div>' +
        scores.slice(0, 20).map((s, i) =>
        '<div class="score-entry">' +
          '<span class="score-rank">#' + (i + 1) + '</span>' +
          '<span class="score-val">' + s.score + '</span>' +
          '<span class="score-meta">' + s.difficulty + ' · ' + formatDate(s.created_at) + '</span>' +
        '</div>'
      ).join('');
    } else {
      list.innerHTML = toggleHtml + '<div style="text-align:center;padding:10px;font-size:12px;color:#999;">Loading global leaderboard...</div>';
      empty.style.display = 'none';
      const cloudScores = await SupabaseClient.getTopScores(10);
      const rank = await SupabaseClient.getPlayerRank(identity.player_id, 100);
      const rankHtml = rank
        ? '<div class="scores-summary">Your rank: #' + rank.rank + ' · Best ' + rank.row.best_score + '</div>'
        : '<div class="scores-summary">Exact personal rank is hidden to keep anonymous player IDs out of public leaderboard reads.</div>';
      if (cloudScores.length === 0) {
        list.innerHTML = toggleHtml + rankHtml + '<div style="text-align:center;padding:20px;font-size:13px;color:#999;">No global scores yet. Set a personal best!</div>';
      } else {
        list.innerHTML = toggleHtml + rankHtml + cloudScores.map((s, i) =>
          '<div class="score-entry">' +
            '<span class="score-rank">#' + (i + 1) + '</span>' +
            '<span class="score-name">' + escapeHtml(s.username) + '</span>' +
            '<span class="score-val">' + s.best_score + '</span>' +
            '<span class="score-meta">' + formatDate(s.updated_at) + '</span>' +
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

  async function handleGameOver(e) {
    const score = e.score || game.score;
    document.getElementById('go-score-value').textContent = score;
    const saveBtn = document.getElementById('btn-save-score');
    if (saveBtn) {
      saveBtn.textContent = 'Saved locally';
      saveBtn.disabled = true;
    }

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

    const wasPersonalBest = score > PlayerIdentity.getPersonalBest();

    // High score check
    const hsEl = document.getElementById('go-highscore');
    const syncEl = document.getElementById('go-sync-status');
    if (game.replayMode) {
      hsEl.style.display = 'none';
      syncEl.textContent = 'Replay finished — no score history or leaderboard update';
      showOverlay('overlay-gameover');
      return;
    }

    if (wasPersonalBest) {
      hsEl.style.display = 'block';
      syncEl.textContent = navigator.onLine ? 'Saving personal best...' : 'Saved locally — will sync when online';
    } else {
      hsEl.style.display = 'none';
      syncEl.textContent = 'Saved to local score history';
    }

    // Game-over stats line
    const stats = game.stats;
    const statsEl = document.getElementById('go-stats');
    if (statsEl && stats.gamesPlayed > 0) {
      statsEl.textContent = 'Game #' + stats.gamesPlayed + ' · Personal best ' + PlayerIdentity.getPersonalBest() + ' · Avg ' + Math.round(stats.totalScore / stats.gamesPlayed) + '/game';
    }

    showOverlay('overlay-gameover');

    const result = await PlayerIdentity.recordGameOver(game, { score });
    if (result.isPersonalBest) {
      if (result.sync && result.sync.ok) {
        syncEl.textContent = 'Synced to global leaderboard';
      } else if (result.sync && result.sync.offline) {
        syncEl.textContent = 'Saved locally — will sync when online';
      } else {
        syncEl.textContent = 'Saved locally — leaderboard sync pending';
      }
      if (statsEl && stats.gamesPlayed > 0) {
        statsEl.textContent = 'Game #' + stats.gamesPlayed + ' · Personal best ' + PlayerIdentity.getPersonalBest() + ' · Avg ' + Math.round(stats.totalScore / stats.gamesPlayed) + '/game';
      }
    }
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

  function setProfileError(id, message) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = message || '';
    el.style.display = message ? 'block' : 'none';
  }

  function fillProfileFields() {
    const identity = PlayerIdentity.getIdentity();
    const setupInput = document.getElementById('profile-username');
    const settingsInput = document.getElementById('settings-username');
    if (setupInput) setupInput.value = identity.username;
    if (settingsInput) settingsInput.value = identity.username;
  }

  function saveProfileFromInput(inputId, errorId) {
    const input = document.getElementById(inputId);
    const value = input ? input.value : '';
    const result = PlayerIdentity.saveUsername(value);
    if (!result.ok) {
      setProfileError(errorId, result.error);
      return false;
    }
    setProfileError(errorId, '');
    fillProfileFields();
    if (PlayerIdentity.getPersonalBest() > 0) {
      PlayerIdentity.syncBestScore(PlayerIdentity.getPersonalBest()).then(() => PlayerIdentity.syncPendingBest());
    }
    return true;
  }

  function randomizeProfileInput(inputId, errorId) {
    const input = document.getElementById(inputId);
    if (input) input.value = PlayerIdentity.generateUsername();
    setProfileError(errorId, '');
  }

  function showProfileSetupIfNeeded() {
    const identity = PlayerIdentity.getIdentity();
    const input = document.getElementById('profile-username');
    if (input) input.value = identity.username;
    if (!PlayerIdentity.isProfileReady()) {
      showOverlay('modal-profile-setup');
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
      fillProfileFields();
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
    document.getElementById('btn-home-from-go').addEventListener('click', goHome);

    // ---- PAUSE OVERLAY ----

    document.getElementById('btn-resume').addEventListener('click', handleResume);
    document.getElementById('btn-home-from-pause').addEventListener('click', goHome);

    // ---- SETTINGS MODAL ----

    document.getElementById('btn-close-settings').addEventListener('click', () => {
      hideOverlay('modal-settings');
    });

    document.getElementById('btn-profile-randomize').addEventListener('click', () => {
      randomizeProfileInput('profile-username', 'profile-setup-error');
    });

    document.getElementById('btn-profile-save').addEventListener('click', () => {
      const ok = saveProfileFromInput('profile-username', 'profile-setup-error');
      if (ok) hideOverlay('modal-profile-setup');
    });

    document.getElementById('settings-randomize-name').addEventListener('click', () => {
      randomizeProfileInput('settings-username', 'settings-profile-error');
    });

    document.getElementById('settings-save-profile').addEventListener('click', () => {
      const ok = saveProfileFromInput('settings-username', 'settings-profile-error');
      if (ok) {
        const btn = document.getElementById('settings-save-profile');
        btn.textContent = 'Saved';
        setTimeout(() => { btn.textContent = 'Save'; }, 1200);
      }
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

    fillProfileFields();
    window.addEventListener('online', () => {
      PlayerIdentity.syncPendingBest();
    });
    PlayerIdentity.syncPendingBest();

    // Show home page, no main loop yet
    showPage('home');
    showProfileSetupIfNeeded();
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
