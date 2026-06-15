import type { WineStyle } from "./pairingService";

export type VisionLabelResult = {
  name?: string;
  producer?: string;
  vintage?: string;
  region?: string;
  country?: string;
  grape?: string[];
  appellation?: string;
  style?: WineStyle;
  raw_text?: string;
  lookup_queries?: string[];
  confidence?: number;
  note?: string;
};

export type VisionMealResult = {
  meal_description?: string;
  dish_name?: string;
  main_ingredients?: string[];
  cuisine?: string;
  sauce?: string;
  protein?: string;
  raw_text?: string;
  confidence?: number;
  note?: string;
};

type VisionResponse = {
  available?: boolean;
  result?: VisionLabelResult | VisionMealResult;
  note?: string;
};

export async function identifyWineLabelWithVision(
  imageDataUrl: string,
  fileName: string
): Promise<VisionLabelResult | null> {
  const result = await identifyImageWithVision(imageDataUrl, fileName, "wine-label");
  if (!result || !("name" in result) || !result.name) return null;

  return normalizeVisionResult(result);
}

export async function identifyMealImageWithVision(
  imageDataUrl: string,
  fileName: string
): Promise<VisionMealResult | null> {
  const result = await identifyImageWithVision(imageDataUrl, fileName, "menu-item");
  if (!result || !("meal_description" in result) || !result.meal_description) return null;

  return {
    ...result,
    meal_description: result.meal_description.trim(),
    confidence: typeof result.confidence === "number" ? Math.max(0, Math.min(1, result.confidence)) : 0.75
  };
}

async function identifyImageWithVision(
  imageDataUrl: string,
  fileName: string,
  mode: "wine-label" | "menu-item"
): Promise<VisionLabelResult | VisionMealResult | null> {
  try {
    const response = await fetch("/api/label-identify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ imageDataUrl, fileName, mode })
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as VisionResponse;
    if (!payload.available || !payload.result) return null;

    return payload.result;
  } catch {
    return null;
  }
}

function normalizeVisionResult(result: VisionLabelResult): VisionLabelResult {
  const lookupQueries = [
    ...(result.lookup_queries ?? []),
    [result.vintage, result.producer, result.appellation || result.region].filter(Boolean).join(" "),
    [result.producer, result.appellation || result.region].filter(Boolean).join(" "),
    result.name
  ]
    .flatMap((query) => (typeof query === "string" ? [query.trim()] : []))
    .filter((query) => query.length >= 3);

  return {
    ...result,
    name: result.name?.trim(),
    producer: result.producer?.trim(),
    vintage: result.vintage?.trim(),
    region: result.region?.trim() || result.appellation?.trim(),
    country: result.country?.trim(),
    grape: result.grape?.map((grape) => grape.trim()).filter(Boolean),
    lookup_queries: Array.from(new Set(lookupQueries)).slice(0, 6),
    confidence: typeof result.confidence === "number" ? Math.max(0, Math.min(1, result.confidence)) : 0.82
  };
}
