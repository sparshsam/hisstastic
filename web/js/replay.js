/**
 * Replay import/export/display for HissTastic browser game.
 * Consumes existing replay JSON schema (v1.0.0).
 * No networking — all local file operations.
 */

class ReplayManager {
  constructor(game, renderer) {
    this.game = game;
    this.renderer = renderer;
    this.currentReplay = null;

    // Bind drag-and-drop on the document
    this._bindDragDrop();
  }

  // ---- Schema validation ----
  validateReplayData(data) {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Not a valid JSON object' };
    }
    const required = ['version', 'game', 'seed', 'score', 'inputs'];
    for (const field of required) {
      if (data[field] === undefined || data[field] === null) {
        return { valid: false, error: `Missing required field: ${field}` };
      }
    }
    if (data.game !== 'hisstastic') {
      return { valid: false, error: `Unknown game: ${data.game}` };
    }
    if (!Array.isArray(data.inputs)) {
      return { valid: false, error: 'inputs must be an array' };
    }
    for (const input of data.inputs) {
      if (typeof input.tick !== 'number' || !input.direction) {
        return { valid: false, error: 'Invalid input entry format' };
      }
      if (!['LEFT', 'RIGHT', 'UP', 'DOWN'].includes(input.direction)) {
        return { valid: false, error: `Unknown direction: ${input.direction}` };
      }
    }
    return { valid: true, error: null };
  }

  // ---- Import from File ----
  importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          const validation = this.validateReplayData(data);
          if (!validation.valid) {
            reject(new Error(validation.error));
            return;
          }
          this.currentReplay = data;
          this._showReplayInfo(data);
          resolve(data);
        } catch (err) {
          reject(new Error('Invalid JSON: ' + err.message));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  // ---- Display replay info on canvas ----
  _showReplayInfo(data) {
    this.game.state = 'REPLAY_INFO';
    this.renderer.drawReplayInfo({
      version: data.version,
      seed: data.seed,
      timestamp: data.timestamp,
      expected_score: data.score,
      snake_length: data.snake_length || 'N/A',
      input_count: data.inputs.length,
    });
    this._showInfoOverlay(data);
  }

  _showInfoOverlay(data) {
    const overlay = document.getElementById('replay-overlay');
    if (!overlay) return;
    overlay.innerHTML = `
      <h3>Replay Loaded</h3>
      <table>
        <tr><td>Seed</td><td>${data.seed}</td></tr>
        <tr><td>Score</td><td>${data.score}</td></tr>
        <tr><td>Snake Length</td><td>${data.snake_length || 'N/A'}</td></tr>
        <tr><td>Inputs</td><td>${data.inputs.length}</td></tr>
        <tr><td>Version</td><td>${data.version}</td></tr>
        <tr><td>Timestamp</td><td>${data.timestamp || 'N/A'}</td></tr>
      </table>
      <button id="replay-play-btn">Play Replay</button>
      <button id="replay-export-btn">Export Replay</button>
      <button id="replay-dismiss-btn">Back to Title</button>
    `;
    overlay.style.display = 'block';
    document.getElementById('replay-play-btn').onclick = () => this.playReplay(data);
    document.getElementById('replay-export-btn').onclick = () => this.exportCurrent();
    document.getElementById('replay-dismiss-btn').onclick = () => {
      overlay.style.display = 'none';
      this.game.state = 'TITLE';
    };
  }

  // ---- Play a replay ----
  playReplay(data) {
    const overlay = document.getElementById('replay-overlay');
    if (overlay) overlay.style.display = 'none';
    this.game.loadReplay(data);
  }

  // ---- Export current game as replay ----
  exportCurrent() {
    const data = this.game.getReplayData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `replay_${data.seed}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ---- Drag-and-drop ----
  _bindDragDrop() {
    document.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });
    document.addEventListener('drop', (e) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.name.endsWith('.json')) {
          this.importFromFile(file).catch(err => {
            alert('Replay import error: ' + err.message);
          });
        }
      }
    });
  }

  // ---- Upload button handler ----
  setupUploadButton() {
    const input = document.getElementById('replay-upload');
    if (input) {
      input.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          this.importFromFile(e.target.files[0]).catch(err => {
            alert('Replay import error: ' + err.message);
          });
        }
      });
    }
  }
}

window.ReplayManager = ReplayManager;
