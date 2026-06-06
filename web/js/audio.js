/**
 * Procedural audio for Hiss-Tastic browser game.
 * Uses Web Audio API to generate simple sound effects.
 * Also manages looping background music via HTMLAudioElement.
 * Silently disables if AudioContext is unavailable.
 * Gracefully handles missing audio files — game never crashes.
 */
(function() {
'use strict';

const LS_KEY = 'hissTasticBgMusic';

class BackgroundMusic {
  constructor() {
    this.audio = null;
    this._ready = false;       // true once audio file loaded successfully
    this._loadError = false;   // true if audio file failed to load
    this._enabled = this._loadPreference();
    this._init();
  }

  /** Load user preference from localStorage (default: false). */
  _loadPreference() {
    try {
      const val = localStorage.getItem(LS_KEY);
      return val === 'true';
    } catch (_) {
      return false;
    }
  }

  _savePreference() {
    try {
      localStorage.setItem(LS_KEY, this._enabled.toString());
    } catch (_) {
      // Silently fail (storage may be unavailable)
    }
  }

  _init() {
    try {
      this.audio = new Audio();
      this.audio.loop = true;
      this.audio.volume = 0.15;  // low default volume
      this.audio.preload = 'auto';

      // Detect load success / failure
      this.audio.addEventListener('canplaythrough', () => {
        this._ready = true;
      }, { once: true });
      this.audio.addEventListener('error', () => {
        this._loadError = true;
        this._ready = false;
        this._enabled = false;  // disable if file missing
      }, { once: true });

      // Set source last to trigger loading
      this.audio.src = 'assets/background-music.mp3';
    } catch (_) {
      // Audio not supported at all; disable gracefully
      this._loadError = true;
      this._ready = false;
      this._enabled = false;
      this.audio = null;
    }
  }

  /** Resume audio context / start playback. Called on first user interaction. */
  resume() {
    if (!this._enabled || !this.audio) return;
    if (!this._ready) return;   // not loaded yet — silently skip
    if (this.audio.paused) {
      this.audio.play().catch(() => {
        // Browser may still block; silently fail
      });
    }
  }

  /** @returns {boolean} whether background music is currently enabled. */
  get enabled() {
    return this._enabled;
  }

  /** @returns {boolean} whether the audio file loaded successfully. */
  get ready() {
    return this._ready;
  }

  /** Toggle background music on/off. Returns the new state. */
  toggle() {
    if (!this.audio || this._loadError) {
      // Audio file unavailable; toggle is a no-op
      this._enabled = false;
      this._savePreference();
      return false;
    }

    this._enabled = !this._enabled;
    this._savePreference();

    if (this._enabled) {
      if (this._ready && this.audio) {
        this.audio.volume = 0.15;
        this.audio.currentTime = 0;
        this.audio.play().catch(() => {});
      }
    } else {
      if (this.audio) {
        this.audio.pause();
        this.audio.currentTime = 0;
      }
    }
    return this._enabled;
  }

  /** Set volume (0.0 – 1.0). */
  setVolume(level) {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, level));
    }
  }
}

class GameAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;

    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        this.ctx = new AC();
      }
    } catch (e) {
      this.enabled = false;
    }

    // Background music instance
    this.bgMusic = new BackgroundMusic();
  }

  _playTone(frequency, duration, type) {
    if (!this.enabled || !this.ctx) return;
    if (this.muted) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Silently fail
    }
  }

  playEat() {
    this._playTone(440, 0.1, 'sine');
  }

  playPowerUp() {
    this._playTone(660, 0.2, 'sine');
    setTimeout(() => this._playTone(880, 0.15, 'sine'), 100);
  }

  playGameOver() {
    this._playTone(220, 0.5, 'sawtooth');
    this._resume();
  }

  _resume() {
    // Resume AudioContext if suspended (browser autoplay policy)
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /** Toggle background music. Returns new state. */
  toggleBgMusic() {
    return this.bgMusic.toggle();
  }

  /** @returns {boolean} whether background music is currently enabled. */
  get bgMusicEnabled() {
    return this.bgMusic.enabled;
  }

  /** @returns {boolean} whether background music file loaded successfully. */
  get bgMusicReady() {
    return this.bgMusic.ready;
  }

  /** Resume background music after user gesture. */
  resumeBgMusic() {
    this.bgMusic.resume();
  }
}

window.GameAudio = GameAudio;
window.BackgroundMusic = BackgroundMusic;
})();
