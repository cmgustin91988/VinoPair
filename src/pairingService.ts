export type WineStyle = "Red" | "White" | "Rose" | "Orange" | "Sparkling" | "Unknown";
export type WineBody = "Light" | "Medium" | "Medium-full" | "Full" | "Unknown";
export type WineAcidity = "Low" | "Medium" | "Medium-high" | "High" | "Unknown";
export type BudgetRange = "Under $20" | "$20-$40" | "$40-$75" | "$75+";
export type PairingMode = "inventory" | "perfect" | "show_both";
export type OccasionMode = "classic" | "weeknight" | "dinner_party" | "date_night" | "takeout";
export type MealScenario =
  | "salmon"
  | "duck"
  | "thai_curry"
  | "steak"
  | "tomato_pasta"
  | "roast_chicken"
  | "pork"
  | "mushroom"
  | "shellfish"
  | "salad"
  | "generic";

export type Wine = {
  id: string;
  name: string;
  producer?: string;
  vintage?: string;
  region?: string;
  country?: string;
  grape?: string[];
  label_image_url?: string;
  label_image_source?: string;
  style: WineStyle;
  body: WineBody;
  acidity: WineAcidity;
  tannin: "Low" | "Medium" | "Medium-high" | "High" | "Unknown";
  sweetness: "Dry" | "Off-dry" | "Sweet" | "Unknown";
  tags: string[];
  flavor_notes: string[];
  pairing_notes: string[];
  source_matches: WineSourceReference[];
  verification_status: "verified" | "source-linked" | "inferred" | "needs-review";
  quantity: number;
};

export type WineSourceReference = {
  provider: "Vivino" | "Wine-Searcher" | "CellarTracker" | "Open Food Facts" | "Partner API";
  status: "search" | "matched" | "unavailable";
  label: string;
  confidence?: number;
  url: string;
  note: string;
};

export type MealAnalysis = {
  dish_name: string;
  cuisine: string;
  main_ingredients: string[];
  protein: string;
  cooking_method: string;
  sauce: string;
  richness: "low" | "medium" | "medium-high" | "high";
  acidity: "low" | "medium" | "medium-high" | "high";
  spice_level: "low" | "medium" | "high";
  sweetness: "low" | "medium" | "high";
  umami: "low" | "medium" | "high";
  dominant_flavors: string[];
  pairing_considerations: string[];
  pairing_risks: string[];
  scenario: MealScenario;
};

export type UserPreferences = {
  preferred_styles: WineStyle[];
  wine_philosophy: string[];
  flavor_preferences: string[];
  budget_range: BudgetRange;
  budget_min: number;
  budget_max: number;
  avoid: string;
};

export type PairingRecommendation = {
  dish_name: string;
  recommended_style: string;
  specific_suggestion: string;
  reason: string;
  preference_note: string;
  mode_note: string;
  inventory_match?: {
    wine_id: string;
    name: string;
    confidence: number;
    reason: string;
  };
  perfect_pairing: {
    style: string;
    estimated_price: string;
  };
  alternatives: string[];
  avoid: string[];
  occasion_note: string;
  confidence: number;
};

export type WineFoodRecommendation = {
  wine_name: string;
  headline_dish: string;
  reason: string;
  ideal_pairings: string[];
  weeknight_pairings: string[];
  avoid: string[];
  serving_note: string;
  occasion_note: string;
  confidence: number;
};

export type CellarSummary = {
  totalBottles: number;
  styles: Record<string, number>;
  readyStyles: string[];
};

export type LabelScanSuggestion = {
  wine: Wine;
  confidence: number;
  note: string;
  lookupQueries: string[];
  rawText: string;
};

export const starterInventory: Wine[] = [
  {
    id: "wine_001",
    name: "2021 Chablis",
    style: "White",
    body: "Light",
    acidity: "High",
    tannin: "Low",
    sweetness: "Dry",
    tags: ["crisp", "mineral", "seafood-friendly"],
    flavor_notes: ["green apple", "citrus", "chalky mineral", "saline"],
    pairing_notes: ["Excellent with shellfish, salmon, lemon, herbs, and lighter roast chicken."],
    source_matches: [],
    verification_status: "inferred",
    quantity: 1
  },
  {
    id: "wine_002",
    name: "2019 Rioja Reserva",
    style: "Red",
    body: "Medium-full",
    acidity: "Medium",
    tannin: "Medium",
    sweetness: "Dry",
    tags: ["savory", "oak", "red fruit"],
    flavor_notes: ["red cherry", "dried herbs", "vanilla", "savory oak"],
    pairing_notes: ["Best with grilled meats, lamb, tomato sauces, mushrooms, and roasted peppers."],
    source_matches: [],
    verification_status: "inferred",
    quantity: 2
  },
  {
    id: "wine_003",
    name: "NV Brut Champagne",
    style: "Sparkling",
    body: "Medium",
    acidity: "High",
    tannin: "Low",
    sweetness: "Dry",
    tags: ["bubbles", "toast", "citrus"],
    flavor_notes: ["citrus", "green apple", "toast", "chalk"],
    pairing_notes: ["Flexible with seafood, fried foods, salads, creamy sauces, and salty snacks."],
    source_matches: [],
    verification_status: "inferred",
    quantity: 1
  },
  {
    id: "wine_004",
    name: "2022 Natural Orange Wine",
    style: "Orange",
    body: "Medium",
    acidity: "Medium-high",
    tannin: "Medium",
    sweetness: "Dry",
    tags: ["funky", "skin-contact", "biodynamic"],
    flavor_notes: ["dried apricot", "orange peel", "tea", "savory herbs"],
    pairing_notes: ["Good with spice, roasted vegetables, richer fish, pork, and fermented flavors."],
    source_matches: [],
    verification_status: "inferred",
    quantity: 1
  }
];

export const featuredMeals = [
  "Roasted salmon with lemon, dill, and asparagus",
  "Duck confit with cherry gastrique and bitter greens",
  "Spicy Thai green curry with shrimp",
  "Grilled steak with chimichurri and roasted peppers"
];

export const defaultPreferences: UserPreferences = {
  preferred_styles: ["White", "Sparkling"],
  wine_philosophy: ["Natural"],
  flavor_preferences: ["Crisp", "Mineral"],
  budget_range: "$20-$40",
  budget_min: 20,
  budget_max: 45,
  avoid: "no oaky Chardonnay"
};

