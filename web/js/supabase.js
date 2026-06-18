/**
 * Hiss-Tastic Supabase integration.
 * Lightweight REST client — no SDK dependency.
 * Stores anonymous player profiles and personal-best leaderboard rows.
 */

const SUPABASE_URL = 'https://qoxmibmbyjmkntzrckyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_FTJ_XShVabxUb_NVrH7Htw_h3w2ponJ';

const SupabaseClient = {
  _fetch(url, options) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    return fetch(url, { ...options, signal: controller.signal })
      .finally(() => clearTimeout(timeout));
  },

  _headers(playerId) {
    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Prefer': 'return=minimal',
    };
    if (playerId) headers['x-player-id'] = playerId;
    return headers;
  },

  /**
   * Upsert an anonymous player profile via server-side RPC.
   * The RPC reads player_id from x-player-id header.
   * @param {{player_id: string, username: string, created_at: string}} identity
   * @returns {Promise<{ok: boolean, error?: string}>}
   */
  async upsertPlayer(identity) {
    try {
      const res = await this._fetch(
        SUPABASE_URL + '/rest/v1/rpc/upsert_my_player',
        {
          method: 'POST',
          headers: this._headers(identity.player_id),
          body: JSON.stringify({ p_username: identity.username }),
        }
      );

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
   * Upsert a player's global personal best via a server-side RPC.
   * The RPC reads player_id from x-player-id header, so no player_id
   * is ever exposed to the client or public queries.
   * @param {{player_id: string, username: string, best_score: number}} entry
   * @returns {Promise<{ok: boolean, error?: string}>}
   */
  async upsertLeaderboardScore(entry) {
    try {
      const res = await this._fetch(
        SUPABASE_URL + '/rest/v1/rpc/upsert_my_leaderboard_score',
        {
          method: 'POST',
          headers: this._headers(entry.player_id),
          body: JSON.stringify({
            p_best_score: entry.best_score,
            p_username: entry.username,
          }),
        }
      );

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
      const res = await this._fetch(
        SUPABASE_URL + '/rest/v1/leaderboard_scores?select=username,best_score,updated_at&order=best_score.desc&limit=' + limit,
        { headers: this._headers() }
      );
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  /**
   * Fetch the current player's own leaderboard entry and exact rank.
   * Identifies the player via x-player-id header; rank is computed
   * server-side in the RPC. No player_id is exposed.
   * @param {string} playerId
   * @returns {Promise<{username: string, best_score: number, rank: number, updated_at: string}|null>}
   */
  async getMyLeaderboardEntry(playerId) {
    try {
      const res = await this._fetch(
        SUPABASE_URL + '/rest/v1/rpc/get_my_leaderboard_entry',
        { method: 'POST', headers: this._headers(playerId) }
      );
      if (!res.ok) return null;
      const data = await res.json();
      return (data && data.length > 0) ? data[0] : null;
    } catch {
      return null;
    }
  },
};

window.SupabaseClient = SupabaseClient;
