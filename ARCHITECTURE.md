# Architecture

VinoPair is a client-side React app built with Vite and TypeScript.

## Core Modules

- `src/App.tsx`: UI shell, screen routing, upload flows, inVINtory interactions, and visual components.
- `src/App.css`: mobile-first design system and responsive layout.
- `src/pairingService.ts`: meal analysis, wine pairing, inverse food pairing, wine inference, and starter inventory.
- `src/wineLookupService.ts`: compliant wine-source enrichment, Open Food Facts name search, source links, and optional partner API bridge.
- `src/openFoodFactsService.ts`: barcode lookup through Open Food Facts.
- `src/cloudSyncService.ts`: optional Supabase auth and cloud state persistence.
- `api/wine-lookup.ts`: Vercel serverless bridge for approved wine data providers.

## Data Flow

1. User describes a meal, uploads a menu/recipe, chooses a wine, or adds a cellar bottle.
2. Local analysis creates structured meal or wine traits.
3. Source lookup enriches wine profiles when available.
4. Pairing logic ranks ideal bottle/food matches using structure, flavor, occasion, and preferences.
5. inVINtory and preferences persist in `localStorage`.

## Wine Source Strategy

The app avoids scraping commercial wine sites. It uses:

- Open Food Facts for public barcode/product data.
- Open Food Facts name search for public enrichment.
- Vivino, Wine-Searcher, and CellarTracker outbound links for manual verification.
- Optional `VITE_WINE_LOOKUP_API_URL` for an approved commercial/partner API bridge.

## Persistence

Current persistence is browser-local:

- Inventory: `localStorage`
- Preferences: `localStorage`
- Source refresh ledger: `localStorage`
- Optional cloud profile: Supabase `vinopair_profiles`

Future production persistence can move these to a backend database without changing the pairing service contract.

## AI Expansion Points

- Replace local meal parsing with a production LLM call.
- Use a vision/OCR service for menu screenshots and wine labels.
- Store wine embeddings for semantic pairings.
- Add authenticated user cellars and pairing history.