export function analyzeMeal(input: string): MealAnalysis {
  const cleanInput = normalizeMealInput(input);
  const normalized = cleanInput.toLowerCase();
  const scenario = classifyMealScenario(normalized);

  if (scenario === "salmon") {
    return {
      dish_name: cleanInput || "Roasted salmon with lemon, dill, and asparagus",
      cuisine: "Modern American",
      main_ingredients: pickPresentIngredients(normalized, ["salmon", "lemon", "dill", "asparagus", "fennel", "capers"]),
      protein: "fish",
      cooking_method: detectCookingMethod(normalized, "roasted"),
      sauce: detectSauce(normalized, "lemon herb seasoning"),
      richness: "medium-high",
      acidity: "high",
      spice_level: "low",
      sweetness: "low",
      umami: "medium",
      dominant_flavors: ["citrus", "herbal", "green", "rich fish"],
      pairing_considerations: [
        "Lemon asks for a wine with bright acidity.",
        "Dill loves herbal or mineral notes.",
        "Asparagus can make heavy oak taste clumsy."
      ],
      pairing_risks: ["Avoid heavy oak.", "Avoid very tannic reds."],
      scenario
    };
  }

  if (scenario === "duck") {
    return {
      dish_name: cleanInput || "Duck confit with cherry gastrique and bitter greens",
      cuisine: "French bistro",
      main_ingredients: pickPresentIngredients(normalized, ["duck", "cherry", "gastrique", "bitter greens", "orange", "lentils"]),
      protein: "duck",
      cooking_method: detectCookingMethod(normalized, "slow-cooked then crisped"),
      sauce: detectSauce(normalized, "sweet-tart fruit sauce"),
      richness: "high",
      acidity: "medium-high",
      spice_level: "low",
      sweetness: "medium",
      umami: "high",
      dominant_flavors: ["savory", "tart cherry", "bitter greens", "crispy fat"],
      pairing_considerations: [
        "Duck needs freshness to cut through richness.",
        "Cherry sauce pairs beautifully with red-fruited wines.",
        "Bitterness works best with moderate tannin."
      ],
      pairing_risks: ["Avoid very heavy Cabernet Sauvignon.", "Avoid flat, low-acid reds."],
      scenario
    };
  }

  if (scenario === "thai_curry") {
    return {
      dish_name: cleanInput || "Spicy Thai green curry with shrimp",
      cuisine: "Thai",
      main_ingredients: pickPresentIngredients(normalized, ["shrimp", "green curry", "coconut milk", "basil", "lemongrass", "chile"]),
      protein: hasAny(normalized, ["shrimp", "prawn"]) ? "shrimp" : "mixed",
      cooking_method: "simmered",
      sauce: detectSauce(normalized, "spicy coconut curry"),
      richness: "medium-high",
      acidity: "medium",
      spice_level: "high",
      sweetness: "medium",
      umami: "medium",
      dominant_flavors: ["spicy", "coconut", "lemongrass", "herbal", "briny"],
      pairing_considerations: [
        "A touch of sweetness calms chile heat.",
        "Bubbles or high acidity refresh the coconut richness.",
        "Aromatic whites echo the herbs without fighting them."
      ],
      pairing_risks: ["Avoid high-tannin reds.", "Avoid very high-alcohol wines."],
      scenario
    };
  }

  if (scenario === "steak") {
    return {
      dish_name: cleanInput || "Grilled steak with chimichurri and roasted peppers",
      cuisine: "Argentinian-inspired",
      main_ingredients: pickPresentIngredients(normalized, ["steak", "beef", "chimichurri", "roasted peppers", "garlic", "herbs"]),
      protein: "beef",
      cooking_method: detectCookingMethod(normalized, "grilled"),
      sauce: detectSauce(normalized, "garlic-herb chimichurri"),
      richness: "high",
      acidity: "medium-high",
      spice_level: "medium",
      sweetness: "low",
      umami: "high",
      dominant_flavors: ["charred", "herbal", "garlic", "savory", "peppery"],
      pairing_considerations: [
        "Steak can handle structure and tannin.",
        "Chimichurri needs freshness so the wine does not feel heavy.",
        "Roasted peppers welcome savory red fruit."
      ],
      pairing_risks: ["Avoid very light whites.", "Avoid low-acid heavy reds."],
      scenario
    };
  }

  if (scenario === "tomato_pasta") {
    return {
      dish_name: cleanInput || "Tomato-based pasta",
      cuisine: "Italian-inspired",
      main_ingredients: pickPresentIngredients(normalized, ["pasta", "tomato", "garlic", "basil", "parmesan", "sausage", "meatballs"]),
      protein: hasAny(normalized, ["sausage", "meatball", "beef", "pork"]) ? "meat" : "vegetarian",
      cooking_method: detectCookingMethod(normalized, "simmered"),
      sauce: detectSauce(normalized, "tomato sauce"),
      richness: hasAny(normalized, ["cream", "sausage", "meatball", "cheese"]) ? "medium-high" : "medium",
      acidity: "medium-high",
      spice_level: hasAny(normalized, ["arrabbiata", "chile", "spicy"]) ? "medium" : "low",
      sweetness: "low",
      umami: "high",
      dominant_flavors: ["tomato", "garlic", "herbs", "savory"],
      pairing_considerations: [
        "Tomato sauce needs a wine with enough acidity.",
        "Moderate tannin works better than a very heavy red.",
        "Herbs and garlic point toward savory Italian reds."
      ],
      pairing_risks: ["Avoid low-acid, heavily oaked reds.", "Avoid sweet whites with tomato sauce."],
      scenario
    };
  }

  if (scenario === "roast_chicken") {
    return {
      dish_name: cleanInput || "Roast chicken with herbs",
      cuisine: "Comfort cooking",
      main_ingredients: pickPresentIngredients(normalized, ["chicken", "lemon", "thyme", "rosemary", "garlic", "potatoes", "mushrooms"]),
      protein: "chicken",
      cooking_method: detectCookingMethod(normalized, "roasted"),
      sauce: detectSauce(normalized, "pan juices and herbs"),
      richness: "medium",
      acidity: hasAny(normalized, ["lemon", "vinegar"]) ? "medium-high" : "medium",
      spice_level: "low",
      sweetness: "low",
      umami: hasAny(normalized, ["mushroom", "gravy"]) ? "high" : "medium",
      dominant_flavors: ["roasted", "herbal", "savory"],
      pairing_considerations: [
        "Roast chicken is flexible but wants medium body.",
        "Herbs favor Chardonnay, Pinot Noir, or savory whites.",
        "Lemon or vinegar calls for extra freshness."
      ],
      pairing_risks: ["Avoid overpowering tannic reds.", "Avoid very sweet wines."],
      scenario
    };
  }

  if (scenario === "pork") {
    return {
      dish_name: cleanInput || "Pork with savory or fruit notes",
      cuisine: "Flexible",
      main_ingredients: pickPresentIngredients(normalized, ["pork", "apple", "mustard", "fennel", "cabbage", "cherry", "sage"]),
      protein: "pork",
      cooking_method: detectCookingMethod(normalized, "roasted"),
      sauce: detectSauce(normalized, "savory pan sauce"),
      richness: "medium-high",
      acidity: hasAny(normalized, ["apple", "mustard", "vinegar", "slaw"]) ? "medium-high" : "medium",
      spice_level: hasAny(normalized, ["spicy", "chile"]) ? "medium" : "low",
      sweetness: hasAny(normalized, ["apple", "cherry", "maple", "glaze"]) ? "medium" : "low",
      umami: "medium",
      dominant_flavors: ["savory", "roasted", "light fruit"],
      pairing_considerations: [
        "Pork works well with bright reds and textured whites.",
        "Fruit or glaze needs freshness rather than heavy oak.",
        "Mustard and vinegar reward high acidity."
      ],
      pairing_risks: ["Avoid very tannic reds.", "Avoid flat low-acid whites."],
      scenario
    };
  }

  if (scenario === "mushroom") {
    return {
      dish_name: cleanInput || "Mushroom-forward dish",
      cuisine: "Earthy",
      main_ingredients: pickPresentIngredients(normalized, ["mushroom", "risotto", "truffle", "thyme", "cream", "parmesan", "polenta"]),
      protein: "mushroom",
      cooking_method: detectCookingMethod(normalized, "sauteed"),
      sauce: detectSauce(normalized, "earthy mushroom sauce"),
      richness: hasAny(normalized, ["cream", "risotto", "butter", "cheese"]) ? "medium-high" : "medium",
      acidity: "medium",
      spice_level: "low",
      sweetness: "low",
      umami: "high",
      dominant_flavors: ["earthy", "savory", "umami"],
      pairing_considerations: [
        "Earthy flavors pair naturally with Pinot Noir and Nebbiolo.",
        "Creamy mushroom dishes need acidity to stay lifted.",
        "Avoid wines that are too fruity and simple."
      ],
      pairing_risks: ["Avoid very oaky whites.", "Avoid sweet wines."],
      scenario
    };
  }

  if (scenario === "shellfish") {
    return {
      dish_name: cleanInput || "Shellfish with bright sauce",
      cuisine: "Coastal",
      main_ingredients: pickPresentIngredients(normalized, ["shrimp", "scallop", "lobster", "crab", "clam", "mussel", "lemon", "garlic"]),
      protein: "shellfish",
      cooking_method: detectCookingMethod(normalized, "seared or steamed"),
      sauce: detectSauce(normalized, "lemon garlic sauce"),
      richness: hasAny(normalized, ["lobster", "butter", "cream"]) ? "medium-high" : "medium",
      acidity: hasAny(normalized, ["lemon", "lime", "vinegar"]) ? "high" : "medium-high",
      spice_level: hasAny(normalized, ["spicy", "chile"]) ? "medium" : "low",
      sweetness: "low",
      umami: "medium",
      dominant_flavors: ["briny", "citrus", "delicate"],
      pairing_considerations: [
        "Shellfish wants freshness and minimal tannin.",
        "Butter or cream can handle richer whites.",
        "Citrus and briny flavors reward mineral wines."
      ],
      pairing_risks: ["Avoid tannic reds.", "Avoid heavy oak with delicate shellfish."],
      scenario
    };
  }

  if (scenario === "salad") {
    return {
      dish_name: cleanInput || "Bright salad or vegetable dish",
      cuisine: "Fresh",
      main_ingredients: pickPresentIngredients(normalized, ["salad", "greens", "goat cheese", "vinaigrette", "beets", "tomato", "asparagus"]),
      protein: hasAny(normalized, ["chicken", "salmon", "shrimp"]) ? "light protein" : "vegetables",
      cooking_method: "fresh",
      sauce: detectSauce(normalized, "vinaigrette"),
      richness: hasAny(normalized, ["cheese", "avocado", "nuts"]) ? "medium" : "low",
      acidity: "high",
      spice_level: "low",
      sweetness: hasAny(normalized, ["fruit", "beets", "honey"]) ? "medium" : "low",
      umami: "low",
      dominant_flavors: ["green", "tart", "fresh"],
      pairing_considerations: [
        "Vinaigrette needs a wine with high acidity.",
        "Green vegetables work best with crisp whites or dry sparkling.",
        "Delicate flavors can be overwhelmed by oak or tannin."
      ],
      pairing_risks: ["Avoid heavy tannic reds.", "Avoid buttery oaked whites."],
      scenario
    };
  }

  return {
    dish_name: cleanInput || "Dinner description",
    cuisine: "Flexible",
    main_ingredients: extractKeywords(cleanInput),
    protein: detectProtein(normalized),
    cooking_method: detectCookingMethod(normalized, "not specified"),
    sauce: detectSauce(normalized, "not specified"),
    richness: detectRichness(normalized),
    acidity: detectAcidity(normalized),
    spice_level: detectSpice(normalized),
    sweetness: "low",
    umami: "medium",
    dominant_flavors: ["savory", "balanced", "comforting"],
    pairing_considerations: [
      "Match the wine's intensity to the dish.",
      "Choose enough acidity to keep the pairing lively.",
      "Let your preferences decide the final style."
    ],
    pairing_risks: ["Avoid wines that are much heavier than the food."],
    scenario
  };
}

export function recommendPairing(
  meal: MealAnalysis,
  preferences: UserPreferences,
  inventory: Wine[],
  mode: PairingMode,
  occasion: OccasionMode = "classic"
): PairingRecommendation {
  const base = getScenarioRecommendation(meal.scenario);
  const inventoryMatch = findInventoryMatch(meal.scenario, preferences, inventory);
  const occasionAdjusted = applyOccasionToMealPairing(base, meal.scenario, occasion);
  const alternatives = prioritizeAlternatives(occasionAdjusted.alternatives, preferences);
  const preferenceNote = buildPreferenceNote(preferences, alternatives[0]);
  const avoid = [...occasionAdjusted.avoid];

  if (preferences.avoid.trim()) {
    avoid.unshift(preferences.avoid.trim());
  }

  return {
    dish_name: meal.dish_name,
    recommended_style: occasionAdjusted.recommended_style,
    specific_suggestion: occasionAdjusted.specific_suggestion,
    reason: `${occasionAdjusted.reason} ${preferenceNote}`,
    preference_note: preferenceNote,
    mode_note: getModeNote(mode, inventoryMatch?.name, occasionAdjusted.perfect_pairing),
    inventory_match: inventoryMatch,
    perfect_pairing: {
      style: occasionAdjusted.perfect_pairing,
      estimated_price: priceForBudget(preferences)
    },
    alternatives,
    avoid: Array.from(new Set(avoid)).slice(0, 4),
    occasion_note: occasionAdjusted.occasion_note,
    confidence: inventoryMatch ? Math.max(occasionAdjusted.confidence, inventoryMatch.confidence) : occasionAdjusted.confidence
  };
}

