import { createWineFromText, Wine } from "./pairingService";
import {
  applyWineSourceProfile,
  ExternalWineMatch,
  lookupWineWithProfile,
  WineLookupResult,
  WineProviderProfile
} from "./wineLookupService";

type OpenFoodFactsProduct = {
  code?: string;
  product_name?: string;
  product_name_en?: string;
  generic_name?: string;
  brands?: string;
  categories?: string;
  categories_tags?: string[];
  labels?: string;
  labels_tags?: string[];
  origins?: string;
  countries?: string;
  countries_tags?: string[];
  image_front_url?: string;
  url?: string;
};

type OpenFoodFactsResponse = {
  status?: number;
  product?: OpenFoodFactsProduct;
};

export type BarcodeWineLookupResult = {
  barcode: string;
  wine: Wine;
  matches: ExternalWineMatch[];
  note: string;
  confidence: number;
};

export async function lookupWineByBarcode(barcodeInput: string, index: number): Promise<BarcodeWineLookupResult> {
  const barcode = normalizeBarcode(barcodeInput);

  if (!barcode) {
    throw new Error("Enter a UPC or EAN barcode from the bottle.");
  }

  const fields = [
    "code",
    "product_name",
    "product_name_en",
    "generic_name",
    "brands",
    "categories",
    "categories_tags",
    "labels",
    "labels_tags",
    "origins",
    "countries",
    "countries_tags",
    "image_front_url",
    "url"
  ].join(",");
  const response = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=${encodeURIComponent(fields)}`
  );

  if (!response.ok) {
    throw new Error("Open Food Facts did not respond. Try again in a moment.");
  }

  const payload = (await response.json()) as OpenFoodFactsResponse;

  if (payload.status !== 1 || !payload.product) {
    throw new Error("No bottle found for that barcode yet.");
  }

  const product = payload.product;
  const productName = buildProductName(product);
  const baseWine = createWineFromText(productName || `Barcode ${barcode}`, index);
  const openFoodFactsMatch = buildOpenFoodFactsMatch(product, barcode);
  const productProfile = buildProfileFromProduct(product);
  const partnerLookup = await lookupWineWithProfile(productName || baseWine.name);
  const lookup: WineLookupResult = {
    matches: [openFoodFactsMatch, ...partnerLookup.matches],
    profile: {
      ...productProfile,
      ...partnerLookup.profile,
      tags: mergeUnique([...(productProfile.tags ?? []), ...(partnerLookup.profile?.tags ?? [])]),
      grape: partnerLookup.profile?.grape ?? productProfile.grape,
      flavor_notes: mergeUnique([
        ...(partnerLookup.profile?.flavor_notes ?? []),
        ...(productProfile.flavor_notes ?? [])
      ]),
      pairing_notes: mergeUnique([
        ...(partnerLookup.profile?.pairing_notes ?? []),
        ...(productProfile.pairing_notes ?? [])
      ])
    }
  };
  const wine = applyWineSourceProfile(baseWine, lookup);

  return {
    barcode,
    wine,
    matches: lookup.matches,
    note: `Found ${productName || "this bottle"} in Open Food Facts and added wine-service checks.`,
    confidence: productName ? 0.9 : 0.72
  };
}

export function extractBarcodeCandidate(text: string) {
  const compact = text.replace(/[^\d]/g, " ");
  const candidates = compact.match(/\b\d{8,14}\b/g) ?? [];
  return candidates.find((candidate) => isLikelyBarcode(candidate)) ?? "";
}

function normalizeBarcode(value: string) {
  const barcode = value.replace(/\D/g, "");
  return isLikelyBarcode(barcode) ? barcode : "";
}

function isLikelyBarcode(value: string) {
  return /^\d{8,14}$/.test(value);
}

function buildProductName(product: OpenFoodFactsProduct) {
  const name = product.product_name_en || product.product_name || product.generic_name || "";
  const brand = product.brands?.split(",")[0]?.trim() ?? "";

  if (brand && name && !name.toLowerCase().includes(brand.toLowerCase())) {
    return `${brand} ${name}`.trim();
  }

  return name || brand;
}

function buildOpenFoodFactsMatch(product: OpenFoodFactsProduct, barcode: string): ExternalWineMatch {
  return {
    provider: "Open Food Facts",
    status: "matched",
    label: product.product_name_en || product.product_name || product.brands || `Barcode ${barcode}`,
    confidence: product.product_name || product.product_name_en ? 0.9 : 0.72,
    url: product.url || `https://world.openfoodfacts.org/product/${barcode}`,
    note: "Matched from the public Open Food Facts barcode database."
  };
}

