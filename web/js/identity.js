/**
 * Local player identity, username validation, score history, and leaderboard sync.
 * Stores score history locally; Supabase only receives player profile and best score.
 */

(function() {
  'use strict';

  const IDENTITY_KEY = 'hissTasticPlayerIdentity';
  const PROFILE_DONE_KEY = 'hissTasticProfileReady';
  const HISTORY_KEY = 'hissTasticScoreHistory';
  const PERSONAL_BEST_KEY = 'hissTasticPersonalBest';
  const PENDING_SYNC_KEY = 'hissTasticPendingLeaderboardSync';
  const MAX_HISTORY = 100;
  const MAX_LEADERBOARD_SCORE = 150000000;

  const adjectives = [
    'Brewing', 'Cogitating', 'Curious', 'Dillydallying', 'Fizzy',
    'Moonlit', 'Snickering', 'Velvet', 'Wandering', 'Wiggly',
    'Brisk', 'Clever', 'Dapper', 'Giggly', 'Luminous',
    'Merry', 'Nimble', 'Peppery', 'Quirky', 'Zesty',
  ];

  const nouns = [
    'Basilisk', 'Cauldron', 'Cobra', 'Gecko', 'Mongoose',
    'Noodle', 'Oracle', 'Saffron', 'Serpent', 'Viper',
    'Comet', 'Fern', 'Lantern', 'Marble', 'Pickle',
    'Riddle', 'Sorbet', 'Teacup', 'Wand', 'Zephyr',
  ];

  const profanity = [
    'ass', 'bastard', 'bitch', 'bollocks', 'crap', 'cunt',
    'damn', 'dick', 'fuck', 'motherfucker', 'piss', 'prick',
    'shit', 'slut', 'twat', 'whore',
  ];

  function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function normalizeUsername(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function createUuid() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
      const value = Math.random() * 16 | 0;
      const next = char === 'x' ? value : (value & 0x3 | 0x8);
      return next.toString(16);
    });
  }

  function readJson(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function normalizeScore(value) {
    const score = Number(value || 0);
    if (!Number.isFinite(score)) return 0;
    return Math.max(0, Math.floor(score));
  }

  const PlayerIdentity = {
    generateUsername() {
      for (let i = 0; i < 20; i++) {
        const candidate = `${randomItem(adjectives)} ${randomItem(nouns)}`;
        if (candidate.length <= 24) return candidate;
      }
      return 'Curious Cobra';
    },

    validateUsername(value) {
      const username = normalizeUsername(value);
      if (!username) return { ok: false, username, error: 'Choose a username.' };
      if (username.length < 3 || username.length > 24) {
        return { ok: false, username, error: 'Use 3-24 characters.' };
      }
      if (!/^[A-Za-z0-9 _-]+$/.test(username)) {
        return { ok: false, username, error: 'Use letters, numbers, spaces, hyphens, or underscores.' };
      }
      const words = username.toLowerCase().split(/[\s_-]+/);
      if (profanity.some((word) => words.includes(word))) {
        return { ok: false, username, error: 'Choose a different username.' };
      }
      return { ok: true, username };
    },

    getIdentity() {
      const existing = readJson(IDENTITY_KEY, null);
      if (existing && existing.player_id && existing.username) return existing;

      const now = new Date().toISOString();
      const identity = {
        player_id: createUuid(),
        username: this.generateUsername(),
        created_at: now,
        updated_at: now,
      };
      writeJson(IDENTITY_KEY, identity);
      return identity;
    },

    isProfileReady() {
      return localStorage.getItem(PROFILE_DONE_KEY) === 'true';
    },

    saveUsername(value) {
      const validation = this.validateUsername(normalizeUsername(value) || this.generateUsername());
      if (!validation.ok) return validation;

      const identity = this.getIdentity();
      identity.username = validation.username;
      identity.updated_at = new Date().toISOString();
      writeJson(IDENTITY_KEY, identity);
      localStorage.setItem(PROFILE_DONE_KEY, 'true');
      return { ok: true, identity };
    },

    getPersonalBest() {
      return Number(localStorage.getItem(PERSONAL_BEST_KEY) || '0') || 0;
    },

    setPersonalBest(score) {
      localStorage.setItem(PERSONAL_BEST_KEY, String(normalizeScore(score)));
    },

    getHistory() {
      return readJson(HISTORY_KEY, []);
    },

    saveLocalScore(game, data) {
      const now = new Date().toISOString();
      const durationSeconds = game && game.sessionStartedAt
        ? Math.max(0, Math.round((performance.now() - game.sessionStartedAt) / 1000))
        : null;
      const entry = {
        id: createUuid(),
        player_id: this.getIdentity().player_id,
        score: normalizeScore(data.score),
        difficulty: game ? game.difficultyMode : 'normal',
        snake_length: game && game.snake ? game.snake.length : 1,
        powerups_collected: game ? (game.powerupsCollected || 0) : 0,
        duration_seconds: durationSeconds,
        created_at: now,
      };
      const history = this.getHistory();
      history.unshift(entry);
      writeJson(HISTORY_KEY, history.slice(0, MAX_HISTORY));
      return entry;
    },

    getPendingSync() {
      return readJson(PENDING_SYNC_KEY, null);
    },

    setPendingSync(score) {
      const identity = this.getIdentity();
      writeJson(PENDING_SYNC_KEY, {
        player_id: identity.player_id,
        username: identity.username,
        best_score: normalizeScore(score),
        updated_at: new Date().toISOString(),
      });
    },

    clearPendingSync() {
      localStorage.removeItem(PENDING_SYNC_KEY);
    },

    async syncProfile() {
      const identity = this.getIdentity();
      if (!window.SupabaseClient || !navigator.onLine) {
        return { ok: false, offline: !navigator.onLine };
      }
      return SupabaseClient.upsertPlayer(identity);
    },

    async syncBestScore(score) {
      const identity = this.getIdentity();
      const bestScore = normalizeScore(score);
      if (bestScore > MAX_LEADERBOARD_SCORE) {
        return { ok: false, skipped: true, error: 'Score exceeds leaderboard limit.' };
      }
      if (!window.SupabaseClient || !navigator.onLine) {
        this.setPendingSync(bestScore);
        return { ok: false, offline: true };
      }

      const player = await SupabaseClient.upsertPlayer(identity);
      if (!player.ok) {
        this.setPendingSync(bestScore);
        return player;
      }

      const result = await SupabaseClient.upsertLeaderboardScore({
        player_id: identity.player_id,
        username: identity.username,
        best_score: bestScore,
      });
      if (!result.ok) this.setPendingSync(bestScore);
      else this.clearPendingSync();
      return result;
    },

    async syncPendingBest() {
      const pending = this.getPendingSync();
      if (!pending || !navigator.onLine) return { ok: false, skipped: true };
      return this.syncBestScore(pending.best_score);
    },

    async recordGameOver(game, data) {
      const score = normalizeScore(data.score);
      const previousBest = this.getPersonalBest();
      const localEntry = this.saveLocalScore(game, data);
      const isPersonalBest = score > previousBest;

      if (!isPersonalBest) {
        return {
          localEntry,
          isPersonalBest: false,
          personalBest: previousBest,
          sync: { ok: false, skipped: true },
        };
      }

      this.setPersonalBest(score);
      const sync = await this.syncBestScore(score);
      return {
        localEntry,
        isPersonalBest: true,
        personalBest: score,
        sync,
      };
    },
  };

  window.PlayerIdentity = PlayerIdentity;
})();