export function recommendFoodForWine(wine: Wine, occasion: OccasionMode = "classic"): WineFoodRecommendation {
  const text = `${wine.name} ${wine.style} ${wine.body} ${wine.acidity} ${wine.tannin} ${wine.sweetness} ${wine.region ?? ""} ${wine.country ?? ""} ${(wine.grape ?? []).join(" ")} ${wine.tags.join(" ")} ${wine.flavor_notes.join(" ")}`.toLowerCase();
  const finish = (recommendation: Omit<WineFoodRecommendation, "occasion_note">): WineFoodRecommendation =>
    applyOccasionToWineFood(recommendation, occasion);

  if (wine.style === "Sparkling" || hasAny(text, ["champagne", "brut", "cava", "prosecco", "bubbles"])) {
    return finish({
      wine_name: wine.name,
      headline_dish: "Fried chicken with lemon aioli",
      reason:
        "High-acid bubbles cut salt and fat beautifully, while citrus and toast notes make fried or briny foods feel sharper and more elegant.",
      ideal_pairings: [
        "Fried chicken with lemon aioli",
        "Oysters or shrimp cocktail",
        "Triple-cream cheese with potato chips",
        "Sushi with tempura or crispy rice"
      ],
      weeknight_pairings: ["Fish tacos", "Caesar salad", "Popcorn with parmesan", "Herb omelet"],
      avoid: ["Very spicy chile-heavy dishes", "Heavy red meat braises", "Very sweet desserts unless the wine is sweet"],
      serving_note: "Serve well chilled in a white-wine glass rather than a narrow flute if the wine has depth.",
      confidence: confidenceForWine(wine, 0.92)
    });
  }

  if (wine.style === "White" && (wine.acidity === "High" || hasAny(text, ["chablis", "sancerre", "sauvignon", "muscadet", "albarino", "mineral", "crisp"]))) {
    return finish({
      wine_name: wine.name,
      headline_dish: "Roasted salmon with lemon, dill, and asparagus",
      reason:
        "A crisp white with high acidity loves lemon, herbs, seafood, and green vegetables; the wine keeps richer fish lifted without adding weight.",
      ideal_pairings: [
        "Roasted salmon with lemon, dill, and asparagus",
        "Goat cheese salad with vinaigrette",
        "Scallops with citrus butter",
        "Herby roast chicken"
      ],
      weeknight_pairings: ["Shrimp pasta with garlic and lemon", "Chicken piccata", "Fish tacos", "Vegetable risotto"],
      avoid: ["Charred steak", "Sweet barbecue sauce", "Very creamy low-acid dishes"],
      serving_note: "Serve chilled but not icy so mineral and citrus notes stay expressive.",
      confidence: confidenceForWine(wine, 0.9)
    });
  }

  if (wine.style === "White") {
    return finish({
      wine_name: wine.name,
      headline_dish: "Roast chicken with herbs and pan jus",
      reason:
        "Medium-bodied whites work best with moderate richness, roasted poultry, butter, herbs, and gentle savory sauces.",
      ideal_pairings: [
        "Roast chicken with herbs and pan jus",
        "Pork tenderloin with apple and mustard",
        "Mushroom risotto",
        "Lobster or crab with butter"
      ],
      weeknight_pairings: ["Chicken pot pie", "Creamy pasta with peas", "Turkey sandwich with aioli", "Baked cod"],
      avoid: ["Very tart vinaigrettes", "High-tannin red-meat pairings", "Aggressively spicy curries"],
      serving_note: "Serve lightly chilled; richer whites open up after 10 minutes out of the fridge.",
      confidence: confidenceForWine(wine, 0.84)
    });
  }

  if (wine.style === "Rose") {
    return finish({
      wine_name: wine.name,
      headline_dish: "Grilled shrimp with tomato, herbs, and aioli",
      reason:
        "Dry rose bridges fresh whites and light reds, so it handles seafood, tomatoes, herbs, pork, and picnic foods with ease.",
      ideal_pairings: [
        "Grilled shrimp with tomato, herbs, and aioli",
        "Nicoise salad",
        "Pork chops with peach salsa",
        "Margherita pizza"
      ],
      weeknight_pairings: ["Turkey burgers", "Tuna salad toast", "Charcuterie board", "Pesto pasta"],
      avoid: ["Very heavy steak", "Sugary desserts", "Deeply smoky barbecue"],
      serving_note: "Serve chilled; let fuller rose warm slightly if it tastes muted.",
      confidence: confidenceForWine(wine, 0.84)
    });
  }

  if (wine.style === "Orange") {
    return finish({
      wine_name: wine.name,
      headline_dish: "Spiced pork with roasted squash and yogurt",
      reason:
        "Skin-contact texture, savory notes, and gentle tannin make orange wine excellent with spice, fermented flavors, roasted vegetables, and richer white meats.",
      ideal_pairings: [
        "Spiced pork with roasted squash and yogurt",
        "Chicken shawarma with tahini",
        "Roasted cauliflower with harissa",
        "Aged cheeses and olives"
      ],
      weeknight_pairings: ["Falafel bowl", "Miso-glazed salmon", "Kimchi fried rice", "Sausage with peppers"],
      avoid: ["Very delicate raw seafood", "Sweet desserts", "Huge tannic red-meat dishes"],
      serving_note: "Serve cellar-cool rather than ice-cold so the texture and aromatics show.",
      confidence: confidenceForWine(wine, 0.86)
    });
  }

  if (
    wine.style === "Red" &&
    hasAny(text, [
      "chianti",
      "sangiovese",
      "barbera",
      "dolcetto",
      "montepulciano",
      "nero d'avola",
      "etna",
      "tuscany",
      "tuscan"
    ])
  ) {
    return finish({
      wine_name: wine.name,
      headline_dish: "Rigatoni with tomato, sausage, and pecorino",
      reason:
        "High-acid Italian reds are built for tomato. Chianti and Sangiovese especially echo red sauce, herbs, garlic, and salty cheese while keeping richer pasta from feeling heavy.",
      ideal_pairings: [
        "Rigatoni with tomato, sausage, and pecorino",
        "Spaghetti and meatballs in red sauce",
        "Margherita or sausage pizza",
        "Chicken parmesan"
      ],
      weeknight_pairings: ["Baked ziti", "Pasta all'arrabbiata", "Tomato-braised white beans", "Eggplant parmesan"],
      avoid: ["Delicate raw seafood", "Sweet barbecue sauce", "Creamy low-acid sauces without tomato"],
      serving_note: "Serve slightly cool; bright Italian reds taste fresher with tomato when alcohol stays tucked in.",
      confidence: confidenceForWine(wine, hasAny(text, ["chianti", "sangiovese"]) ? 0.94 : 0.9)
    });
  }

  if (wine.style === "Red" && hasAny(text, ["pinot", "gamay", "beaujolais", "mencia"])) {
    return finish({
      wine_name: wine.name,
      headline_dish: "Roast chicken with mushrooms and thyme",
      reason:
        "Light, aromatic reds do best with savory lift rather than heavy char; mushrooms, herbs, poultry, and gentle fruit sauces pull out their earth and red fruit.",
      ideal_pairings: [
        "Roast chicken with mushrooms and thyme",
        "Duck with cherry sauce and bitter greens",
        "Mushroom risotto",
        "Seared salmon with lentils"
      ],
      weeknight_pairings: ["Mushroom pizza", "Turkey meatballs", "Pork tenderloin with mustard", "Charcuterie and hard cheese"],
      avoid: ["Very sweet glazes", "Huge grilled steaks", "Creamy dishes with lots of lemon"],
      serving_note: "Serve lightly cool to keep red fruit bright and the finish clean.",
      confidence: confidenceForWine(wine, 0.9)
    });
  }

  if (wine.style === "Red" && hasAny(text, ["rioja", "tempranillo", "garnacha", "grenache"])) {
    return finish({
      wine_name: wine.name,
      headline_dish: "Lamb meatballs with smoky tomato and peppers",
      reason:
        "Rioja and Tempranillo like savory red fruit, roasted peppers, lamb, paprika, and tomato. The best pairings bring warmth and umami without overwhelming the wine.",
      ideal_pairings: [
        "Lamb meatballs with smoky tomato and peppers",
        "Roast pork with paprika and potatoes",
        "Chorizo and manchego flatbread",
        "Mushroom paella"
      ],
      weeknight_pairings: ["Sausage pizza", "Beef tacos", "Patatas bravas", "Turkey chili with tomatoes"],
      avoid: ["Raw oysters", "Very spicy Thai curry", "Sweet glazed dishes"],
      serving_note: "Serve just under room temperature; older Rioja can use a short decant.",
      confidence: confidenceForWine(wine, 0.9)
    });
  }

  if (wine.style === "Red" && (wine.body === "Medium-full" || wine.body === "Full" || hasAny(text, ["cabernet", "malbec", "syrah", "structured", "tannin"]))) {
    return finish({
      wine_name: wine.name,
      headline_dish: "Grilled steak with chimichurri and roasted peppers",
      reason:
        "A structured red needs protein, char, and savory depth; herbs and peppers add freshness so the pairing does not feel too heavy.",
      ideal_pairings: [
        "Grilled steak with chimichurri and roasted peppers",
        "Lamb chops with rosemary",
        "Short rib ragu",
        "Mushroom and gruyere burger"
      ],
      weeknight_pairings: ["Cheeseburger", "Beef tacos", "Sausage pizza", "Lentil stew with smoked paprika"],
      avoid: ["Delicate white fish", "Vinaigrette-heavy salads", "Very spicy Thai curry"],
      serving_note: "Serve just below room temperature; a 20-minute chill can make tannin feel cleaner.",
      confidence: confidenceForWine(wine, 0.9)
    });
  }

  if (wine.style === "Red") {
    return finish({
      wine_name: wine.name,
      headline_dish: "Duck with cherry sauce and bitter greens",
      reason:
        "Light-to-medium reds shine with savory foods that have fruit, herbs, earth, or gentle richness without overwhelming tannin.",
      ideal_pairings: [
        "Duck with cherry sauce and bitter greens",
        "Mushroom risotto",
        "Roast chicken with thyme",
        "Pork tenderloin with mustard"
      ],
      weeknight_pairings: ["Turkey meatballs", "Mushroom pizza", "Salmon with lentils", "Charcuterie and hard cheese"],
      avoid: ["Very sweet glazes", "Raw oysters", "Creamy dishes with lots of lemon"],
      serving_note: "Serve lightly cool to keep red fruit bright and alcohol tucked in.",
      confidence: confidenceForWine(wine, 0.86)
    });
  }

  return finish({
    wine_name: wine.name,
    headline_dish: "Roast chicken with herbs, lemon, and potatoes",
    reason:
      "The safest route is a flexible, savory dish with moderate richness, enough acidity, and no extreme sweetness or spice.",
    ideal_pairings: [
      "Roast chicken with herbs, lemon, and potatoes",
      "Mushroom pasta",
      "Charcuterie with cheese and olives",
      "Seared salmon with greens"
    ],
    weeknight_pairings: ["Pizza", "Grain bowl with roasted vegetables", "Chicken sandwich", "Herby omelet"],
    avoid: ["Very sweet desserts", "Extremely spicy dishes", "Foods much heavier than the wine"],
    serving_note: "Verify the wine style for a sharper pairing; this recommendation uses the current inferred profile.",
    confidence: confidenceForWine(wine, 0.72)
  });
}

