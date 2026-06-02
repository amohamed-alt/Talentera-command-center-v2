# Talentera Sales Command Center

React/Vite dashboard rebuilt around the Supabase view contract.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy

GitHub Pages is configured through `.github/workflows/deploy.yml`.

Set GitHub Pages source to:

```txt
Settings → Pages → Source → GitHub Actions
```

## Supabase

Edit `public/config.js` or use Vite env vars:

```js
window.TALENTERA_CONFIG = {
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR_PUBLIC_ANON_KEY',
  schema: 'public'
};
```

Never place service role keys, HubSpot private app tokens, or Google credentials in the frontend.

## Data behavior

No fake KPI numbers are generated. Missing or unconnected Supabase views render empty states until the backend view is ready.
