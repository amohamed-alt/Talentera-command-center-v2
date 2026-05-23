/**
 * core/state.js
 * Centralised in-memory cache and route state.
 */
(function () {
  'use strict';

  const _cache = {};

  const State = {
    route: sessionStorage.getItem('tcc_route') || 'acquisition',

    setRoute(r) {
      this.route = r;
      sessionStorage.setItem('tcc_route', r);
    },

    /** Returns cached promise or creates a new one */
    async get(viewName, limit) {
      if (!_cache[viewName]) {
        _cache[viewName] = window.SupabaseClient.fetchView(viewName, limit);
      }
      return _cache[viewName];
    },

    /** Flush one view or all views */
    invalidate(viewName) {
      if (viewName) {
        delete _cache[viewName];
      } else {
        Object.keys(_cache).forEach(k => delete _cache[k]);
      }
    }
  };

  window.AppState = State;
})();
