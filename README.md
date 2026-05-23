# Talentera Command Center v3

Fully modular, Supabase-only sales command center.

## Structure

```
index.html                         ← Shell only, no logic
assets/
  css/
    base.css                       ← CSS variables, reset, fonts
    layout.css                     ← Sidebar, topbar, main, tabs
    components.css                 ← Cards, tables, modal, states
    acquisition.css                ← Acquisition-specific styles
    retention.css                  ← Retention-specific styles
    pnl.css                        ← P&L chart overrides
  js/
    config.js                      ← Supabase URL + key (only file to edit for creds)
    core/
      supabase.js                  ← REST fetch wrapper
      state.js                     ← In-memory view cache + route state
      formatters.js                ← money / num / pct / esc / hsLink
      utils.js                     ← DOM helpers, error states
      components.js                ← card() / table() / section() / hero()
      modal.js                     ← Reusable detail modal + CSV export
      router.js                    ← Hash-based SPA router + delegated clicks
    modules/
      acquisition.js               ← Acquisition page
      retention-team.js            ← Retention team overview page
      retention-financial.js       ← Retention financial details page
      features-plan.js             ← Features upsell plan page
      pnl.js                       ← P&L revenue analysis page
```

## Routes

| Route                | Module                     |
|----------------------|----------------------------|
| `acquisition`        | acquisition.js             |
| `retention-team`     | retention-team.js          |
| `retention-financial`| retention-financial.js     |
| `features-plan`      | features-plan.js           |
| `pnl`                | pnl.js                     |

## Key rules

- **No legacy JSON fallback** — Supabase-only data source.
- **Every KPI card is clickable** — opens a full modal with filtered rows and CSV export.
- **Every section fails gracefully** — missing views show an unavailable message, not fake zeros.
- **Route persists** across manual refresh via `sessionStorage`.
- **No auto-refresh** — only the Refresh button clears cache and re-fetches.

## HubSpot URLs

Built in `formatters.js`:
- Company: `https://app-eu1.hubspot.com/contacts/145742477/company/{id}`
- Deal:    `https://app-eu1.hubspot.com/contacts/145742477/deal/{id}`
- Contact: `https://app-eu1.hubspot.com/contacts/145742477/contact/{id}`

## Deploy

Push to GitHub and enable GitHub Pages from the `main` branch root.
No build step required — static files only.
