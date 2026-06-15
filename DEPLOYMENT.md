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
```

Use this only for an approved wine-data provider or your own backend bridge. The frontend expects an endpoint that accepts `?q=<wine name>` and returns the shape documented in `README.md`.

## Deploy Manually

```bash
npm run build
npx vercel --prod --yes
```

## GitHub + Vercel Flow

1. Push the repo to GitHub.
2. Import the GitHub repo in Vercel.
3. Confirm the build command is `npm run build`.
4. Add `VITE_WINE_LOOKUP_API_URL` in Vercel only if using an approved source provider.
5. Deploy from `main`.

Every commit should pass the GitHub Actions build workflow before promotion.
