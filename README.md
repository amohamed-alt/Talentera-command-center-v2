# Talentera Dashboard Modular Split

This package is a physical modular split of the last Supabase-only dashboard file.

## What changed
- `index.html` now keeps the same dashboard shell and layout.
- Inline CSS was extracted into `assets/css/...`.
- Inline JavaScript was extracted into `assets/js/...`.
- Script execution order is preserved by keeping the same `<script>` order in `index.html`.
- No legacy JSON fallback was intentionally added in this split.

## Folder logic
- `assets/js/core`: original common/base scripts.
- `assets/js/router`: tab/router/navigation stability patches.
- `assets/js/supabase`: Supabase-only loading and mapping patches.
- `assets/js/acquisition`: acquisition-specific scripts found by name/content.
- `assets/js/retention`: retention/team/financial scripts.
- `assets/js/features-plan`: upsell/features plan scripts.
- `assets/js/pnl`: P&L/revenue analysis scripts.

## Deployment
Upload the whole folder content to GitHub Pages, keeping the same relative paths:

```
index.html
assets/css/...
assets/js/...
```

Do not upload only `index.html`; it depends on the `assets` folder.

## Next refactor phase
This split reduces risk immediately, but the next proper phase is logical cleanup: merge repeated patches into clean modules like `acquisition.js`, `retention-team.js`, `retention-financial.js`, `features-plan.js`, and `pnl.js`.
