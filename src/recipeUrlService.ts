export type RecipeUrlResult = {
  title?: string;
  meal_description?: string;
  ingredients?: string[];
  source_type?: "json-ld" | "metadata";
  source_url?: string;
  error?: string;
};

export async function fetchRecipeFromUrl(url: string): Promise<RecipeUrlResult> {
  const trimmed = url.trim();
  if (!trimmed) return { error: "Enter a recipe URL." };

  try {
    const response = await fetch(`/api/recipe-url?url=${encodeURIComponent(trimmed)}`);
    if (!response.ok) return { error: "Recipe URL could not be read." };

    return (await response.json()) as RecipeUrlResult;
  } catch {
    return { error: "Recipe URL lookup is unavailable in this preview. Try the deployed Vercel app." };
  }
}
