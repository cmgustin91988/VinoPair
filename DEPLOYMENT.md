# Deployment

VinoPair is deployed as a Vite static app.

## Production

Current production alias:

```text
https://invintory-check.vercel.app
```

## Vercel Settings

- Framework preset: Vite
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`

## Environment Variables

Optional:

```text
VITE_WINE_LOOKUP_API_URL
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
WINE_PROVIDER_API_URL
WINE_PROVIDER_API_KEY
```

Use wine provider keys only with the server-side Vercel bridge. Do not expose provider secrets in frontend `VITE_` variables.

For accounts and cloud cellar sync, configure Supabase using `SUPABASE_SETUP.md`.

## Deploy Manually

```bash
npm run build
npx vercel --prod --yes
```

## GitHub + Vercel Flow

1. Push the repo to GitHub.
2. Import the GitHub repo in Vercel.
3. Confirm the build command is `npm run build`.
4. Add Supabase env vars if using cloud accounts.
5. Add wine provider env vars only if using an approved source provider.
6. Deploy from `main`.

Every commit should pass the GitHub Actions build workflow before promotion.
