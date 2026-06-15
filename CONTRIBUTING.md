# Contributing

Thanks for improving VinoPair. Keep changes focused on wine pairing, wine-first food matching, and inVINtory cellar tracking.

## Local Setup

```bash
npm install
npm run dev
```

Before opening a pull request:

```bash
npm run build
```

## Development Notes

- Use **VinoPair** for the app and **inVINtory** only for cellar tracking.
- Keep UI mobile-first and polished.
- Do not scrape commercial wine platforms.
- Use Open Food Facts, compliant outbound source links, or an approved API bridge.
- Preserve uploaded label images when enriching wines from source data.
- Pairing rules should improve both the visible recommendation and the explanation.

## Pull Request Checklist

- Build passes.
- VinoPair logo and brand treatment still render correctly.
- Meal-first, wine-first, and inVINtory flows still work.
- Source lookup degrades gracefully when no match is available.
- Wine additions produce complete style, structure, tasting-note, and pairing-note profiles.
