# AGENTS.md

Guidance for AI coding agents working on this repository.

## Project

This repo contains **VinoPair**, a mobile-first wine and food pairing app. It is not related to SmartCart or grocery planning.

The product promise: help a user choose the right wine for a meal, or the right food for a wine they want to open, using occasion context, wine preferences, source-backed enrichment, and clear sommelier-style reasoning.

The cellar tracking component is called **inVINtory**. Keep that name for inventory/cellar features only.

## Brand

- Parent app name: **VinoPair**
- Tagline: **Pair. Pour. Track.**
- Cellar module name: **inVINtory**
- App logo asset: `src/assets/vinopair-logo.png`
- Static logo asset: `public/vinopair-logo.png`
- The VinoPair logo should remain visible in the persistent app header.
- Keep the experience polished, marketable, and mobile-first.

## Stack

- Vite
- React
- TypeScript
- CSS in `src/App.css`
- Browser OCR through `tesseract.js`
- Icons from `lucide-react`

Important files:

- `src/App.tsx`: main UI, screen routing, browser OCR hooks, inventory interactions, brand shell, and graphical components.
- `src/App.css`: visual design system, responsive styling, mobile-first layout, brand treatment.
- `src/pairingService.ts`: meal analysis, wine pairing logic, inverse wine-to-food logic, occasion mode behavior, local wine inference.
- `src/wineLookupService.ts`: compliant wine-service handoffs and optional approved partner API bridge.
- `src/openFoodFactsService.ts`: Open Food Facts barcode lookup.
- `src/cloudSyncService.ts`: optional Supabase account and cloud inVINtory sync.
- `api/wine-lookup.ts`: Vercel serverless bridge for approved server-side wine data providers.
- `src/assets/vinopair-logo.png`: bundled VinoPair logo used by the app UI.
- `public/vinopair-logo.png`: VinoPair logo.
- `README.md`: product and integration overview.
- `ARCHITECTURE.md`: source strategy, data flow, and production expansion notes.
- `DEPLOYMENT.md`: Vercel and GitHub deployment workflow.
- `SUPABASE_SETUP.md`: Supabase schema, auth, and cloud sync setup.
- `CONTRIBUTING.md`: contributor setup and PR checklist.
- `.github/workflows/ci.yml`: GitHub Actions build check.

## Commands

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

Before handing off a code change, run `npm run build` unless the change is documentation-only.

GitHub Actions also runs `npm ci` and `npm run build` on pushes to `main` and pull requests.

## Product Rules

- Keep the app focused on wine pairing, wine-first food pairing, and personal cellar awareness.
- Use **VinoPair** for the overall app and **inVINtory** for cellar tracking.
- Preserve the burgundy/gold wine identity and logo-forward brand shell.
- Use user-facing, non-technical language in the UI.
- Prefer useful, graphical UI that explains the recommendation: pairing compass, flavor constellation, wine profile cards, food pairing tiles, source badges, and occasion modes.
- Keep the first screen useful. Do not add a marketing-only landing page in front of the app.
- Keep recommendations opinionated and food-aware. For example, Chianti/Sangiovese should strongly favor tomato sauce pasta, pizza, chicken parmesan, and other tomato/herb/garlic dishes.
- When adding a pairing rule, make sure it improves both reasoning and visible output where appropriate.

## Wine Data And API Rules

- Do **not** scrape Vivino, Wine-Searcher, CellarTracker, or other commercial wine platforms.
- Use compliant outbound search links for Vivino, Wine-Searcher, and CellarTracker.
- Use Open Food Facts for public barcode/product lookup.
- If commercial wine data access is needed, use the `VITE_WINE_LOOKUP_API_URL` partner API bridge in `src/wineLookupService.ts`.
- Prefer the bundled `/api/wine-lookup` bridge for server-side provider keys on Vercel; never expose provider secrets in `VITE_` variables.
- Manual adds, label scans, and barcode matches should all result in a wine with style, body, acidity, tannin, sweetness, flavor notes, pairing notes, source references, and verification status.
- If an external source is unavailable, degrade gracefully to inferred profile plus verification links.

## AI / OCR Behavior

- Menu and recipe uploads should translate into the manual meal text box, then run pairing from that normalized text.
- Label uploads should use OCR where possible, then present a review candidate before adding to inVINtory.
- Barcode text found during label OCR may be checked through Open Food Facts before falling back to label-text inference.
- Do not overclaim AI certainty. Use confidence, source status, and review states honestly.

## UI Guidelines

- Design mobile-first, then enhance for larger screens.
- Keep the persistent VinoPair header visible and compact.
- Keep controls dense but polished: tabs, segmented controls, buttons with lucide icons, chips, meters, and review cards.
- Keep cards at `8px` radius unless matching an existing local pattern.
- Do not add decorative orbs, bokeh blobs, or generic marketing sections.
- Avoid one-note color palettes. Burgundy is the brand anchor, but keep supporting sage, gold, rose, paper, and ink tones.
- Make text fit on mobile and desktop. Check compact controls, tiles, tabs, and brand areas for wrapping.
- Use real controls for actions; avoid explanatory in-app paragraphs about how the app works unless they serve the workflow.

## State And Persistence

- Inventory and preferences are currently stored in `localStorage`.
- If Supabase env vars are configured, the Account tab can sync inventory and preferences to `vinopair_profiles`.
- Storage keys may still reference `invintory`; that is acceptable because inVINtory is the cellar module.
- `starterInventory` lives in `src/pairingService.ts`.
- `ensureWineAnalysis` migrates older stored wine objects into the current analysis shape.

## Deployment

The app has previously been deployed to Vercel. If asked to deploy, build first and then deploy from a clean runnable project copy or the repo root, depending on local permissions.

Current known public URL from prior deployment:

```text
https://invintory-check.vercel.app
```

Do not claim new changes are live on Vercel unless a fresh deployment has actually succeeded.

## Local Workspace Note

Some local environments may have trouble running commands directly from a path with spaces such as:

```text
/Users/cgustin/Documents/New project
```

If that happens, validate from a temporary synced copy such as `/private/tmp/invintory-check`, but make source edits in this repo.

## Code Style

- Prefer existing patterns over new abstractions.
- Keep changes scoped to the requested behavior.
- Use TypeScript types for new recommendation shapes and UI state.
- Use `lucide-react` for icons when available.
- Avoid adding dependencies unless they clearly improve the product and are worth the bundle/runtime cost.
- Keep comments sparse and useful.

## Pull Request Checklist

- `npm run build` passes.
- New or changed recommendation behavior has a clear product reason.
- UI works at mobile and desktop widths.
- VinoPair branding and logo remain visible.
- inVINtory naming remains limited to cellar/inventory features.
- Wine lookups remain compliant and do not scrape commercial services.
- Existing meal-first, wine-first, inVINtory, label scan, barcode lookup, and preferences flows still make sense.
