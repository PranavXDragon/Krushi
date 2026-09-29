/**
 * KRUSHI - Supabase REST Client
 * Communicates directly with Supabase via PostgREST API
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://hccppqykmjfcpjmhntks.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjY3BwcXlrbWpmY3BqbWhudGtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NjkyODcsImV4cCI6MjEwNjI0NTI4N30.4ATVqARowUNzUk49LZMKkIbeealIlnQCf0Tt6JnsKvQ";

export const supabaseService = {
  /**
   * Fetches latest telemetry directly from Supabase
   */
  async getLatestTelemetry(limit: number = 20) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/esp32_telemetry?select=*&order=created_at.desc&limit=${limit}`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.warn('[Supabase Client] Fetch failed:', err);
      return [];
    }
  },

  /**
   * Inserts a telemetry record directly into Supabase
   */
  async insertTelemetry(data: Record<string, any>) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/esp32_telemetry`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Insert failed');
      }
      return await res.json();
    } catch (err) {
      console.error('[Supabase Client] Insert error:', err);
      throw err;
    }
  }
};
