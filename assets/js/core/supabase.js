/**
 * core/supabase.js
 * Thin REST wrapper around Supabase. No SDK needed.
 */
(function () {
  'use strict';
  const C = window.TALENTERA_CONFIG;

  async function fetchView(name, limit = 10000) {
    const url = `${C.supabaseUrl}/rest/v1/${encodeURIComponent(name)}?select=*&limit=${limit}`;
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        apikey: C.supabaseKey,
        Authorization: `Bearer ${C.supabaseKey}`
      }
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`View "${name}" returned HTTP ${res.status}. ${body}`.trim());
    }
    return res.json();
  }

  window.SupabaseClient = { fetchView };
})();