function applyOccasionToMealPairing(
  base: ReturnType<typeof getScenarioRecommendation>,
  scenario: MealScenario,
  occasion: OccasionMode
) {
  const clone = {
    ...base,
    alternatives: [...base.alternatives],
    avoid: [...base.avoid],
    occasion_note: "Classic mode keeps the pairing anchored to the dish."
  };

  if (occasion === "weeknight") {
    return {
      ...clone,
      specific_suggestion: weeknightBottleForScenario(scenario, clone.specific_suggestion),
      perfect_pairing: weeknightBottleForScenario(scenario, clone.perfect_pairing),
      alternatives: uniqueList([weeknightBottleForScenario(scenario, "easy-to-find bottle"), ...clone.alternatives]),
      reason: `${clone.reason} I kept this in weeknight mode, so the pick favors bottles that are easy to find and forgiving at the table.`,
      occasion_note: "Weeknight mode favors practical, flexible bottles over rare benchmark picks.",
      confidence: Math.min(0.96, clone.confidence + 0.01)
    };
  }

  if (occasion === "dinner_party") {
    return {
      ...clone,
      specific_suggestion: dinnerPartyBottleForScenario(scenario, clone.specific_suggestion),
      perfect_pairing: dinnerPartyBottleForScenario(scenario, clone.perfect_pairing),
      alternatives: uniqueList([dinnerPartyBottleForScenario(scenario, "special bottle"), ...clone.alternatives]),
      reason: `${clone.reason} For a dinner party, I leaned toward a bottle with more presence and a little more conversation value.`,
      occasion_note: "Dinner party mode favors elevated, memorable bottles that still fit the food.",
      confidence: Math.min(0.96, clone.confidence + 0.02)
    };
  }

  if (occasion === "date_night") {
    return {
      ...clone,
      alternatives: uniqueList([dateNightBottleForScenario(scenario), ...clone.alternatives]),
      reason: `${clone.reason} Date night mode favors smoother textures, aromatic lift, and pairings that feel polished without becoming heavy.`,
      occasion_note: "Date night mode nudges toward elegant, softer-edged pairings.",
      confidence: clone.confidence
    };
  }

  if (occasion === "takeout") {
    return {
      ...clone,
      specific_suggestion: takeoutBottleForScenario(scenario, clone.specific_suggestion),
      perfect_pairing: takeoutBottleForScenario(scenario, clone.perfect_pairing),
      alternatives: uniqueList([takeoutBottleForScenario(scenario, "chilled red or bubbles"), ...clone.alternatives]),
      avoid: uniqueList(["Very high-alcohol wines", ...clone.avoid]),
      reason: `${clone.reason} Takeout mode favors high refreshment, lower friction, and wines that handle salt, spice, and mixed flavors.`,
      occasion_note: "Takeout mode prioritizes chillable, flexible, high-refreshment bottles.",
      confidence: Math.min(0.96, clone.confidence + 0.01)
    };
  }

  return clone;
}

function applyOccasionToWineFood(
  recommendation: Omit<WineFoodRecommendation, "occasion_note">,
  occasion: OccasionMode
): WineFoodRecommendation {
  if (occasion === "weeknight") {
    return {
      ...recommendation,
      headline_dish: recommendation.weeknight_pairings[0] ?? recommendation.headline_dish,
      reason: `${recommendation.reason} I shifted this toward weeknight mode, so the lead dish is lower-effort and pantry-friendly.`,
      occasion_note: "Weeknight mode promotes the easiest strong match.",
      confidence: Math.min(0.96, recommendation.confidence + 0.01)
    };
  }

  if (occasion === "dinner_party") {
    return {
      ...recommendation,
      headline_dish: recommendation.ideal_pairings[0],
      ideal_pairings: uniqueList([
        recommendation.ideal_pairings[0],
        "Cheese, olives, and a small first bite built around the wine",
        ...recommendation.ideal_pairings.slice(1)
      ]).slice(0, 4),
      reason: `${recommendation.reason} Dinner party mode adds a more composed first bite and keeps the main pairing guest-ready.`,
      occasion_note: "Dinner party mode turns the pairing into a more hosted experience.",
      confidence: Math.min(0.96, recommendation.confidence + 0.02)
    };
  }

  if (occasion === "date_night") {
    return {
      ...recommendation,
      ideal_pairings: uniqueList([
        recommendation.ideal_pairings[0],
        "A shared cheese and charcuterie plate",
        ...recommendation.ideal_pairings.slice(1)
      ]).slice(0, 4),
      reason: `${recommendation.reason} Date night mode keeps the food generous, shareable, and not too heavy.`,
      occasion_note: "Date night mode favors shareable, elegant pairings.",
      confidence: recommendation.confidence
    };
  }

  if (occasion === "takeout") {
    return {
      ...recommendation,
      headline_dish: takeoutFoodForWine(recommendation),
      weeknight_pairings: uniqueList([takeoutFoodForWine(recommendation), ...recommendation.weeknight_pairings]).slice(0, 4),
      reason: `${recommendation.reason} Takeout mode looks for salt, crunch, sauce, and easy intensity that the wine can refresh.`,
      occasion_note: "Takeout mode highlights casual food that still makes the wine taste intentional.",
      confidence: Math.min(0.96, recommendation.confidence + 0.01)
    };
  }

  return {
    ...recommendation,
    occasion_note: "Classic mode keeps the food match centered on wine structure."
  };
}

function weeknightBottleForScenario(scenario: MealScenario, fallback: string) {
  const suggestions: Partial<Record<MealScenario, string>> = {
    salmon: "Sauvignon Blanc or unoaked Chablis",
    duck: "Pinot Noir or Cru Beaujolais",
    thai_curry: "Off-dry Riesling",
    steak: "Malbec or Cabernet Franc",
    tomato_pasta: "Chianti or Barbera",
    roast_chicken: "Chardonnay or Pinot Noir",
    pork: "Gamay or dry Riesling",
    mushroom: "Pinot Noir or Chenin Blanc",
    shellfish: "Muscadet or Albarino",
    salad: "Sauvignon Blanc or dry sparkling"
  };

  return suggestions[scenario] ?? fallback;
}

function dinnerPartyBottleForScenario(scenario: MealScenario, fallback: string) {
  const suggestions: Partial<Record<MealScenario, string>> = {
    salmon: "Sancerre or grower Champagne",
    duck: "Burgundy Pinot Noir or aged Barbera",
    thai_curry: "Vouvray demi-sec or sparkling Chenin Blanc",
    steak: "Northern Rhone Syrah or Cabernet Franc",
    tomato_pasta: "Chianti Classico Riserva or Etna Rosso",
    roast_chicken: "White Burgundy or aged Rioja Blanco",
    pork: "Cru Beaujolais or dry Alsace Riesling",
    mushroom: "Nebbiolo or mature Pinot Noir",
    shellfish: "Premier Cru Chablis or grower Champagne",
    salad: "Sancerre or vintage sparkling"
  };

  return suggestions[scenario] ?? fallback;
}

function dateNightBottleForScenario(scenario: MealScenario) {
  const suggestions: Partial<Record<MealScenario, string>> = {
    salmon: "Sancerre",
    duck: "silky Pinot Noir",
    thai_curry: "off-dry Riesling",
    steak: "Cabernet Franc",
    tomato_pasta: "Chianti Classico",
    roast_chicken: "White Burgundy",
    pork: "Gamay",
    mushroom: "Pinot Noir",
    shellfish: "Champagne",
    salad: "dry rose"
  };

  return suggestions[scenario] ?? "dry sparkling wine";
}

function takeoutBottleForScenario(scenario: MealScenario, fallback: string) {
  const suggestions: Partial<Record<MealScenario, string>> = {
    thai_curry: "off-dry Riesling or pet-nat",
    tomato_pasta: "chilled Barbera or Lambrusco secco",
    steak: "Malbec or chilled Rioja",
    shellfish: "Muscadet or dry sparkling",
    salad: "Sauvignon Blanc",
    mushroom: "chilled Gamay",
    pork: "Lambrusco secco or Gamay",
    roast_chicken: "Chardonnay or chilled red",
    salmon: "Sauvignon Blanc or sparkling wine",
    duck: "Gamay or Pinot Noir"
  };

  return suggestions[scenario] ?? fallback;
}

function takeoutFoodForWine(recommendation: Pick<WineFoodRecommendation, "weeknight_pairings" | "ideal_pairings">) {
  return (
    recommendation.weeknight_pairings.find((item) => /pizza|tacos|sandwich|burger|bowl|fried|pasta|salad/i.test(item)) ??
    recommendation.weeknight_pairings[0] ??
    recommendation.ideal_pairings[0]
  );
}

export async function callOciGenerativeAi(_prompt: string) {
  // Replace the local response with an OCI Generative AI inference call.
  // OCI Generative AI would power meal extraction and pairing recommendation.
  // OCI Vision would extract text from menu screenshots before analysis.
  // Oracle Autonomous Database would persist inventory and user preferences.
  // Optional vector search could match messy dish descriptions to pairing knowledge.
  return null;
}

