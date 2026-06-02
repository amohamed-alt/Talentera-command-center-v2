# Talentera Command Center

React/Vite rebuild for the Talentera dashboard.

## Structure

- `src/main.jsx` — React dashboard shell, pages, filters, Supabase adapter, and demo fallback data.
- `src/styles.css` — clean CRM-style dashboard UI.
- `public/config.js` — runtime dashboard config.
- `supabase/dashboard_views_contract.sql` — expected Supabase view contract.
- `.github/workflows/deploy.yml` — GitHub Pages deployment workflow.

## Local setup

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## GitHub Pages

This project is configured for:

```txt
/Talentera-command-center-v2/
```

The included GitHub Actions workflow builds `dist` and deploys it to GitHub Pages.

In GitHub, set:

```txt
Settings → Pages → Source → GitHub Actions
```

## Supabase connection

Edit `public/config.js`:

```js
window.TALENTERA_CONFIG = {
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR_PUBLIC_ANON_KEY',
  useDemoData: false
};
```

Never put a Supabase `service_role` key, HubSpot private app token, or Google credentials in the frontend.

## Required dashboard views

The app expects these views by default:

```txt
v_acquisition_summary
v_acquisition_people
v_acquisition_priority
v_retention_summary
v_retention_people
v_retention_accounts
v_pnl_monthly
```

You can rename them in `public/config.js`.