function buildProfileFromProduct(product: OpenFoodFactsProduct): WineProviderProfile {
  const text = [
    product.product_name,
    product.product_name_en,
    product.generic_name,
    product.brands,
    product.categories,
    product.labels,
    product.origins,
    product.countries,
    ...(product.categories_tags ?? []),
    ...(product.labels_tags ?? [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const tags = mergeUnique([
    "barcode-matched",
    ...splitTags(product.categories),
    ...splitTags(product.labels),
    ...((product.categories_tags ?? []).map(cleanTaxonomyTag)),
    ...((product.labels_tags ?? []).map(cleanTaxonomyTag))
  ]).slice(0, 8);

  return {
    producer: product.brands?.split(",")[0]?.trim(),
    region: inferRegionFromProduct(text, product.origins),
    country: inferCountryFromProduct(product.countries, product.countries_tags),
    grape: inferGrapesFromProduct(text),
    label_image_url: product.image_front_url,
    label_image_source: product.image_front_url ? "Open Food Facts front image" : undefined,
    style: inferStyleFromProduct(text),
    body: undefined,
    acidity: undefined,
    tannin: undefined,
    sweetness: text.includes("sweet") || text.includes("dessert wine") ? "Sweet" : undefined,
    tags,
    flavor_notes: inferFlavorNotesFromProduct(text),
    pairing_notes: ["Barcode details verified against Open Food Facts, then completed with wine-style analysis."]
  };
}

function inferStyleFromProduct(text: string): WineProviderProfile["style"] {
  if (/(champagne|sparkling|prosecco|cava|crémant|cremant|brut)/.test(text)) return "Sparkling";
  if (/(rosé|rose wine|rose)/.test(text)) return "Rose";
  if (/(orange wine|skin contact)/.test(text)) return "Orange";
  if (/(white wine|vin blanc|vino blanco|chardonnay|sauvignon|riesling|chablis|sancerre)/.test(text)) return "White";
  if (/(red wine|vin rouge|vino tinto|cabernet|merlot|pinot noir|malbec|rioja|chianti|syrah)/.test(text)) return "Red";
  return undefined;
}

function inferGrapesFromProduct(text: string) {
  const grapes = [
    ["cabernet sauvignon", "Cabernet Sauvignon"],
    ["pinot noir", "Pinot Noir"],
    ["sauvignon blanc", "Sauvignon Blanc"],
    ["chardonnay", "Chardonnay"],
    ["riesling", "Riesling"],
    ["malbec", "Malbec"],
    ["merlot", "Merlot"],
    ["syrah", "Syrah"],
    ["shiraz", "Syrah"],
    ["tempranillo", "Tempranillo"],
    ["sangiovese", "Sangiovese"],
    ["grenache", "Grenache"],
    ["barbera", "Barbera"],
    ["gamay", "Gamay"],
    ["chenin", "Chenin Blanc"],
    ["albarino", "Albarino"],
    ["albariño", "Albarino"]
  ];

  return grapes.filter(([needle]) => text.includes(needle)).map(([, grape]) => grape);
}

function inferRegionFromProduct(text: string, origins?: string) {
  const regionText = `${text} ${origins ?? ""}`.toLowerCase();
  if (regionText.includes("chablis")) return "Chablis";
  if (regionText.includes("sancerre")) return "Loire Valley";
  if (regionText.includes("champagne")) return "Champagne";
  if (regionText.includes("rioja")) return "Rioja";
  if (regionText.includes("chianti") || regionText.includes("tuscany")) return "Tuscany";
  if (regionText.includes("beaujolais")) return "Beaujolais";
  if (regionText.includes("mendoza")) return "Mendoza";
  return origins?.split(",")[0]?.trim();
}

function inferCountryFromProduct(countries?: string, countryTags?: string[]) {
  const fromTag = countryTags?.[0]?.replace(/^en:/, "").replace(/-/g, " ");
  return countries?.split(",")[0]?.trim() || titleCase(fromTag ?? "");
}

function inferFlavorNotesFromProduct(text: string) {
  if (/(champagne|sparkling|brut)/.test(text)) return ["citrus", "green apple", "toast", "mineral"];
  if (/(chablis|sancerre|sauvignon|albarino|muscadet)/.test(text)) return ["lemon", "green apple", "herbs", "mineral"];
  if (/(pinot|beaujolais|gamay)/.test(text)) return ["red cherry", "raspberry", "earth", "dried herbs"];
  if (/(cabernet|malbec|syrah|rioja)/.test(text)) return ["black cherry", "plum", "spice", "savory oak"];
  return [];
}

function splitTags(value?: string) {
  return (
    value
      ?.split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean) ?? []
  );
}

function cleanTaxonomyTag(tag: string) {
  return tag.replace(/^en:/, "").replace(/-/g, " ").trim().toLowerCase();
}

function mergeUnique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}