export function normalizeMealInput(rawInput: string): string {
  const compact = rawInput
    .replace(/\r/g, "\n")
    .replace(/[•*]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (compact.length <= 180 && !/\b(ingredients|instructions|method|directions|nutrition)\b/i.test(compact)) {
    return compact;
  }

  const lines = rawInput
    .split(/\n+/)
    .map((line) =>
      line
        .replace(/[•*]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean)
    .filter((line) => !/^(ingredients|instructions|method|directions|nutrition|prep time|cook time|serves|yield)\b/i.test(line))
    .filter((line) => !/^\d+(\.\d+)?\s*(g|kg|oz|lb|lbs|cup|cups|tbsp|tsp|ml|l)\b/i.test(line))
    .filter((line) => !/\b(calories|protein|carbs|fat|sodium)\b/i.test(line));
  const title = pickDishTitle(lines);
  const ingredientTerms = extractMealTerms(lines.join(" "));
  const descriptor = ingredientTerms.length ? ` with ${ingredientTerms.slice(0, 7).join(", ")}` : "";
  const normalized = `${title || lines[0] || compact.slice(0, 120)}${descriptor}`.trim();

  return normalized.length > 220 ? `${normalized.slice(0, 217)}...` : normalized;
}

export function createWineFromText(input: string, index: number): Wine {
  const quantityMatch = input.match(/(\d+)\s*(bottle|bottles|x)/i);
  const quantity = quantityMatch ? Math.max(1, Number(quantityMatch[1])) : 1;
  const name = input
    .replace(/,\s*\d+\s*(bottle|bottles)\b/i, "")
    .replace(/\s+x\s*\d+\b/i, "")
    .trim();
  const inferred = inferWineAttributes(name || input);
  const facts = inferWineFacts(name || input);

  return {
    id: `wine_${Date.now()}_${index}`,
    name: name || input.trim(),
    ...inferred,
    ...facts,
    source_matches: [],
    verification_status: /^review label photo$/i.test(name || input.trim()) ? "needs-review" : "inferred",
    quantity
  };
}

export function ensureWineAnalysis(wine: Wine, index: number): Wine {
  if (
    wine.flavor_notes?.length &&
    wine.pairing_notes?.length &&
    Array.isArray(wine.source_matches) &&
    wine.verification_status
  ) {
    return wine;
  }

  const inferred = createWineFromText(wine.name, index);
  return {
    ...inferred,
    ...wine,
    flavor_notes: wine.flavor_notes?.length ? wine.flavor_notes : inferred.flavor_notes,
    pairing_notes: wine.pairing_notes?.length ? wine.pairing_notes : inferred.pairing_notes,
    label_image_url: wine.label_image_url,
    label_image_source: wine.label_image_source,
    source_matches: Array.isArray(wine.source_matches) ? wine.source_matches : [],
    verification_status: wine.verification_status ?? inferred.verification_status
  };
}

export function identifyWineFromImageName(fileName: string, index: number): LabelScanSuggestion {
  const labelText = cleanImageFileName(fileName);
  return identifyWineFromLabelText("", labelText, index);
}

export function identifyWineFromLabelText(
  labelText: string,
  fallbackName: string,
  index: number
): LabelScanSuggestion {
  const extracted = extractWineDetailsFromLabel(labelText);
  const extractedName = extracted.name;
  const fallbackText = cleanImageFileName(fallbackName);
  const labelTextForWine = extractedName || fallbackText;
  const needsReview = !extractedName && isGenericImageName(fallbackText);
  const baseName = needsReview || !labelTextForWine ? "Review label photo" : labelTextForWine;
  const wine = createWineFromText(baseName, index);
  const knownStyle = wine.style !== "Unknown";
  const lookupQueries = buildLabelLookupQueries(extracted, fallbackText);

  return {
    wine: {
      ...wine,
      name: extractedName || wine.name,
      producer: extracted.producer || wine.producer,
      vintage: extracted.vintage || wine.vintage,
      tags: Array.from(new Set([...wine.tags.filter((tag) => tag !== "AI can infer attributes"), "label scan"]))
    },
    lookupQueries,
    rawText: extracted.rawText,
    confidence: needsReview ? 0.48 : knownStyle ? 0.86 : 0.68,
    note: extractedName
      ? "Read label text from the photo and prepared source lookup candidates."
      : needsReview
        ? "The photo was loaded, but the scan needs a clearer label. Review the name before adding."
      : knownStyle
        ? "Recognized enough label context to infer style and structure."
        : "Found label text, but style details need review."
  };
}

export function summarizeCellar(inventory: Wine[]): CellarSummary {
  const styles = inventory.reduce<Record<string, number>>((totals, wine) => {
    totals[wine.style] = (totals[wine.style] ?? 0) + wine.quantity;
    return totals;
  }, {});
  const readyStyles = Object.entries(styles)
    .filter(([style, count]) => style !== "Unknown" && count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([style]) => style);

  return {
    totalBottles: inventory.reduce((total, wine) => total + wine.quantity, 0),
    styles,
    readyStyles
  };
}

function cleanImageFileName(fileName: string) {
  return fileName
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\b(label|wine|bottle|photo|scan)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type ExtractedLabelDetails = {
  name: string;
  producer?: string;
  vintage?: string;
  appellation?: string;
  variety?: string;
  rawText: string;
};

function extractWineDetailsFromLabel(labelText: string): ExtractedLabelDetails {
  const lines = normalizeLabelText(labelText)
    .split(/\n+/)
    .map((line) =>
      line
        .replace(/[^a-zA-Z0-9\s'&.,-]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter((line) => line.length >= 3)
    .filter((line) => !/^\d+(\.\d+)?\s*%/.test(line))
    .filter((line) => !/\b(contains|sulfites|alcohol|government|warning|750\s*ml|75\s*cl|imported|bottled by|produced by|product of|alc\.?|vol\.?)\b/i.test(line));
  const rawText = lines.join("\n");
  const joined = lines.join(" ");
  const vintage = joined.match(/\b(19|20)\d{2}\b/)?.[0];
  const appellation = lines.find((line) => wineRegionPattern.test(line)) || joined.match(wineRegionPattern)?.[0];
  const variety = lines.find((line) => wineVarietyPattern.test(line)) || joined.match(wineVarietyPattern)?.[0];
  const producer = pickProducerLine(lines, appellation, variety);
  const nameParts = [vintage, producer, appellation || variety].filter(Boolean);
  const fallbackLine = lines.find((line) => !/^\d{4}$/.test(line)) || "";
  const name = nameParts.length >= 2 ? nameParts.join(" ") : (appellation || variety || fallbackLine);

  return {
    name: cleanWineName(name).slice(0, 96),
    producer,
    vintage,
    appellation,
    variety,
    rawText
  };
}

function normalizeLabelText(labelText: string) {
  return labelText
    .replace(/[|]/g, "I")
    .replace(/[“”]/g, "\"")
    .replace(/[’]/g, "'")
    .replace(/\bCIIlANTI\b/gi, "Chianti")
    .replace(/\bCHlANTI\b/gi, "Chianti")
    .replace(/\bR1OJA\b/gi, "Rioja")
    .replace(/\bP1NOT\b/gi, "Pinot")
    .replace(/\bS0NOMA\b/gi, "Sonoma")
    .replace(/\bNAPA\s+VAL1EY\b/gi, "Napa Valley")
    .replace(/\b20([0-2])S\b/g, "20$15")
    .replace(/\b(19|20)(\d)O\b/g, "$1$20");
}

const wineRegionPattern =
  /\b(chianti(?: classico)?|brunello di montalcino|barolo|barbaresco|rioja(?: reserva| gran reserva)?|ribera del duero|chablis|sancerre|champagne|prosecco|cava|bordeaux|burgundy|bourgogne|beaujolais|muscadet|mendoza|napa valley|sonoma|tuscany|toscana|sicilia|etna|willamette valley|mosel|alsace|loire|rhone|rhône)\b/i;

const wineVarietyPattern =
  /\b(pinot noir|cabernet sauvignon|cabernet|merlot|malbec|syrah|shiraz|grenache|sangiovese|nebbiolo|barbera|gamay|zinfandel|tempranillo|chardonnay|sauvignon blanc|riesling|chenin blanc|pinot grigio|pinot gris|albariño|albarino|brut|rosé|rose|orange wine)\b/i;

function pickProducerLine(lines: string[], appellation?: string, variety?: string) {
  const blockedTerms = [appellation, variety].filter(Boolean);
  const blocked = blockedTerms.length ? new RegExp(blockedTerms.join("|"), "i") : undefined;
  const candidates = lines
    .filter((line) => !/\b(19|20)\d{2}\b/.test(line))
    .filter((line) => !blocked || !blocked.test(line))
    .filter((line) => !wineRegionPattern.test(line) && !wineVarietyPattern.test(line))
    .filter((line) => /[a-zA-Z]{3}/.test(line))
    .sort((a, b) => scoreProducerLine(b) - scoreProducerLine(a));

  return cleanWineName(candidates[0] || "");
}

function scoreProducerLine(line: string) {
  let score = Math.min(line.length, 28);
  if (/\b(domaine|chateau|château|clos|tenuta|azienda|cantina|bodega|cellars|estate|vineyard|winery|poggio|castello)\b/i.test(line)) {
    score += 18;
  }
  if (/^[A-Z0-9\s'&.,-]+$/.test(line)) score += 5;
  if (line.split(/\s+/).length > 5) score -= 10;
  return score;
}

function buildLabelLookupQueries(details: ExtractedLabelDetails, fallbackText: string) {
  const queries = [
    details.name,
    [details.vintage, details.producer, details.appellation].filter(Boolean).join(" "),
    [details.producer, details.appellation].filter(Boolean).join(" "),
    [details.producer, details.variety].filter(Boolean).join(" "),
    [details.vintage, details.appellation].filter(Boolean).join(" "),
    fallbackText
  ];

  return uniqueList(queries.map(cleanWineName).filter((query) => query.length >= 3)).slice(0, 6);
}

function cleanWineName(value: string) {
  return value
    .replace(/\b(appellation|controlee|controlled|denominazione|origine|protetta|docg|doc|aoc|reserve)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isGenericImageName(text: string) {
  return !text || /^(img|image|dsc|pxl|photo|scan|screenshot)\s*\d*$/i.test(text);
}

function hasAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function uniqueList(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function confidenceForWine(wine: Wine, baseConfidence: number) {
  const sourceBonus = wine.verification_status === "verified" || wine.verification_status === "source-linked" ? 0.03 : 0;
  const profilePenalty = wine.style === "Unknown" ? 0.12 : 0;

  return Math.max(0.58, Math.min(0.96, baseConfidence + sourceBonus - profilePenalty));
}

function classifyMealScenario(text: string): MealScenario {
  const scores: Record<MealScenario, number> = {
    salmon: scoreKeywords(text, ["salmon", "dill", "asparagus", "lemon"], [4, 2, 2, 1]),
    duck: scoreKeywords(text, ["duck", "confit", "gastrique", "cherry"], [5, 2, 2, 1]),
    thai_curry: scoreKeywords(text, ["thai", "green curry", "coconut milk", "lemongrass", "fish sauce", "shrimp"], [4, 4, 3, 2, 2, 1]),
    steak: scoreKeywords(text, ["steak", "ribeye", "sirloin", "beef", "chimichurri"], [5, 4, 4, 3, 3]),
    tomato_pasta: scoreKeywords(text, ["pasta", "spaghetti", "rigatoni", "tomato", "marinara", "bolognese", "arrabbiata"], [3, 3, 3, 3, 3, 3, 3]),
    roast_chicken: scoreKeywords(text, ["chicken", "roast chicken", "lemon chicken", "thyme", "rosemary"], [4, 4, 3, 1, 1]),
    pork: scoreKeywords(text, ["pork", "tenderloin", "chop", "ham", "bacon", "mustard", "apple"], [4, 3, 3, 2, 1, 1, 1]),
    mushroom: scoreKeywords(text, ["mushroom", "risotto", "truffle", "porcini", "polenta"], [4, 3, 3, 3, 1]),
    shellfish: scoreKeywords(text, ["shrimp", "prawn", "scallop", "lobster", "crab", "clam", "mussel", "oyster"], [3, 3, 4, 4, 4, 3, 3, 3]),
    salad: scoreKeywords(text, ["salad", "greens", "vinaigrette", "goat cheese", "beets", "asparagus"], [4, 2, 3, 2, 1, 1]),
    generic: 0
  };

  if (scores.steak > 0 && !hasAny(text, ["steak", "ribeye", "sirloin", "beef", "chimichurri"])) {
    scores.steak = 0;
  }

  if (scores.thai_curry > 0 && !hasAny(text, ["thai", "green curry", "red curry", "coconut milk", "lemongrass", "fish sauce"])) {
    scores.thai_curry = 0;
  }

  const [scenario, score] = (Object.entries(scores) as [MealScenario, number][])
    .filter(([key]) => key !== "generic")
    .sort((a, b) => b[1] - a[1])[0];

  return score >= 3 ? scenario : "generic";
}

function scoreKeywords(text: string, keywords: string[], weights: number[]) {
  return keywords.reduce((total, keyword, index) => total + (text.includes(keyword) ? weights[index] ?? 1 : 0), 0);
}

function pickDishTitle(lines: string[]) {
  return (
    lines.find((line) => /\b(salmon|duck|steak|chicken|pork|pasta|risotto|curry|salad|shrimp|scallop|lobster|mushroom)\b/i.test(line)) ??
    lines.find((line) => line.length >= 8 && line.length <= 80) ??
    ""
  );
}

function extractMealTerms(text: string) {
  const terms = [
    "salmon",
    "lemon",
    "dill",
    "asparagus",
    "duck",
    "cherry",
    "bitter greens",
    "shrimp",
    "coconut milk",
    "green curry",
    "lemongrass",
    "steak",
    "chimichurri",
    "roasted peppers",
    "pasta",
    "tomato",
    "basil",
    "garlic",
    "parmesan",
    "chicken",
    "thyme",
    "rosemary",
    "pork",
    "apple",
    "mustard",
    "mushroom",
    "truffle",
    "risotto",
    "scallop",
    "lobster",
    "crab",
    "salad",
    "vinaigrette",
    "goat cheese"
  ];
  const normalized = text.toLowerCase();

  return terms.filter((term) => normalized.includes(term));
}

function pickPresentIngredients(text: string, fallback: string[]) {
  const present = fallback.filter((ingredient) => text.includes(ingredient));
  return present.length ? present : fallback.slice(0, 4);
}

function detectCookingMethod(text: string, fallback: string) {
  if (hasAny(text, ["grilled", "grill", "charred"])) return "grilled";
  if (hasAny(text, ["roasted", "roast"])) return "roasted";
  if (hasAny(text, ["braised", "braise"])) return "braised";
  if (hasAny(text, ["seared", "pan seared"])) return "seared";
  if (hasAny(text, ["fried", "crispy"])) return "fried";
  if (hasAny(text, ["simmered", "stewed", "curry"])) return "simmered";
  return fallback;
}

function detectSauce(text: string, fallback: string) {
  if (text.includes("chimichurri")) return "chimichurri";
  if (text.includes("vinaigrette")) return "vinaigrette";
  if (text.includes("tomato")) return "tomato sauce";
  if (text.includes("curry")) return "curry sauce";
  if (text.includes("cream")) return "cream sauce";
  if (text.includes("lemon")) return "lemon sauce or seasoning";
  if (text.includes("mustard")) return "mustard sauce";
  return fallback;
}

function detectProtein(text: string) {
  if (hasAny(text, ["beef", "steak", "ribeye", "sirloin"])) return "beef";
  if (text.includes("chicken")) return "chicken";
  if (text.includes("pork")) return "pork";
  if (hasAny(text, ["salmon", "cod", "tuna", "fish"])) return "fish";
  if (hasAny(text, ["shrimp", "scallop", "lobster", "crab"])) return "shellfish";
  if (text.includes("duck")) return "duck";
  if (text.includes("mushroom")) return "mushroom";
  return "mixed";
}

function detectRichness(text: string): MealAnalysis["richness"] {
  if (hasAny(text, ["cream", "butter", "cheese", "duck", "steak", "ribeye", "confit", "sausage"])) return "high";
  if (hasAny(text, ["salmon", "pork", "chicken", "coconut", "risotto", "olive oil"])) return "medium-high";
  if (hasAny(text, ["salad", "greens", "vinaigrette"])) return "low";
  return "medium";
}

function detectAcidity(text: string): MealAnalysis["acidity"] {
  if (hasAny(text, ["lemon", "lime", "vinegar", "vinaigrette", "tomato", "pickled"])) return "high";
  if (hasAny(text, ["mustard", "yogurt", "cherry", "apple"])) return "medium-high";
  return "medium";
}

function detectSpice(text: string): MealAnalysis["spice_level"] {
  if (hasAny(text, ["thai", "chile", "chili", "jalapeno", "spicy", "curry", "harissa"])) return "high";
  if (hasAny(text, ["pepper", "ginger", "paprika"])) return "medium";
  return "low";
}

function inferWineAttributes(name: string): Omit<Wine, "id" | "name" | "quantity" | "source_matches" | "verification_status"> {
  const text = name.toLowerCase();

  if (hasAny(text, ["champagne", "brut", "cremant", "pet-nat", "sparkling", "cava", "prosecco"])) {
    return {
      style: "Sparkling",
      body: "Medium",
      acidity: "High",
      tannin: "Low",
      sweetness: hasAny(text, ["demi-sec", "off-dry"]) ? "Off-dry" : "Dry",
      tags: ["bubbles", "fresh", "AI-inferred"],
      flavor_notes: ["citrus", "green apple", "brioche", "chalk"],
      pairing_notes: ["High-acid bubbles work with seafood, fried foods, salads, creamy sauces, and salty snacks."]
    };
  }

  if (hasAny(text, ["chablis", "sancerre", "riesling", "albarino", "vermentino", "sauvignon", "chenin", "muscadet", "picpoul", "gruner", "chardonnay", "burgundy"])) {
    const isAromatic = hasAny(text, ["riesling", "chenin", "sauvignon", "sancerre", "gruner"]);
    return {
      style: "White",
      body: hasAny(text, ["riesling", "chenin", "chardonnay", "burgundy"]) ? "Medium" : "Light",
      acidity: "High",
      tannin: "Low",
      sweetness: hasAny(text, ["off-dry", "kabinett", "spatlese", "demi-sec"]) ? "Off-dry" : "Dry",
      tags: ["crisp", "mineral", "AI-inferred"],
      flavor_notes: isAromatic ? ["citrus", "stone fruit", "herbs", "mineral"] : ["green apple", "lemon", "saline", "mineral"],
      pairing_notes: ["Best with seafood, chicken, salads, herbs, citrus sauces, and bright vegetable dishes."]
    };
  }

  if (hasAny(text, ["orange", "skin contact", "skin-contact"])) {
    return {
      style: "Orange",
      body: "Medium",
      acidity: "Medium-high",
      tannin: "Medium",
      sweetness: "Dry",
      tags: ["skin-contact", "textured", "AI-inferred"],
      flavor_notes: ["orange peel", "dried apricot", "tea", "savory herbs"],
      pairing_notes: ["Useful for spicy food, roasted vegetables, pork, richer fish, and dishes with fermented or nutty flavors."]
    };
  }

  if (hasAny(text, ["rose", "rosé"])) {
    return {
      style: "Rose",
      body: "Light",
      acidity: "Medium-high",
      tannin: "Low",
      sweetness: "Dry",
      tags: ["fresh", "red fruit", "AI-inferred"],
      flavor_notes: ["strawberry", "watermelon", "citrus", "flowers"],
      pairing_notes: ["Versatile with salads, seafood, chicken, pork, picnic foods, and tomato-light dishes."]
    };
  }

  if (
    hasAny(text, [
      "rioja",
      "pinot",
      "beaujolais",
      "gamay",
      "barbera",
      "malbec",
      "cabernet",
      "syrah",
      "grenache",
      "merlot",
      "zinfandel",
      "chianti",
      "sangiovese",
      "brunello",
      "montepulciano",
      "nero d'avola",
      "dolcetto",
      "nebbiolo",
      "barolo",
      "barbaresco",
      "etna",
      "mencia",
      "tempranillo",
      "bordeaux",
      "cotes du rhone",
      "côtes du rhône",
      "napa",
      "willamette"
    ])
  ) {
    const fuller = hasAny(text, ["malbec", "cabernet", "syrah", "zinfandel", "rioja", "barolo", "barbaresco", "brunello", "bordeaux", "napa"]);
    const italianTomatoRed = hasAny(text, ["chianti", "sangiovese", "brunello", "montepulciano"]);
    return {
      style: "Red",
      body: fuller ? "Medium-full" : "Medium",
      acidity: hasAny(text, ["barbera", "pinot", "beaujolais", "gamay", "chianti", "sangiovese", "brunello"]) ? "Medium-high" : "Medium",
      tannin: fuller ? "Medium-high" : "Medium",
      sweetness: "Dry",
      tags: [fuller ? "structured" : "bright", italianTomatoRed ? "tomato-friendly" : "red fruit", "AI-inferred"],
      flavor_notes: italianTomatoRed
        ? ["red cherry", "tomato leaf", "dried herbs", "earth"]
        : fuller
          ? ["black cherry", "plum", "spice", "savory oak"]
          : ["red cherry", "raspberry", "earth", "dried herbs"],
      pairing_notes: italianTomatoRed
        ? ["Best with red sauce pasta, pizza, ragù, parmesan, roasted pork, mushrooms, and Tuscan-style grilled meats."]
        : fuller
        ? ["Best with grilled steak, lamb, burgers, braises, roasted peppers, and hard cheeses."]
        : ["Best with duck, pork, mushrooms, tomato sauces, roast chicken, and herb-driven dishes."]
    };
  }

  if (hasAny(text, ["red wine", "vin rouge", "vino tinto", "rosso"])) {
    return {
      style: "Red",
      body: "Medium",
      acidity: "Medium",
      tannin: "Medium",
      sweetness: "Dry",
      tags: ["red fruit", "AI-inferred"],
      flavor_notes: ["red cherry", "plum", "earth", "dried herbs"],
      pairing_notes: ["Good with roasted meats, tomato sauces, mushrooms, burgers, pork, and hard cheeses."]
    };
  }

  if (hasAny(text, ["white wine", "vin blanc", "vino blanco", "bianco", "blanc"])) {
    return {
      style: "White",
      body: "Medium",
      acidity: "Medium-high",
      tannin: "Low",
      sweetness: "Dry",
      tags: ["fresh", "AI-inferred"],
      flavor_notes: ["citrus", "green apple", "pear", "mineral"],
      pairing_notes: ["Good with seafood, chicken, salads, herbs, citrus sauces, and lighter cheeses."]
    };
  }

  return {
    style: "Unknown",
    body: "Medium",
    acidity: "Medium",
    tannin: "Medium",
    sweetness: "Dry",
    tags: ["AI-inferred", "source lookup needed"],
    flavor_notes: ["fruit", "savory notes", "regional character pending source match"],
    pairing_notes: ["Use intensity-based pairing until source details are verified: match with balanced dishes, moderate richness, and avoid extreme spice or sweetness."]
  };
}

function inferWineFacts(name: string): Pick<Wine, "producer" | "vintage" | "region" | "country" | "grape"> {
  const text = name.toLowerCase();
  const vintage = name.match(/\b(19|20)\d{2}\b/)?.[0];
  const producer = inferProducerName(name);

  const regionRules: Array<[RegExp, string, string, string[]]> = [
    [/chianti|tuscany|toscana/i, "Tuscany", "Italy", ["Sangiovese"]],
    [/brunello/i, "Montalcino", "Italy", ["Sangiovese"]],
    [/barolo|barbaresco/i, "Piedmont", "Italy", ["Nebbiolo"]],
    [/barbera|dolcetto/i, "Piedmont", "Italy", text.includes("dolcetto") ? ["Dolcetto"] : ["Barbera"]],
    [/etna/i, "Sicily", "Italy", ["Nerello Mascalese"]],
    [/rioja/i, "Rioja", "Spain", ["Tempranillo"]],
    [/ribera del duero/i, "Ribera del Duero", "Spain", ["Tempranillo"]],
    [/chablis/i, "Chablis", "France", ["Chardonnay"]],
    [/sancerre/i, "Loire Valley", "France", ["Sauvignon Blanc"]],
    [/muscadet/i, "Loire Valley", "France", ["Melon de Bourgogne"]],
    [/champagne/i, "Champagne", "France", ["Chardonnay", "Pinot Noir", "Meunier"]],
    [/bordeaux/i, "Bordeaux", "France", ["Cabernet Sauvignon", "Merlot"]],
    [/beaujolais/i, "Beaujolais", "France", ["Gamay"]],
    [/burgundy|bourgogne/i, "Burgundy", "France", text.includes("white") || text.includes("chardonnay") ? ["Chardonnay"] : ["Pinot Noir"]],
    [/côtes du rhône|cotes du rhone|rhone|rhône/i, "Rhône Valley", "France", ["Grenache", "Syrah"]],
    [/napa/i, "Napa Valley", "United States", ["Cabernet Sauvignon"]],
    [/sonoma/i, "Sonoma", "United States", text.includes("chardonnay") ? ["Chardonnay"] : ["Pinot Noir"]],
    [/willamette/i, "Willamette Valley", "United States", ["Pinot Noir"]],
    [/mendoza/i, "Mendoza", "Argentina", ["Malbec"]],
    [/mosel/i, "Mosel", "Germany", ["Riesling"]],
    [/alsace/i, "Alsace", "France", ["Riesling"]]
  ];
  const regionMatch = regionRules.find(([pattern]) => pattern.test(name));
  const grape = regionMatch?.[3] ?? inferGrapeFromName(text);

  return {
    producer,
    vintage,
    region: regionMatch?.[1],
    country: regionMatch?.[2],
    grape
  };
}

function inferProducerName(name: string) {
  const cleaned = name
    .replace(/\b(19|20)\d{2}\b/g, " ")
    .replace(/\b(chianti(?: classico)?|brunello di montalcino|barolo|barbaresco|rioja(?: reserva| gran reserva)?|chablis|sancerre|champagne|prosecco|cava|bordeaux|burgundy|bourgogne|beaujolais|muscadet|mendoza|napa valley|sonoma|willamette valley|pinot noir|cabernet sauvignon|cabernet|merlot|malbec|syrah|shiraz|grenache|sangiovese|nebbiolo|barbera|gamay|zinfandel|tempranillo|chardonnay|sauvignon blanc|riesling|chenin blanc|brut|red wine|white wine|rose|rosé)\b/gi, " ")
    .replace(/\b(reserva|reserve|classico|docg|doc|aoc|wine|bottle|bottles)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.length >= 3 ? cleaned : undefined;
}

function inferGrapeFromName(text: string) {
  const grapes: Array<[string, string]> = [
    ["cabernet sauvignon", "Cabernet Sauvignon"],
    ["pinot noir", "Pinot Noir"],
    ["sauvignon blanc", "Sauvignon Blanc"],
    ["chardonnay", "Chardonnay"],
    ["riesling", "Riesling"],
    ["merlot", "Merlot"],
    ["malbec", "Malbec"],
    ["syrah", "Syrah"],
    ["shiraz", "Syrah"],
    ["grenache", "Grenache"],
    ["sangiovese", "Sangiovese"],
    ["nebbiolo", "Nebbiolo"],
    ["barbera", "Barbera"],
    ["gamay", "Gamay"],
    ["zinfandel", "Zinfandel"],
    ["tempranillo", "Tempranillo"],
    ["chenin", "Chenin Blanc"],
    ["albarino", "Albarino"],
    ["albariño", "Albariño"]
  ];
  const grape = grapes.find(([needle]) => text.includes(needle))?.[1];
  return grape ? [grape] : undefined;
}

function extractKeywords(input: string) {
  const words = input
    .split(/[^a-zA-Z]+/)
    .map((word) => word.trim().toLowerCase())
    .filter((word) => word.length > 3);

  return Array.from(new Set(words)).slice(0, 5);
}

function getScenarioRecommendation(scenario: MealScenario) {
  const recommendations = {
    salmon: {
      recommended_style: "Loire Valley Sauvignon Blanc",
      specific_suggestion: "Sancerre or Pouilly-Fume",
      perfect_pairing: "Sancerre or Loire Sauvignon Blanc",
      confidence: 0.92,
      reason:
        "The lemon and dill need a crisp white, while rich salmon benefits from clean acidity and mineral snap.",
      alternatives: ["Brut Champagne", "Albarino", "Vermentino", "Unoaked Chablis"],
      avoid: ["Heavy oaked Chardonnay", "High-tannin Cabernet Sauvignon"]
    },
    duck: {
      recommended_style: "Light-to-medium red with bright acidity",
      specific_suggestion: "Pinot Noir or Cru Beaujolais",
      perfect_pairing: "Pinot Noir or Cru Beaujolais",
      confidence: 0.89,
      reason:
        "Duck confit is rich, but the cherry gastrique wants red fruit and lift instead of brute force.",
      alternatives: ["Barbera", "Gamay", "Lighter Grenache", "Etna Rosso"],
      avoid: ["Very heavy Cabernet Sauvignon", "Jammy high-alcohol reds"]
    },
    thai_curry: {
      recommended_style: "Aromatic white with a little sweetness",
      specific_suggestion: "Off-dry Riesling",
      perfect_pairing: "Off-dry Riesling",
      confidence: 0.9,
      reason:
        "A hint of sweetness softens chile heat, and bright acidity refreshes coconut richness between bites.",
      alternatives: ["Sparkling Chenin Blanc", "Pet-nat", "Aromatic white wine", "Vouvray demi-sec"],
      avoid: ["High-tannin reds", "Very high-alcohol wines", "Oaky whites"]
    },
    steak: {
      recommended_style: "Fresh, savory red with structure",
      specific_suggestion: "Argentinian Malbec or Cabernet Franc",
      perfect_pairing: "Argentinian Malbec or Cabernet Franc",
      confidence: 0.88,
      reason:
        "Grilled steak welcomes tannin and body, while chimichurri needs acidity and herbal energy.",
      alternatives: ["Syrah", "Carmenere", "Rioja Reserva", "Loire Cabernet Franc"],
      avoid: ["Very light white wines", "Low-acid heavy reds"]
    },
    tomato_pasta: {
      recommended_style: "Bright Italian red",
      specific_suggestion: "Chianti Classico or Barbera",
      perfect_pairing: "Chianti Classico or Barbera",
      confidence: 0.87,
      reason:
        "Tomato sauce needs acidity, and a savory Italian red brings enough freshness without overpowering the pasta.",
      alternatives: ["Dolcetto", "Nero d'Avola", "Etna Rosso", "Lambrusco secco"],
      avoid: ["Low-acid jammy reds", "Oaky buttery Chardonnay"]
    },
    roast_chicken: {
      recommended_style: "Medium-bodied white or light red",
      specific_suggestion: "White Burgundy or Pinot Noir",
      perfect_pairing: "White Burgundy or Pinot Noir",
      confidence: 0.84,
      reason:
        "Roast chicken is all about savory skin, herbs, and medium richness, so both textured whites and gentle reds work well.",
      alternatives: ["Chenin Blanc", "Cotes du Rhone Blanc", "Gamay", "Grenache"],
      avoid: ["Very tannic Cabernet Sauvignon", "Very sweet white wines"]
    },
    pork: {
      recommended_style: "Juicy red or textured white",
      specific_suggestion: "Gamay, Pinot Noir, or dry Riesling",
      perfect_pairing: "Gamay, Pinot Noir, or dry Riesling",
      confidence: 0.84,
      reason:
        "Pork likes lift and fruit, especially when apple, mustard, herbs, or a glaze are in the dish.",
      alternatives: ["Barbera", "Chenin Blanc", "Cotes du Rhone", "Lambrusco secco"],
      avoid: ["Very tannic reds", "Low-acid heavy whites"]
    },
    mushroom: {
      recommended_style: "Earthy red or mineral white",
      specific_suggestion: "Pinot Noir or Nebbiolo",
      perfect_pairing: "Pinot Noir or Nebbiolo",
      confidence: 0.86,
      reason:
        "Mushrooms bring earth and umami, which pair best with wines that have savory depth and enough acidity.",
      alternatives: ["Etna Rosso", "White Burgundy", "Chenin Blanc", "Mencia"],
      avoid: ["Sweet wines", "Simple fruit-forward reds"]
    },
    shellfish: {
      recommended_style: "Crisp mineral white",
      specific_suggestion: "Muscadet, Chablis, or Albarino",
      perfect_pairing: "Muscadet, Chablis, or Albarino",
      confidence: 0.88,
      reason:
        "Shellfish needs freshness and low tannin; mineral whites amplify briny flavors while citrusy acidity keeps the dish bright.",
      alternatives: ["Brut Champagne", "Vermentino", "Sancerre", "Picpoul"],
      avoid: ["Tannic reds", "Heavy oaked whites"]
    },
    salad: {
      recommended_style: "High-acid white or dry sparkling",
      specific_suggestion: "Sauvignon Blanc or Brut sparkling wine",
      perfect_pairing: "Sauvignon Blanc or Brut sparkling wine",
      confidence: 0.82,
      reason:
        "Vinaigrette and fresh greens need a wine with enough acidity to stay crisp rather than tasting flat.",
      alternatives: ["Albarino", "Gruner Veltliner", "Dry Rose", "Vermentino"],
      avoid: ["Heavy tannic reds", "Buttery oaked Chardonnay"]
    },
    generic: {
      recommended_style: "Balanced, food-friendly wine",
      specific_suggestion: "A bright white, chilled red, or dry sparkling wine",
      perfect_pairing: "Dry sparkling wine or a bright, medium-bodied wine",
      confidence: 0.76,
      reason:
        "The safest pairing is a lively wine with enough freshness to handle a range of flavors.",
      alternatives: ["Brut sparkling wine", "Chilled Gamay", "Unoaked white", "Dry Rose"],
      avoid: ["Overly oaky wines", "Very high-alcohol wines"]
    }
  };

  return recommendations[scenario];
}

function findInventoryMatch(
  scenario: MealScenario,
  preferences: UserPreferences,
  inventory: Wine[]
) {
  const matchRules: Record<MealScenario, string[]> = {
    salmon: ["chablis", "champagne", "sancerre", "sauvignon", "sparkling", "white"],
    duck: ["pinot", "beaujolais", "gamay", "barbera", "red", "orange"],
    thai_curry: ["riesling", "chenin", "sparkling", "pet-nat", "orange", "white"],
    steak: ["rioja", "malbec", "cabernet franc", "syrah", "red"],
    tomato_pasta: ["chianti", "barbera", "dolcetto", "etna", "lambrusco", "red"],
    roast_chicken: ["chardonnay", "burgundy", "chenin", "pinot", "gamay", "grenache", "white", "red"],
    pork: ["gamay", "pinot", "riesling", "barbera", "chenin", "red", "white"],
    mushroom: ["pinot", "nebbiolo", "etna", "chenin", "burgundy", "mencia", "red"],
    shellfish: ["muscadet", "chablis", "albarino", "champagne", "sancerre", "vermentino", "sparkling", "white"],
    salad: ["sauvignon", "sparkling", "albarino", "gruner", "rose", "vermentino", "white"],
    generic: ["sparkling", "white", "red", "rose", "orange"]
  };

  const preferredStyleSet = new Set(preferences.preferred_styles);
  const candidates = inventory
    .filter((wine) => wine.quantity > 0)
    .map((wine) => {
      const haystack = `${wine.name} ${wine.style} ${wine.tags.join(" ")}`.toLowerCase();
      const ruleHits = matchRules[scenario].filter((rule) => haystack.includes(rule)).length;
      const preferenceHit =
        preferredStyleSet.has("Unknown") || preferredStyleSet.size === 0 || preferredStyleSet.has(wine.style)
          ? 1
          : 0;
      const philosophyHit = preferences.wine_philosophy.some((item) =>
        haystack.includes(item.toLowerCase())
      )
        ? 0.5
        : 0;

      return {
        wine,
        score: ruleHits * 2 + preferenceHit + philosophyHit + wine.quantity * 0.08
      };
    })
    .sort((a, b) => b.score - a.score);

  const best = candidates[0];

  if (!best || best.score < 1.1) {
    return undefined;
  }

  return {
    wine_id: best.wine.id,
    name: best.wine.name,
    confidence: Math.min(0.96, 0.72 + best.score * 0.035),
    reason: `${best.wine.name} fits because it brings ${best.wine.acidity.toLowerCase()} acidity, ${best.wine.body.toLowerCase()} body, and ${best.wine.tags
      .slice(0, 2)
      .join(" / ")} notes already in your inVINtory.`
  };
}

function prioritizeAlternatives(alternatives: string[], preferences: UserPreferences) {
  const preferred = preferences.preferred_styles.map((style) => style.toLowerCase());

  return [...alternatives].sort((a, b) => {
    const aText = a.toLowerCase();
    const bText = b.toLowerCase();
    const aScore = preferred.some((style) => aText.includes(style) || styleAlias(style, aText)) ? 1 : 0;
    const bScore = preferred.some((style) => bText.includes(style) || styleAlias(style, bText)) ? 1 : 0;
    return bScore - aScore;
  });
}

function styleAlias(style: string, text: string) {
  if (style === "sparkling") return /champagne|pet-nat|bubbles|chenin/.test(text);
  if (style === "white") return /riesling|chablis|sancerre|albarino|vermentino|vouvray/.test(text);
  if (style === "red") return /pinot|beaujolais|gamay|barbera|malbec|rioja|syrah|grenache|cabernet/.test(text);
  if (style === "rose") return text.includes("rose");
  return false;
}

function buildPreferenceNote(preferences: UserPreferences, firstAlternative: string) {
  const styleText =
    preferences.preferred_styles.length > 0 && !preferences.preferred_styles.includes("Unknown")
      ? `I also weighted your ${preferences.preferred_styles.join(", ").toLowerCase()} preference`
      : "I kept your style preference open";
  const philosophyText = preferences.wine_philosophy.length
    ? ` and favored ${preferences.wine_philosophy.join(", ").toLowerCase()} options`
    : "";
  const flavorText = preferences.flavor_preferences.length
    ? ` with a ${preferences.flavor_preferences.slice(0, 2).join(" / ").toLowerCase()} feel`
    : "";

  return `${styleText}${philosophyText}${flavorText}; ${firstAlternative} is a strong backup.`;
}

function getModeNote(mode: PairingMode, inventoryMatchName: string | undefined, perfectPairing: string) {
  if (mode === "inventory") {
    return inventoryMatchName
      ? `Opening ${inventoryMatchName} is the best move from your inVINtory.`
      : "No cellar bottle is a clean hit, so the buy recommendation is safer.";
  }

  if (mode === "perfect") {
    return `${perfectPairing} is the best ideal pairing to buy.`;
  }

  return inventoryMatchName
    ? `You have a strong bottle ready, and ${perfectPairing} is the ideal shopping target.`
    : `${perfectPairing} is the cleanest pairing, with inventory as a backup when a closer match is added.`;
}

function priceForBudget(preferences: UserPreferences) {
  const min = Math.max(10, Math.min(preferences.budget_min ?? 0, preferences.budget_max ?? 0));
  const max = Math.max(min, preferences.budget_max ?? 0);

  if (min > 0 && max > 0) {
    return max >= 150 ? `$${min}+` : `$${min}-$${max}`;
  }

  const budget = preferences.budget_range;
  const prices: Record<BudgetRange, string> = {
    "Under $20": "$15-$20",
    "$20-$40": "$25-$40",
    "$40-$75": "$45-$70",
    "$75+": "$75+"
  };

  return prices[budget];
}
