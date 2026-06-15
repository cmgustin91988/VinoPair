import type { Wine } from "./pairingService";

export type ExternalWineMatch = {
  provider: "Vivino" | "Wine-Searcher" | "CellarTracker" | "Open Food Facts" | "Partner API";
  status: "search" | "matched" | "unavailable";
  label: string;
  confidence?: number;
  url: string;
  note: string;
};

export type WineProviderProfile = {
  name?: string;
  producer?: string;
  vintage?: string;
  region?: string;
  country?: string;
  grape?: string[];
  label_image_url?: string;
  label_image_source?: string;
  style?: Wine["style"];
  body?: Wine["body"];
  acidity?: Wine["acidity"];
  tannin?: Wine["tannin"];
  sweetness?: Wine["sweetness"];
  tags?: string[];
  flavor_notes?: string[];
  pairing_notes?: string[];
};

export type WineLookupResult = {
  matches: ExternalWineMatch[];
  profile?: WineProviderProfile;
};

type OpenFoodFactsSearchProduct = {
  code?: string;
  product_name?: string;
  product_name_en?: string;
  generic_name?: string;
  brands?: string;
  categories?: string;
  labels?: string;
  origins?: string;
  countries?: string;
  image_front_url?: string;
  url?: string;
};

type OpenFoodFactsSearchResponse = {
  products?: OpenFoodFactsSearchProduct[];
};

export function buildExternalLookupLinks(wineName: string): ExternalWineMatch[] {
  const query = normalizeWineQuery(wineName);

  if (!query) return [];

  return [
    {
      provider: "Wine-Searcher",
      status: "search",
      label: "Check price and availability",
      url: `https://www.wine-searcher.com/find/${encodeURIComponent(query).replace(/%20/g, "+")}`,
      note: "Opens Wine-Searcher results for manual verification."
    },
    {
      provider: "Vivino",
      status: "search",
      label: "Check ratings and community notes",
      url: `https://www.vivino.com/search/wines?q=${encodeURIComponent(query)}`,
      note: "Opens Vivino search for manual verification."
    },
    {
      provider: "CellarTracker",
      status: "search",
      label: "Check cellar notes and drinking windows",
      url: `https://www.cellartracker.com/list.asp?Table=List&szSearch=${encodeURIComponent(query)}`,
      note: "Opens CellarTracker search for manual verification."
    }
  ];
}

export async function lookupWineExternally(wineName: string): Promise<ExternalWineMatch[]> {
  const result = await lookupWineWithProfile(wineName);
  return result.matches;
}

export async function lookupWineWithProfile(wineName: string): Promise<WineLookupResult> {
  const fallbackLinks = buildExternalLookupLinks(wineName);
  const viteEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  const apiUrl = viteEnv?.VITE_WINE_LOOKUP_API_URL;

  if (!apiUrl || !wineName.trim()) {
    const publicLookup = await lookupOpenFoodFactsByName(wineName);
    return {
      matches: [...publicLookup.matches, ...fallbackLinks],
      profile: publicLookup.profile
    };
  }

  try {
    const publicLookup = await lookupOpenFoodFactsByName(wineName);
    const response = await fetch(`${apiUrl}?q=${encodeURIComponent(wineName.trim())}`);
    if (!response.ok) {
      return {
        matches: [...publicLookup.matches, ...fallbackLinks],
        profile: publicLookup.profile
      };
    }

    const payload = (await response.json()) as {
      matches?: Array<{
        provider?: string;
        name?: string;
        confidence?: number;
        url?: string;
        note?: string;
      }>;
      profile?: WineProviderProfile;
    };
    const apiMatches =
      payload.matches?.flatMap((match): ExternalWineMatch[] => {
        if (!match.url || !match.name) return [];

        return [
          {
            provider: "Partner API",
            status: "matched",
            label: match.name,
            confidence: match.confidence,
            url: match.url,
            note: match.note ?? `Matched through ${match.provider ?? "configured wine lookup API"}.`
          }
        ];
      }) ?? [];

    return {
      matches: [...apiMatches, ...publicLookup.matches, ...fallbackLinks],
      profile: mergeProfiles(publicLookup.profile, payload.profile)
    };
  } catch {
    const publicLookup = await lookupOpenFoodFactsByName(wineName);
    return {
      matches: [...publicLookup.matches, ...fallbackLinks],
      profile: publicLookup.profile
    };
  }
}

export async function enrichWineWithSources(wine: Wine): Promise<Wine> {
  const lookup = await lookupWineWithProfile(wine.name);
  return applyWineSourceProfile(wine, lookup);
}

