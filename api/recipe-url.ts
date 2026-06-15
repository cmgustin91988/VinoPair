type RecipeUrlRequest = {
  query: Record<string, string | string[] | undefined>;
};

type RecipeUrlResponse = {
  status: (code: number) => RecipeUrlResponse;
  json: (body: unknown) => void;
};

type JsonLdRecipe = {
  "@type"?: string | string[];
  name?: string;
  recipeIngredient?: string[];
  recipeInstructions?: Array<string | { text?: string; name?: string }> | string;
  description?: string;
  recipeCuisine?: string;
  recipeCategory?: string;
};

export default async function handler(request: RecipeUrlRequest, response: RecipeUrlResponse) {
  const rawUrl = String(request.query.url ?? "").trim();
  const parsedUrl = parseHttpUrl(rawUrl);

  if (!parsedUrl) {
    response.status(400).json({ error: "Enter a valid recipe URL." });
    return;
  }

  try {
    const upstream = await fetch(parsedUrl.toString(), {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "VinoPair recipe parser/1.0"
      }
    });

    if (!upstream.ok) {
      response.status(200).json({ error: "Recipe page could not be loaded." });
      return;
    }

    const html = await upstream.text();
    const recipe = extractRecipeFromHtml(html);

    if (!recipe.meal_description) {
      response.status(200).json({ error: "Could not find a recipe on that page." });
      return;
    }

    response.status(200).json({
      ...recipe,
      source_url: parsedUrl.toString()
    });
  } catch {
    response.status(200).json({ error: "Recipe URL could not be read." });
  }
}

function parseHttpUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function extractRecipeFromHtml(html: string) {
  const jsonLdRecipes = extractJsonLdRecipes(html);
  const recipe = jsonLdRecipes[0];

  if (recipe) {
    const ingredients = recipe.recipeIngredient?.filter(Boolean) ?? [];
    const instructions = normalizeInstructions(recipe.recipeInstructions);
    const name = decodeHtml(recipe.name ?? "");
    const description = decodeHtml(recipe.description ?? "");
    const ingredientSummary = summarizeIngredients(ingredients);
    const instructionSummary = summarizeInstructions(instructions);
    const cuisine = decodeHtml(recipe.recipeCuisine ?? "");
    const category = decodeHtml(recipe.recipeCategory ?? "");
    const descriptor = [description, ingredientSummary, instructionSummary, cuisine, category]
      .filter(Boolean)
      .join(". ");

    return {
      title: name,
      meal_description: [name, descriptor].filter(Boolean).join(" with ").slice(0, 900),
      ingredients,
      source_type: "json-ld"
    };
  }

  const title = decodeHtml(
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
      html.match(/<title[^>]*>(.*?)<\/title>/is)?.[1] ??
      ""
  );
  const description = decodeHtml(
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
      html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
      ""
  );

  return {
    title,
    meal_description: [title, description].filter(Boolean).join(" with ").slice(0, 700),
    ingredients: [],
    source_type: "metadata"
  };
}

function extractJsonLdRecipes(html: string): JsonLdRecipe[] {
  const blocks = Array.from(html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis));

  return blocks.flatMap((block) => {
    try {
      const parsed = JSON.parse(block[1].trim()) as unknown;
      return findRecipes(parsed);
    } catch {
      return [];
    }
  });
}

function findRecipes(value: unknown): JsonLdRecipe[] {
  if (!value || typeof value !== "object") return [];

  if (Array.isArray(value)) {
    return value.flatMap(findRecipes);
  }

  const record = value as Record<string, unknown>;
  const type = record["@type"];
  const types = Array.isArray(type) ? type : [type];
  const recipes = types.some((item) => String(item).toLowerCase() === "recipe") ? [record as JsonLdRecipe] : [];
  const graph = Array.isArray(record["@graph"]) ? record["@graph"].flatMap(findRecipes) : [];

  return [...recipes, ...graph];
}

function normalizeInstructions(instructions: JsonLdRecipe["recipeInstructions"]) {
  if (!instructions) return [];
  if (typeof instructions === "string") return [decodeHtml(instructions)];
  return instructions
    .map((step) => (typeof step === "string" ? step : step.text || step.name || ""))
    .map(decodeHtml)
    .filter(Boolean);
}

function summarizeIngredients(ingredients: string[]) {
  return ingredients
    .map((ingredient) => decodeHtml(ingredient).replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 10)
    .join(", ");
}

function summarizeInstructions(instructions: string[]) {
  return instructions
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 260);
}

function decodeHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
