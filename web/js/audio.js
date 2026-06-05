/**
 * Procedural audio for Hiss-Tastic browser game.
 * Uses Web Audio API to generate simple sound effects.
 * Silently disables if AudioContext is unavailable.
 */

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
}

window.GameAudio = GameAudio;