export function applyWineSourceProfile(wine: Wine, lookup: WineLookupResult): Wine {
  const profile = lookup.profile;
  const matched = lookup.matches.some((match) => match.status === "matched");
  const keepUploadedLabel = wine.label_image_source === "Uploaded label scan";

  return {
    ...wine,
    name: profile?.name ?? wine.name,
    producer: profile?.producer ?? wine.producer,
    vintage: profile?.vintage ?? wine.vintage ?? extractVintage(wine.name),
    region: profile?.region ?? wine.region ?? inferRegion(wine.name),
    country: profile?.country ?? wine.country ?? inferCountry(wine.name),
    grape: profile?.grape ?? wine.grape ?? inferGrape(wine.name),
    label_image_url: keepUploadedLabel ? wine.label_image_url : profile?.label_image_url ?? wine.label_image_url,
    label_image_source: keepUploadedLabel ? wine.label_image_source : profile?.label_image_source ?? wine.label_image_source,
    style: profile?.style ?? wine.style,
    body: profile?.body ?? wine.body,
    acidity: profile?.acidity ?? wine.acidity,
    tannin: profile?.tannin ?? wine.tannin,
    sweetness: profile?.sweetness ?? wine.sweetness,
    tags: mergeUnique([...(wine.tags ?? []), ...(profile?.tags ?? []), matched ? "source-matched" : "source-linked"]),
    flavor_notes: mergeUnique([...(profile?.flavor_notes ?? []), ...(wine.flavor_notes ?? [])]),
    pairing_notes: mergeUnique([...(profile?.pairing_notes ?? []), ...(wine.pairing_notes ?? [])]),
    source_matches: lookup.matches,
    verification_status: matched ? "verified" : wine.style === "Unknown" ? "needs-review" : "source-linked"
  };
}

function normalizeWineQuery(wineName: string) {
  return wineName
    .replace(/\b(review label photo|unknown)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function mergeUnique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function extractVintage(name: string) {
  return name.match(/\b(19|20)\d{2}\b/)?.[0];
}

async function lookupOpenFoodFactsByName(wineName: string): Promise<WineLookupResult> {
  const query = normalizeWineQuery(wineName);
  if (!query) return { matches: [] };

  try {
    const fields = [
      "code",
      "product_name",
      "product_name_en",
      "generic_name",
      "brands",
      "categories",
      "labels",
      "origins",
      "countries",
      "image_front_url",
      "url"
    ].join(",");
    const params = new URLSearchParams({
      search_terms: query,
      search_simple: "1",
      action: "process",
      json: "1",
      page_size: "5",
      fields
    });
    const response = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?${params.toString()}`);
    if (!response.ok) return { matches: [] };

    const payload = (await response.json()) as OpenFoodFactsSearchResponse;
    const product = pickWineProduct(payload.products ?? [], query);
    if (!product) return { matches: [] };

    const label = product.product_name_en || product.product_name || product.generic_name || product.brands || query;
    const profile = profileFromOpenFoodFactsProduct(product);

    return {
      matches: [
        {
          provider: "Open Food Facts",
          status: "matched",
          label,
          confidence: product.product_name || product.product_name_en ? 0.84 : 0.68,
          url: product.url || `https://world.openfoodfacts.org/product/${product.code ?? ""}`,
          note: "Matched by public Open Food Facts product search."
        }
      ],
      profile
    };
  } catch {
    return { matches: [] };
  }
}

