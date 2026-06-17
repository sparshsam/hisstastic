/**
 * Hiss-Tastic Supabase integration.
 * Lightweight REST client — no SDK dependency.
 * Submits high scores to the shared Elora database.
 */

const SUPABASE_URL = 'https://qoxmibmbyjmkntzrckyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_FTJ_XShVabxUb_NVrH7Htw_h3w2ponJ';

const SupabaseClient = {
  _headers() {
    return {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Prefer': 'return=minimal',
    };
  },

  /**
   * Submit a high score.
   * @param {number} score
   * @param {string} difficulty - easy/normal/hard
   * @param {number} snakeLength
   * @param {number} powerupsCollected
   * @param {string} [playerName] - optional name
   * @returns {Promise<{ok: boolean, error?: string}>}
   */
  async submitScore(score, difficulty, snakeLength, powerupsCollected, playerName) {
    try {
      const body = {
        player_name: playerName || 'anonymous',
        score,
        difficulty: difficulty || 'normal',
        snake_length: snakeLength || 1,
        powerups_collected: powerupsCollected || 0,
      };

      const res = await fetch(SUPABASE_URL + '/rest/v1/hisstastic/high_scores', {
        method: 'POST',
        headers: this._headers(),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        return { ok: false, error: `HTTP ${res.status}: ${text}` };
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  /**
   * Fetch the top scores.
   * @param {number} [limit=10]
   * @returns {Promise<Array>}
   */
  async getTopScores(limit) {
    limit = limit || 10;
    try {
      const res = await fetch(
        SUPABASE_URL + '/rest/v1/hisstastic/high_scores?order=score.desc&limit=' + limit,
        { headers: this._headers() }
      );
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },
};
