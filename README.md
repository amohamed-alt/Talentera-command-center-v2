# Talentera Command Center v4

Premium modular dashboard — Supabase-only data source.

## Structure
```
index.html                    ← Shell only
assets/css/                   ← base, components, acquisition, retention, pnl
assets/js/
  config.js                   ← Supabase URL + key
  supabase-client.js          ← REST fetch wrapper
  state.js                    ← Cache + route state
  utils.js                    ← Formatters + helpers
  components.js               ← Reusable builders
  modal.js                    ← Detail modal + search + CSV
  router.js                   ← SPA router + boot
  modules/                    ← One file per page
```

## Routes
- acquisition
- retention-team
- retention-financial
- features-plan
- pnl

No JSON fallback. No auto-refresh. Route persists in sessionStorage.