function pickWineProduct(products: OpenFoodFactsSearchProduct[], query: string) {
  const queryTokens = tokenize(query);
  const scored = products
    .map((product) => {
      const text = [
        product.product_name,
        product.product_name_en,
        product.generic_name,
        product.brands,
        product.categories,
        product.labels,
        product.origins,
        product.countries
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const wineSignal = /(wine|vin|vino|champagne|prosecco|rioja|chianti|chablis|sancerre|riesling|pinot|cabernet|merlot|sauvignon|chardonnay)/.test(text);
      const score = queryTokens.reduce((total, token) => total + (text.includes(token) ? 1 : 0), 0) + (wineSignal ? 2 : 0);
      return { product, score };
    })
    .filter((item) => item.score >= Math.min(3, Math.max(1, queryTokens.length)));

  return scored.sort((a, b) => b.score - a.score)[0]?.product;
}

function profileFromOpenFoodFactsProduct(product: OpenFoodFactsSearchProduct): WineProviderProfile {
  const text = [
    product.product_name,
    product.product_name_en,
    product.generic_name,
    product.brands,
    product.categories,
    product.labels,
    product.origins,
    product.countries
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return {
    name: [product.brands?.split(",")[0]?.trim(), product.product_name_en || product.product_name || product.generic_name]
      .filter(Boolean)
      .join(" ")
      .trim() || undefined,
    producer: product.brands?.split(",")[0]?.trim(),
    region: inferRegion(`${text} ${product.origins ?? ""}`),
    country: inferCountry(`${text} ${product.countries ?? ""}`),
    grape: inferGrape(text),
    label_image_url: product.image_front_url,
    label_image_source: product.image_front_url ? "Open Food Facts front image" : undefined,
    style: inferStyle(text),
    sweetness: text.includes("sweet") || text.includes("dessert") ? "Sweet" : undefined,
    tags: mergeUnique(["public-source", ...splitTags(product.categories), ...splitTags(product.labels)]).slice(0, 8),
    flavor_notes: inferFlavorNotes(text),
    pairing_notes: ["Public product details matched through Open Food Facts, then completed with wine-style analysis."]
  };
}

function mergeProfiles(base?: WineProviderProfile, override?: WineProviderProfile): WineProviderProfile | undefined {
  if (!base && !override) return undefined;
  return {
    ...base,
    ...override,
    grape: override?.grape ?? base?.grape,
    tags: mergeUnique([...(base?.tags ?? []), ...(override?.tags ?? [])]),
    flavor_notes: mergeUnique([...(override?.flavor_notes ?? []), ...(base?.flavor_notes ?? [])]),
    pairing_notes: mergeUnique([...(override?.pairing_notes ?? []), ...(base?.pairing_notes ?? [])])
  };
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !["wine", "the", "and", "with"].includes(token));
}

function splitTags(value?: string) {
  return value
    ? value
        .split(",")
        .map((item) => item.trim().replace(/^en:/, ""))
        .filter(Boolean)
    : [];
}

function inferStyle(text: string): Wine["style"] | undefined {
  if (/(champagne|sparkling|prosecco|cava|cremant|crémant|brut)/.test(text)) return "Sparkling";
  if (/(rosé|rose wine|rose)/.test(text)) return "Rose";
  if (/(orange wine|skin contact)/.test(text)) return "Orange";
  if (/(white wine|vin blanc|vino blanco|chardonnay|sauvignon|riesling|chablis|sancerre)/.test(text)) return "White";
  if (/(red wine|vin rouge|vino tinto|cabernet|merlot|pinot noir|malbec|rioja|chianti|syrah|shiraz)/.test(text)) return "Red";
  return undefined;
}

function inferFlavorNotes(text: string) {
  const notes = [
    ["chablis", "chalky mineral"],
    ["champagne", "toast"],
    ["rioja", "savory oak"],
    ["chianti", "red cherry"],
    ["pinot", "red fruit"],
    ["riesling", "lime"],
    ["sauvignon", "citrus"],
    ["chardonnay", "green apple"],
    ["malbec", "black plum"],
    ["cabernet", "blackcurrant"]
  ];
  return notes.filter(([needle]) => text.includes(needle)).map(([, note]) => note);
}

function inferRegion(name: string) {
  const text = name.toLowerCase();
  if (text.includes("chablis")) return "Chablis";
  if (text.includes("sancerre")) return "Loire Valley";
  if (text.includes("rioja")) return "Rioja";
  if (text.includes("champagne")) return "Champagne";
  if (text.includes("chianti")) return "Tuscany";
  if (text.includes("barbera")) return "Piedmont";
  if (text.includes("muscadet")) return "Loire Valley";
  if (text.includes("albarino") || text.includes("albariño")) return "Rias Baixas";
  if (text.includes("malbec")) return "Mendoza";
  if (text.includes("beaujolais")) return "Beaujolais";
  return undefined;
}

function inferCountry(name: string) {
  const text = name.toLowerCase();
  if (/(chablis|sancerre|champagne|beaujolais|burgundy|muscadet)/.test(text)) return "France";
  if (/(rioja|albarino|albariño)/.test(text)) return "Spain";
  if (/(chianti|barbera|nebbiolo|dolcetto|etna)/.test(text)) return "Italy";
  if (text.includes("malbec")) return "Argentina";
  return undefined;
}

function inferGrape(name: string) {
  const text = name.toLowerCase();
  if (text.includes("chablis")) return ["Chardonnay"];
  if (text.includes("sancerre") || text.includes("sauvignon")) return ["Sauvignon Blanc"];
  if (text.includes("rioja")) return ["Tempranillo"];
  if (text.includes("champagne")) return ["Chardonnay", "Pinot Noir", "Meunier"];
  if (text.includes("chianti")) return ["Sangiovese"];
  if (text.includes("barbera")) return ["Barbera"];
  if (text.includes("muscadet")) return ["Melon de Bourgogne"];
  if (text.includes("albarino") || text.includes("albariño")) return ["Albarino"];
  if (text.includes("malbec")) return ["Malbec"];
  if (text.includes("pinot")) return ["Pinot Noir"];
  if (text.includes("riesling")) return ["Riesling"];
  return undefined;
}
