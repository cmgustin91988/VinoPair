import {
  BadgeDollarSign,
  Barcode,
  Check,
  ChefHat,
  Clock,
  CircleOff,
  Copy,
  Database,
  FileText,
  Heart,
  Keyboard,
  ListChecks,
  Minus,
  PartyPopper,
  Plus,
  RefreshCcw,
  ScanText,
  Search,
  Settings2,
  ShoppingBag,
  Sparkles,
  Trash2,
  Upload,
  UserCircle,
  Wine
} from "lucide-react";
import { ChangeEvent, CSSProperties, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  analyzeMeal,
  BudgetRange,
  createWineFromText,
  defaultPreferences,
  ensureWineAnalysis,
  featuredMeals,
  identifyWineFromImageName,
  identifyWineFromLabelText,
  MealAnalysis,
  normalizeMealInput,
  OccasionMode,
  PairingMode,
  PairingRecommendation,
  recommendFoodForWine,
  recommendPairing,
  summarizeCellar,
  starterInventory,
  UserPreferences,
  WineFoodRecommendation,
  Wine as WineItem,
  WineStyle
} from "./pairingService";
import {
  buildExternalLookupLinks,
  applyWineSourceProfile,
  enrichWineWithSources,
  ExternalWineMatch,
  WineLookupResult,
  lookupWineWithProfile
} from "./wineLookupService";
import { extractBarcodeCandidate, lookupWineByBarcode } from "./openFoodFactsService";
import logoSrc from "./assets/vinopair-logo.png";
import {
  CloudSession,
  cloudSyncAvailable,
  getStoredCloudSession,
  loadCloudState,
  saveCloudState,
  signInWithEmail,
  signUpWithEmail,
  storeCloudSession
} from "./cloudSyncService";

type Screen = "meal" | "wine" | "preferences" | "results" | "inventory" | "account";
type InputMode = "screenshot" | "recipe" | "manual";
type CompassMetric = {
  label: string;
  value: number;
};
type LabelScanCandidate = {
  id: string;
  fileName: string;
  imageUrl: string;
  wine: WineItem;
  confidence: number;
  externalMatches: ExternalWineMatch[];
  note: string;
};

const styleOptions: WineStyle[] = ["Red", "White", "Rose", "Orange", "Sparkling"];
const philosophyOptions = ["Natural", "Biodynamic", "Organic", "Conventional okay"];
const flavorOptions = ["Crisp", "Mineral", "Funky", "Earthy", "Fruity", "Rich", "Tannic"];
const budgetOptions: BudgetRange[] = ["Under $20", "$20-$40", "$40-$75", "$75+"];
const occasionOptions: Array<{ mode: OccasionMode; label: string; icon: ReactNode }> = [
  { mode: "classic", label: "Classic", icon: <Sparkles size={16} /> },
  { mode: "weeknight", label: "Weeknight", icon: <Clock size={16} /> },
  { mode: "dinner_party", label: "Dinner Party", icon: <PartyPopper size={16} /> },
  { mode: "date_night", label: "Date Night", icon: <Heart size={16} /> },
  { mode: "takeout", label: "Takeout", icon: <ShoppingBag size={16} /> }
];

const thinkingSteps = [
  "Reading the dish details",
  "Mapping richness, acidity, spice, and sauce",
  "Checking your inVINtory",
  "Applying style, budget, and avoid notes",
  "Writing the pairing in plain English"
];

const storageKeys = {
  inventory: "invintory.inventory",
  preferences: "invintory.preferences",
  sourceRefresh: "vinopair.sourceRefresh",
  autoSourceRefresh: "vinopair.autoSourceRefresh"
};

const sourceRefreshStaleMs = 24 * 60 * 60 * 1000;
const sourceRefreshIntervalMs = 6 * 60 * 60 * 1000;
const sourceRefreshRetryMs = 15 * 60 * 1000;

function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>("meal");
  const [mealInput, setMealInput] = useState(featuredMeals[0]);
  const [inputMode, setInputMode] = useState<InputMode>("manual");
  const [pairingMode, setPairingMode] = useState<PairingMode>("show_both");
  const [occasion, setOccasion] = useState<OccasionMode>("classic");
  const [preferences, setPreferences] = useState<UserPreferences>(() =>
    normalizePreferences(loadFromStorage(storageKeys.preferences, defaultPreferences))
  );
  const [inventory, setInventory] = useState<WineItem[]>(() =>
    loadFromStorage(storageKeys.inventory, starterInventory).map((wine, index) => ensureWineAnalysis(wine, index + 1))
  );
  const [analysis, setAnalysis] = useState<MealAnalysis>(() => analyzeMeal(featuredMeals[0]));
  const [recommendation, setRecommendation] = useState<PairingRecommendation>(() =>
    recommendPairing(analyzeMeal(featuredMeals[0]), defaultPreferences, starterInventory, "show_both", "classic")
  );
  const [isThinking, setIsThinking] = useState(false);
  const [uploadedLabel, setUploadedLabel] = useState("Ready for dinner details");
  const [copied, setCopied] = useState(false);
  const [cloudSession, setCloudSession] = useState<CloudSession | null>(() => getStoredCloudSession());
  const [cloudStatus, setCloudStatus] = useState(
    cloudSyncAvailable() ? "Cloud sync ready" : "Local mode. Add Supabase env vars for cloud accounts."
  );
  const [isCloudBusy, setIsCloudBusy] = useState(false);
  const cloudHydrated = useRef(false);
  const cloudSaveTimer = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem(storageKeys.inventory, JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem(storageKeys.preferences, JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    if (!cloudSession || !cloudSyncAvailable()) return;
    if (!cloudHydrated.current) return;

    if (cloudSaveTimer.current) {
      window.clearTimeout(cloudSaveTimer.current);
    }

    cloudSaveTimer.current = window.setTimeout(() => {
      void saveCurrentCloudState(cloudSession, "Autosaved to cloud.");
    }, 1200);

    return () => {
      if (cloudSaveTimer.current) {
        window.clearTimeout(cloudSaveTimer.current);
      }
    };
  }, [cloudSession, inventory, preferences]);

  const inventoryCount = useMemo(
    () => inventory.reduce((total, wine) => total + wine.quantity, 0),
    [inventory]
  );
  const liveAnalysis = useMemo(() => analyzeMeal(mealInput), [mealInput]);
  const heroContent = getHeroContent(activeScreen);

  const runPairingForText = (text: string) => {
    const normalizedMeal = normalizeMealInput(text);
    if (!normalizedMeal.trim()) return;
    setMealInput(normalizedMeal);
    setIsThinking(true);
    setActiveScreen("results");

    window.setTimeout(() => {
      const nextAnalysis = analyzeMeal(normalizedMeal);
      setAnalysis(nextAnalysis);
      setRecommendation(recommendPairing(nextAnalysis, preferences, inventory, pairingMode, occasion));
      setIsThinking(false);
    }, 780);
  };

  const runPairing = () => {
    runPairingForText(mealInput);
  };

  const loadFeaturedMeal = (meal: string) => {
    setMealInput(meal);
    setUploadedLabel("Featured pairing loaded");
  };

  const updateBudgetRange = (nextMin: number, nextMax: number) => {
    const min = Math.max(10, Math.min(nextMin, nextMax - 5));
    const max = Math.min(150, Math.max(nextMax, min + 5));
    setPreferences({
      ...preferences,
      budget_min: min,
      budget_max: max,
      budget_range: budgetBucketForRange(min, max)
    });
  };

  const handleTextUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      setInputMode("screenshot");
      setUploadedLabel(`Reading ${file.name}...`);
      const imageText = await readImageText(file);
      const normalizedMeal = normalizeMealInput(imageText || file.name);
      setUploadedLabel(
        imageText
          ? `${file.name} translated into a meal description`
          : `${file.name} needs review; using file name as fallback`
      );
      event.target.value = "";
      runPairingForText(normalizedMeal);
      return;
    }

    setInputMode("recipe");
    setUploadedLabel(`Reading ${file.name}...`);
    const text = await file.text();
    const normalizedMeal = normalizeMealInput(text);
    setUploadedLabel(`${file.name} translated into a meal description`);
    event.target.value = "";
    runPairingForText(normalizedMeal);
  };

  const copyRecommendation = async () => {
    const summary = `${recommendation.perfect_pairing.style} for ${recommendation.dish_name}. Best from inVINtory: ${
      recommendation.inventory_match?.name ?? "No strong inventory match yet"
    }. Why: ${recommendation.reason}`;

    await navigator.clipboard.writeText(summary);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  const saveCurrentCloudState = async (session: CloudSession, successMessage = "Saved to cloud.") => {
    if (!cloudSyncAvailable()) {
      setCloudStatus("Cloud sync is not configured yet.");
      return;
    }

    try {
      await saveCloudState(session, { inventory, preferences });
      setCloudStatus(successMessage);
    } catch (error) {
      setCloudStatus(error instanceof Error ? error.message : "Cloud save failed.");
    }
  };

  const signIntoCloud = async (email: string, password: string, mode: "signin" | "signup") => {
    setIsCloudBusy(true);
    setCloudStatus(mode === "signup" ? "Creating account..." : "Signing in...");

    try {
      const session = mode === "signup" ? await signUpWithEmail(email, password) : await signInWithEmail(email, password);
      setCloudSession(session);
      const cloudState = await loadCloudState(session);

      if (cloudState) {
        setInventory(cloudState.inventory.map((wine, index) => ensureWineAnalysis(wine, index + 1)));
        setPreferences(normalizePreferences(cloudState.preferences));
        setCloudStatus("Loaded your cloud cellar.");
      } else {
        await saveCloudState(session, { inventory, preferences });
        setCloudStatus("Account connected. Local cellar saved to cloud.");
      }

      cloudHydrated.current = true;
    } catch (error) {
      setCloudStatus(error instanceof Error ? error.message : "Cloud sign in failed.");
    } finally {
      setIsCloudBusy(false);
    }
  };

  const signOutOfCloud = () => {
    storeCloudSession(null);
    setCloudSession(null);
    cloudHydrated.current = false;
    setCloudStatus("Signed out. This device is using local storage.");
  };

  const loadFromCloud = async () => {
    if (!cloudSession) return;
    setIsCloudBusy(true);
    setCloudStatus("Loading cloud cellar...");

    try {
      const cloudState = await loadCloudState(cloudSession);
      if (!cloudState) {
        setCloudStatus("No cloud cellar yet. Save this cellar to start syncing.");
        return;
      }
      setInventory(cloudState.inventory.map((wine, index) => ensureWineAnalysis(wine, index + 1)));
      setPreferences(normalizePreferences(cloudState.preferences));
      cloudHydrated.current = true;
      setCloudStatus("Cloud cellar loaded.");
    } catch (error) {
      setCloudStatus(error instanceof Error ? error.message : "Cloud load failed.");
    } finally {
      setIsCloudBusy(false);
    }
  };

  const saveToCloudNow = async () => {
    if (!cloudSession) return;
    setIsCloudBusy(true);
    setCloudStatus("Saving cloud cellar...");
    await saveCurrentCloudState(cloudSession, "Cloud cellar saved.");
    cloudHydrated.current = true;
    setIsCloudBusy(false);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand-lockup" type="button" onClick={() => setActiveScreen("meal")}>
          <img className="brand-logo" src={logoSrc} alt="VinoPair" />
          <span className="brand-copy">
            <strong>VinoPair</strong>
            <small>Pair. Pour. Track.</small>
          </span>
        </button>
        <nav className="screen-tabs" aria-label="Primary screens">
          {[
            ["meal", "Meal", <ChefHat size={17} key="meal" />],
            ["wine", "Wine First", <Wine size={17} key="wine" />],
            ["preferences", "Preferences", <Settings2 size={17} key="preferences" />],
            ["results", "Pairing", <Sparkles size={17} key="results" />],
            ["inventory", "inVINtory", <Database size={17} key="inventory" />],
            ["account", "Account", <UserCircle size={17} key="account" />]
          ].map(([screen, label, icon]) => (
            <button
              className={activeScreen === screen ? "tab active" : "tab"}
              key={screen as string}
              type="button"
              onClick={() => setActiveScreen(screen as Screen)}
            >
              {icon}
              {label}
            </button>
          ))}
        </nav>
      </header>

      <section className="hero-strip">
        <div>
          <p className="eyebrow">{heroContent.eyebrow}</p>
          <h1>{heroContent.title}</h1>
          <p>{heroContent.body}</p>
          <div className="pairing-snapshot" aria-label="VinoPair taste graph">
            <div className="snapshot-heading">
              <span>
                <Sparkles size={18} />
              </span>
              <div>
                <strong>VinoPair taste graph</strong>
                <small>Meal + bottle + occasion</small>
              </div>
            </div>
            <div className="snapshot-flow">
              <SnapshotStep icon={<ChefHat size={18} />} label="Meal" value={snapshotDishName(liveAnalysis.dish_name)} />
              <SnapshotStep icon={<Database size={18} />} label="Bottle pool" value={`${inventoryCount} inVINtory`} />
              <SnapshotStep icon={<Wine size={18} />} label="Mode" value={modeLabel(pairingMode)} />
              <SnapshotStep icon={<PartyPopper size={18} />} label="Occasion" value={occasionLabel(occasion)} />
            </div>
          </div>
        </div>
      </section>

      {activeScreen === "meal" && (
        <MealScreen
          inputMode={inputMode}
          mealInput={mealInput}
          pairingMode={pairingMode}
          uploadedLabel={uploadedLabel}
          onAnalyze={runPairing}
          onFeaturedMeal={loadFeaturedMeal}
          onInputMode={setInputMode}
          onMealInput={setMealInput}
          occasion={occasion}
          onOccasion={setOccasion}
          onPairingMode={setPairingMode}
          onUpload={handleTextUpload}
          preview={liveAnalysis}
          preferences={preferences}
          onBudgetRange={updateBudgetRange}
        />
      )}

      {activeScreen === "wine" && (
        <WineFirstScreen inventory={inventory} occasion={occasion} onOccasion={setOccasion} />
      )}

      {activeScreen === "preferences" && (
        <PreferencesScreen preferences={preferences} setPreferences={setPreferences} />
      )}

      {activeScreen === "results" && (
        <ResultsScreen
          analysis={analysis}
          copied={copied}
          isThinking={isThinking}
          recommendation={recommendation}
          onCopy={copyRecommendation}
          onNewPairing={() => setActiveScreen("meal")}
        />
      )}

      {activeScreen === "inventory" && (
        <InventoryScreen inventory={inventory} setInventory={setInventory} />
      )}

      {activeScreen === "account" && (
        <AccountScreen
          available={cloudSyncAvailable()}
          cloudStatus={cloudStatus}
          inventoryCount={inventoryCount}
          isBusy={isCloudBusy}
          onLoad={loadFromCloud}
          onSave={saveToCloudNow}
          onSignIn={signIntoCloud}
          onSignOut={signOutOfCloud}
          session={cloudSession}
        />
      )}

      <ArchitecturePanel />
    </main>
  );
}

function WineFirstScreen({
  inventory,
  occasion,
  onOccasion
}: {
  inventory: WineItem[];
  occasion: OccasionMode;
  onOccasion: (occasion: OccasionMode) => void;
}) {
  const firstWine = inventory.find((wine) => wine.quantity > 0) ?? starterInventory[0];
  const [wineInput, setWineInput] = useState(firstWine.name);
  const [selectedWineId, setSelectedWineId] = useState(firstWine.id);
  const [pairedWine, setPairedWine] = useState<WineItem>(firstWine);
  const [recommendation, setRecommendation] = useState<WineFoodRecommendation>(() =>
    recommendFoodForWine(firstWine, occasion)
  );
  const [isPairingWine, setIsPairingWine] = useState(false);
  const readyInventory = inventory.filter((wine) => wine.quantity > 0);
  const cellarChoices = readyInventory.length ? readyInventory : starterInventory;
  const bottleFunkScore = funkScoreForWine(pairedWine, recommendation);

  useEffect(() => {
    setRecommendation(recommendFoodForWine(pairedWine, occasion));
  }, [occasion, pairedWine]);

  const pairSelectedWine = (wineId: string) => {
    if (wineId === "manual") {
      setSelectedWineId("manual");
      return;
    }

    const wine = cellarChoices.find((item) => item.id === wineId);
    if (!wine) return;

    setSelectedWineId(wine.id);
    setWineInput(wine.name);
    setPairedWine(wine);
    setRecommendation(recommendFoodForWine(wine, occasion));
  };

  const pairTypedWine = async () => {
    const trimmed = wineInput.trim();
    if (!trimmed) return;

    setIsPairingWine(true);
    try {
      const baseWine = createWineFromText(trimmed, inventory.length + 1);
      const enrichedWine = await enrichWineWithSources(baseWine);
      setSelectedWineId("manual");
      setPairedWine(enrichedWine);
      setRecommendation(recommendFoodForWine(enrichedWine, occasion));
    } finally {
      setIsPairingWine(false);
    }
  };

  return (
    <section className="workspace-grid wine-first-layout">
      <section className="panel wine-first-panel">
        <div className="section-heading">
          <span>
            <Wine size={20} />
          </span>
          <div>
            <p className="eyebrow">Wine first</p>
            <h2>What bottle are you opening?</h2>
          </div>
        </div>

        <WineProfileVisual wine={pairedWine} />
        <WineFunkMeter wine={pairedWine} />
        <ServingGuidanceCard wine={pairedWine} />
        <OccasionModes occasion={occasion} onOccasion={onOccasion} />

        <div className="wine-choice-grid">
          <label>
            <span>Choose from inVINtory</span>
            <select onChange={(event) => pairSelectedWine(event.target.value)} value={selectedWineId}>
              {cellarChoices.map((wine) => (
                <option key={wine.id} value={wine.id}>
                  {wine.name}
                </option>
              ))}
              <option value="manual">Another bottle</option>
            </select>
          </label>
          <label>
            <span>Or type a bottle</span>
            <input
              onChange={(event) => {
                setWineInput(event.target.value);
                setSelectedWineId("manual");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") pairTypedWine();
              }}
              placeholder="Example: 2019 Rioja Reserva"
              value={wineInput}
            />
          </label>
        </div>

        <button className="primary-button" type="button" onClick={pairTypedWine} disabled={isPairingWine}>
          <Search size={20} />
          {isPairingWine ? "Reading the bottle..." : "Suggest Food"}
        </button>

        <div className="cellar-pick-list">
          <h3>Quick cellar picks</h3>
          <div>
            {cellarChoices.slice(0, 6).map((wine) => (
              <button
                className={pairedWine.id === wine.id ? "cellar-pick active" : "cellar-pick"}
                key={wine.id}
                type="button"
                onClick={() => pairSelectedWine(wine.id)}
              >
                <strong>{wine.name}</strong>
                <span>{wine.style} · {wine.body}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <aside className="panel profile-panel wine-food-panel">
        <div className="section-heading compact">
          <span>
            <ChefHat size={19} />
          </span>
          <div>
            <p className="eyebrow">Best food match</p>
            <h2>{recommendation.headline_dish}</h2>
          </div>
        </div>
        <p className="wine-food-reason">{recommendation.reason}</p>
        <p className="occasion-note">{recommendation.occasion_note}</p>
        <PairingGaugePanel
          confidence={recommendation.confidence}
          funkLabel={funkLabel(bottleFunkScore)}
          funkScore={bottleFunkScore}
        />
        <PairingCompass metrics={wineCompassMetrics(pairedWine)} title="Bottle compass" />
        <FlavorConstellation
          foodNotes={recommendation.ideal_pairings}
          title="Flavor constellation"
          wineNotes={[...pairedWine.flavor_notes, ...pairedWine.tags]}
        />
        <div className="profile-grid">
          <ProfileChip label="Wine" value={recommendation.wine_name} />
          <ProfileChip label="Confidence" value={`${Math.round(recommendation.confidence * 100)}%`} />
          <ProfileChip label="Style" value={pairedWine.style} />
          <ProfileChip label="Acidity" value={pairedWine.acidity} />
        </div>
        <FoodPairingTiles items={recommendation.ideal_pairings} title="Ideal pairings" tone="classic" />
        <FoodPairingTiles items={recommendation.weeknight_pairings} title="Weeknight options" tone="casual" />
        <DetailBlock icon={<CircleOff size={18} />} title="Avoid" items={recommendation.avoid} warning />
        <div className="serving-note">
          <strong>Serving note</strong>
          <p>{recommendation.serving_note}</p>
          <ServingGuidanceCard wine={pairedWine} compact />
        </div>
      </aside>
    </section>
  );
}

function MealScreen({
  inputMode,
  mealInput,
  pairingMode,
  uploadedLabel,
  preview,
  onAnalyze,
  onFeaturedMeal,
  onInputMode,
  onMealInput,
  occasion,
  onOccasion,
  onPairingMode,
  onUpload,
  preferences,
  onBudgetRange
}: {
  inputMode: InputMode;
  mealInput: string;
  pairingMode: PairingMode;
  uploadedLabel: string;
  preview: MealAnalysis;
  onAnalyze: () => void;
  onFeaturedMeal: (meal: string) => void;
  onInputMode: (mode: InputMode) => void;
  onMealInput: (value: string) => void;
  occasion: OccasionMode;
  onOccasion: (occasion: OccasionMode) => void;
  onPairingMode: (mode: PairingMode) => void;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  preferences: UserPreferences;
  onBudgetRange: (min: number, max: number) => void;
}) {
  return (
    <section className="workspace-grid">
      <section className="panel meal-panel">
        <div className="section-heading">
          <span>
            <ChefHat size={20} />
          </span>
          <div>
            <p className="eyebrow">Meal input</p>
            <h2>What are you eating?</h2>
          </div>
        </div>

        <div className="input-mode-grid">
          <InputModeCard
            active={inputMode === "screenshot"}
            description="Upload a menu item image"
            icon={<ScanText size={21} />}
            label="Menu Screenshot"
            onClick={() => onInputMode("screenshot")}
          />
          <InputModeCard
            active={inputMode === "recipe"}
            description="Paste or load recipe text"
            icon={<FileText size={21} />}
            label="Recipe Upload"
            onClick={() => onInputMode("recipe")}
          />
          <InputModeCard
            active={inputMode === "manual"}
            description="Type dinner in plain English"
            icon={<Keyboard size={21} />}
            label="Manual Entry"
            onClick={() => onInputMode("manual")}
          />
        </div>

        <div className="upload-line">
          <label className="file-button">
            <Upload size={17} />
            Upload file
            <input accept=".txt,.md,.recipe,image/*" onChange={onUpload} type="file" />
          </label>
          <span>{uploadedLabel}</span>
        </div>

        <OccasionModes occasion={occasion} onOccasion={onOccasion} />
        <BudgetRangeControl
          max={preferences.budget_max}
          min={preferences.budget_min}
          onChange={onBudgetRange}
        />

        <label className="field-label" htmlFor="meal-input">
          Dinner description
        </label>
        <textarea
          id="meal-input"
          onChange={(event) => onMealInput(event.target.value)}
          placeholder="Example: roasted salmon with lemon, dill, and asparagus"
          value={mealInput}
        />

        <div className="featured-row">
          {featuredMeals.map((meal) => (
            <button key={meal} type="button" onClick={() => onFeaturedMeal(meal)}>
              {shortMeal(meal)}
            </button>
          ))}
        </div>

        <fieldset className="segmented-control">
          <legend>Pairing mode</legend>
          {[
            ["inventory", "Use inVINtory"],
            ["perfect", "Perfect Pairing"],
            ["show_both", "Show Both"]
          ].map(([mode, label]) => (
            <button
              className={pairingMode === mode ? "active" : ""}
              key={mode}
              onClick={() => onPairingMode(mode as PairingMode)}
              type="button"
            >
              {label}
            </button>
          ))}
        </fieldset>

        <button className="primary-button" type="button" onClick={onAnalyze}>
          <Search size={20} />
          Find My Pairing
        </button>
      </section>

      <aside className="panel profile-panel">
        <div className="section-heading compact">
          <span>
            <Sparkles size={19} />
          </span>
          <div>
            <p className="eyebrow">AI meal profile</p>
            <h2>{preview.dish_name}</h2>
          </div>
        </div>
        <div className="profile-grid">
          <ProfileChip label="Cuisine" value={preview.cuisine} />
          <ProfileChip label="Richness" value={preview.richness} />
          <ProfileChip label="Acidity" value={preview.acidity} />
          <ProfileChip label="Spice" value={preview.spice_level} />
        </div>
        <PairingCompass metrics={mealCompassMetrics(preview)} title="Pairing compass" />
        <FlavorConstellation
          foodNotes={preview.main_ingredients}
          title="Flavor constellation"
          wineNotes={[...preview.dominant_flavors, ...preview.pairing_considerations]}
        />
        <DetailBlock icon={<ListChecks size={18} />} title="Dominant flavors" items={preview.dominant_flavors} />
        <DetailBlock icon={<CircleOff size={18} />} title="Pairing risks" items={preview.pairing_risks} warning />
      </aside>
    </section>
  );
}

function PreferencesScreen({
  preferences,
  setPreferences
}: {
  preferences: UserPreferences;
  setPreferences: (preferences: UserPreferences) => void;
}) {
  return (
    <section className="panel preferences-panel">
      <div className="section-heading">
        <span>
          <Settings2 size={20} />
        </span>
        <div>
          <p className="eyebrow">Tune the bottle</p>
          <h2>Preferences</h2>
        </div>
      </div>

      <PreferenceGroup
        options={styleOptions}
        selected={preferences.preferred_styles}
        title="Preferred styles"
        onToggle={(option) =>
          setPreferences({
            ...preferences,
            preferred_styles: toggleValue(preferences.preferred_styles, option)
          })
        }
      />
      <PreferenceGroup
        options={philosophyOptions}
        selected={preferences.wine_philosophy}
        title="Wine philosophy"
        onToggle={(option) =>
          setPreferences({
            ...preferences,
            wine_philosophy: toggleValue(preferences.wine_philosophy, option)
          })
        }
      />
      <PreferenceGroup
        options={flavorOptions}
        selected={preferences.flavor_preferences}
        title="Flavor profile"
        onToggle={(option) =>
          setPreferences({
            ...preferences,
            flavor_preferences: toggleValue(preferences.flavor_preferences, option)
          })
        }
      />

      <div className="field-grid">
        <label>
          <span>Budget</span>
          <select
            onChange={(event) => {
              const budgetRange = event.target.value as BudgetRange;
              const bounds = budgetBoundsFromBucket(budgetRange);
              setPreferences({
                ...preferences,
                budget_range: budgetRange,
                budget_min: bounds.min,
                budget_max: bounds.max
              });
            }}
            value={preferences.budget_range}
          >
            {budgetOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Avoid</span>
          <input
            onChange={(event) => setPreferences({ ...preferences, avoid: event.target.value })}
            placeholder="Example: no oaky Chardonnay"
            value={preferences.avoid}
          />
        </label>
      </div>
    </section>
  );
}

function AccountScreen({
  available,
  cloudStatus,
  inventoryCount,
  isBusy,
  onLoad,
  onSave,
  onSignIn,
  onSignOut,
  session
}: {
  available: boolean;
  cloudStatus: string;
  inventoryCount: number;
  isBusy: boolean;
  onLoad: () => void;
  onSave: () => void;
  onSignIn: (email: string, password: string, mode: "signin" | "signup") => void;
  onSignOut: () => void;
  session: CloudSession | null;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <section className="panel account-panel">
      <div className="section-heading">
        <span>
          <UserCircle size={20} />
        </span>
        <div>
          <p className="eyebrow">Cloud cellar</p>
          <h2>Account and sync</h2>
        </div>
      </div>

      <div className="account-status">
        <strong>{session ? session.email : available ? "Cloud-ready" : "Local mode"}</strong>
        <p>{cloudStatus}</p>
      </div>

      {!available && (
        <div className="cloud-setup-note">
          <strong>Cloud sync needs Supabase keys</strong>
          <p>Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel, then redeploy. The app will keep using local storage until those are set.</p>
        </div>
      )}

      {session ? (
        <div className="account-actions">
          <Metric label="Cloud cellar bottles" value={`${inventoryCount}`} />
          <button className="primary-button compact-button" type="button" onClick={onSave} disabled={isBusy}>
            <Database size={18} />
            Save Now
          </button>
          <button className="secondary-button" type="button" onClick={onLoad} disabled={isBusy}>
            <RefreshCcw size={17} />
            Load Cloud
          </button>
          <button className="secondary-button danger-button" type="button" onClick={onSignOut}>
            Sign Out
          </button>
        </div>
      ) : (
        <div className="account-form">
          <label>
            <span>Email</span>
            <input
              autoComplete="email"
              disabled={!available || isBusy}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              type="email"
              value={email}
            />
          </label>
          <label>
            <span>Password</span>
            <input
              autoComplete="current-password"
              disabled={!available || isBusy}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              type="password"
              value={password}
            />
          </label>
          <div className="account-form-actions">
            <button
              className="primary-button compact-button"
              disabled={!available || isBusy || !email || !password}
              onClick={() => onSignIn(email, password, "signin")}
              type="button"
            >
              Sign In
            </button>
            <button
              className="secondary-button"
              disabled={!available || isBusy || !email || !password}
              onClick={() => onSignIn(email, password, "signup")}
              type="button"
            >
              Create Account
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function ResultsScreen({
  analysis,
  copied,
  isThinking,
  recommendation,
  onCopy,
  onNewPairing
}: {
  analysis: MealAnalysis;
  copied: boolean;
  isThinking: boolean;
  recommendation: PairingRecommendation;
  onCopy: () => void;
  onNewPairing: () => void;
}) {
  if (isThinking) {
    return <LoadingState />;
  }

  const funkScore = funkScoreForRecommendation(recommendation, analysis);

  return (
    <section className="results-layout">
      <article className="result-hero">
        <div>
          <p className="eyebrow">Best pairing</p>
          <h2>{recommendation.perfect_pairing.style}</h2>
          <p>{recommendation.reason}</p>
          <p className="occasion-note light">{recommendation.occasion_note}</p>
          <div className="result-actions">
            <button className="secondary-button" type="button" onClick={onCopy}>
              <Copy size={17} />
              {copied ? "Copied" : "Copy"}
            </button>
            <button className="secondary-button" type="button" onClick={onNewPairing}>
              <RefreshCcw size={17} />
              New meal
            </button>
          </div>
        </div>
        <PairingGaugePanel
          confidence={recommendation.confidence}
          funkLabel={funkLabel(funkScore)}
          funkScore={funkScore}
        />
      </article>

      <section className="result-grid">
        <article className="panel result-card inventory-match">
          <div className="card-title">
            <Database size={19} />
            <h3>Best from your inVINtory</h3>
          </div>
          <strong>{recommendation.inventory_match?.name ?? "No exact bottle yet"}</strong>
          <p>
            {recommendation.inventory_match?.reason ??
              "Add a bottle with matching acidity, body, or style and the app will rank it here."}
          </p>
        </article>

        <article className="panel result-card">
          <div className="card-title">
            <ShoppingBag size={19} />
            <h3>Perfect pairing to buy</h3>
          </div>
          <strong>{recommendation.specific_suggestion}</strong>
          <p>
            Look around {recommendation.perfect_pairing.estimated_price}.{" "}
            {recommendation.mode_note}
          </p>
        </article>

        <article className="panel result-card">
          <div className="card-title">
            <ListChecks size={19} />
            <h3>Also consider</h3>
          </div>
          <TagList items={recommendation.alternatives} />
        </article>

        <article className="panel result-card warning">
          <div className="card-title">
            <CircleOff size={19} />
            <h3>Avoid with this dish</h3>
          </div>
          <TagList items={recommendation.avoid} />
        </article>
      </section>

      <section className="panel analysis-panel">
        <div className="section-heading compact">
          <span>
            <ChefHat size={19} />
          </span>
          <div>
            <p className="eyebrow">Dish analyzed</p>
            <h2>{analysis.dish_name}</h2>
          </div>
        </div>
        <div className="analysis-columns">
          <DetailBlock title="Main ingredients" items={analysis.main_ingredients} />
          <DetailBlock title="Pairing considerations" items={analysis.pairing_considerations} />
          <DetailBlock title="Dominant flavors" items={analysis.dominant_flavors} />
        </div>
      </section>
    </section>
  );
}

function InventoryScreen({
  inventory,
  setInventory
}: {
  inventory: WineItem[];
  setInventory: (inventory: WineItem[]) => void;
}) {
  const [newWine, setNewWine] = useState("");
  const [isAddingWine, setIsAddingWine] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeCandidate, setBarcodeCandidate] = useState<LabelScanCandidate | null>(null);
  const [barcodeStatus, setBarcodeStatus] = useState("Open Food Facts lookup is ready");
  const [isLookingUpBarcode, setIsLookingUpBarcode] = useState(false);
  const [labelQueue, setLabelQueue] = useState<LabelScanCandidate[]>([]);
  const [isScanningLabels, setIsScanningLabels] = useState(false);
  const [query, setQuery] = useState("");
  const [styleFilter, setStyleFilter] = useState<WineStyle | "All">("All");
  const [expandedWineId, setExpandedWineId] = useState<string | null>(null);
  const [sourceLookupStatus, setSourceLookupStatus] = useState("Source lookup ready");
  const [lookingUpWineIds, setLookingUpWineIds] = useState<string[]>([]);
  const [isRefreshingAllSources, setIsRefreshingAllSources] = useState(false);
  const [autoSourceRefresh, setAutoSourceRefresh] = useState(() =>
    loadFromStorage(storageKeys.autoSourceRefresh, true)
  );
  const [sourceRefreshTimes, setSourceRefreshTimes] = useState<Record<string, number>>(() =>
    loadFromStorage(storageKeys.sourceRefresh, {})
  );
  const autoRefreshInFlight = useRef(false);
  const cellarSummary = useMemo(() => summarizeCellar(inventory), [inventory]);
  const filteredInventory = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();

    return inventory.filter((wine) => {
      const matchesStyle = styleFilter === "All" || wine.style === styleFilter;
      const searchText = `${wine.name} ${wine.style} ${wine.body} ${wine.acidity} ${wine.region ?? ""} ${wine.country ?? ""} ${(wine.grape ?? []).join(" ")} ${wine.tags.join(" ")} ${(wine.flavor_notes ?? []).join(" ")}`.toLowerCase();
      const matchesQuery = !normalizedQuery || searchText.includes(normalizedQuery);
      return matchesStyle && matchesQuery;
    });
  }, [inventory, query, styleFilter]);

  useEffect(() => {
    localStorage.setItem(storageKeys.autoSourceRefresh, JSON.stringify(autoSourceRefresh));
  }, [autoSourceRefresh]);

  useEffect(() => {
    localStorage.setItem(storageKeys.sourceRefresh, JSON.stringify(sourceRefreshTimes));
  }, [sourceRefreshTimes]);

  useEffect(() => {
    if (!autoSourceRefresh || !inventory.length) return;

    const firstCheck = window.setTimeout(() => {
      void refreshStaleSources("startup");
    }, 1200);
    const scheduledCheck = window.setInterval(() => {
      void refreshStaleSources("scheduled");
    }, sourceRefreshIntervalMs);

    return () => {
      window.clearTimeout(firstCheck);
      window.clearInterval(scheduledCheck);
    };
  }, [autoSourceRefresh, inventory, sourceRefreshTimes]);

  const addWine = async () => {
    const trimmed = newWine.trim();
    if (!trimmed) return;

    setIsAddingWine(true);
    setSourceLookupStatus(`Analyzing ${trimmed} and checking source data...`);
    try {
      const baseWine = createWineFromText(trimmed, inventory.length + 1);
      const enrichedWine = await enrichWineWithSources(baseWine);
      setInventory([...inventory, enrichedWine]);
      setExpandedWineId(enrichedWine.id);
      setSourceLookupStatus(sourceLookupMessage(enrichedWine));
      setNewWine("");
    } catch {
      const fallbackWine = createWineFromText(trimmed, inventory.length + 1);
      setInventory([...inventory, fallbackWine]);
      setExpandedWineId(fallbackWine.id);
      setSourceLookupStatus(`Added ${fallbackWine.name} with inferred tasting notes. Source lookup can be retried from the bottle card.`);
    } finally {
      setIsAddingWine(false);
    }
  };

  const lookupBarcode = async () => {
    const trimmed = barcodeInput.trim();
    if (!trimmed) return;

    setIsLookingUpBarcode(true);
    setBarcodeStatus("Checking public product data...");
    try {
      const result = await lookupWineByBarcode(trimmed, inventory.length + 1);
      setBarcodeCandidate({
        id: `barcode_${Date.now()}`,
        fileName: result.barcode,
        imageUrl: "",
        wine: result.wine,
        confidence: result.confidence,
        externalMatches: result.matches,
        note: result.note
      });
      setBarcodeStatus(`${result.barcode} matched. Review before adding.`);
    } catch (error) {
      setBarcodeCandidate(null);
      setBarcodeStatus(error instanceof Error ? error.message : "No bottle found for that barcode yet.");
    } finally {
      setIsLookingUpBarcode(false);
    }
  };

  const scanWineLabels = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    setIsScanningLabels(true);
    try {
      const candidates = await Promise.all(
        files.map(async (file, index) => {
          const labelText = await readWineLabelText(file);
          const labelImageUrl = await readFileAsDataUrl(file);
          const barcode = extractBarcodeCandidate(`${labelText} ${file.name}`);

          if (barcode) {
            try {
              const barcodeResult = await lookupWineByBarcode(
                barcode,
                inventory.length + labelQueue.length + index + 1
              );

              return {
                id: `label_${Date.now()}_${index}`,
                fileName: file.name,
                imageUrl: URL.createObjectURL(file),
                wine: {
                  ...barcodeResult.wine,
                  label_image_url: labelImageUrl,
                  label_image_source: "Uploaded label scan",
                  tags: Array.from(new Set([...barcodeResult.wine.tags, "label scan"]))
                },
                confidence: barcodeResult.confidence,
                externalMatches: barcodeResult.matches,
                note: barcodeResult.note
              };
            } catch {
              // Fall through to label OCR when the public barcode database has no hit.
            }
          }

          const suggestion = labelText
            ? identifyWineFromLabelText(labelText, file.name, inventory.length + labelQueue.length + index + 1)
            : identifyWineFromImageName(file.name, inventory.length + labelQueue.length + index + 1);

          const lookup = await lookupBestWineProfile(
            suggestion.lookupQueries.length ? suggestion.lookupQueries : [suggestion.wine.name]
          );
          const enrichedWine = applyWineSourceProfile(suggestion.wine, lookup);

          return {
            id: `label_${Date.now()}_${index}`,
            fileName: file.name,
            imageUrl: URL.createObjectURL(file),
            ...suggestion,
            note: scanNoteForLookup(suggestion.note, suggestion.lookupQueries, lookup),
            externalMatches: lookup.matches,
            wine: {
              ...enrichedWine,
              label_image_url: labelImageUrl,
              label_image_source: "Uploaded label scan"
            }
          };
        })
      );

      setLabelQueue((current) => [...candidates, ...current]);
    } finally {
      setIsScanningLabels(false);
      event.target.value = "";
    }
  };

  const updateLabelCandidate = (candidateId: string, name: string) => {
    setLabelQueue((current) =>
      current.map((candidate, index) => {
        if (candidate.id !== candidateId) return candidate;
        const updatedWine = createWineFromText(name, inventory.length + index + 1);
        const externalMatches = buildExternalLookupLinks(updatedWine.name);
        const enrichedWine = applyWineSourceProfile(
          {
            ...updatedWine,
            id: candidate.wine.id,
            quantity: candidate.wine.quantity,
            label_image_url: candidate.wine.label_image_url,
            label_image_source: candidate.wine.label_image_source,
            tags: Array.from(new Set([...updatedWine.tags, "label scan"]))
          },
          { matches: externalMatches }
        );

        return {
          ...candidate,
          wine: enrichedWine,
          confidence: updatedWine.style === "Unknown" ? 0.62 : 0.84,
          externalMatches,
          note:
            updatedWine.style === "Unknown"
              ? "Review the bottle details before adding."
              : "Updated traits from the edited label text."
        };
      })
    );
  };

  const addLabelCandidate = async (candidate: LabelScanCandidate) => {
    const enrichedWine = candidate.wine.source_matches.length
      ? candidate.wine
      : await enrichWineWithSources(candidate.wine);
    setInventory([...inventory, { ...enrichedWine, id: `wine_${Date.now()}` }]);
    setLabelQueue(labelQueue.filter((item) => item.id !== candidate.id));
    URL.revokeObjectURL(candidate.imageUrl);
  };

  const addBarcodeCandidate = () => {
    if (!barcodeCandidate) return;

    setInventory([...inventory, { ...barcodeCandidate.wine, id: `wine_${Date.now()}` }]);
    setBarcodeInput("");
    setBarcodeCandidate(null);
    setBarcodeStatus("Bottle added from barcode lookup");
  };

  const dismissLabelCandidate = (candidate: LabelScanCandidate) => {
    setLabelQueue(labelQueue.filter((item) => item.id !== candidate.id));
    URL.revokeObjectURL(candidate.imageUrl);
  };

  const addAllLabelCandidates = async () => {
    const enrichedCandidates = await Promise.all(
      labelQueue.map(async (candidate) =>
        candidate.wine.source_matches.length ? candidate.wine : enrichWineWithSources(candidate.wine)
      )
    );
    setInventory([
      ...inventory,
      ...enrichedCandidates.map((wine, index) => ({
        ...wine,
        id: `wine_${Date.now()}_${index}`
      }))
    ]);
    labelQueue.forEach((candidate) => URL.revokeObjectURL(candidate.imageUrl));
    setLabelQueue([]);
  };

  const updateQuantity = (wineId: string, delta: number) => {
    setInventory(
      inventory
        .map((wine) =>
          wine.id === wineId ? { ...wine, quantity: Math.max(0, wine.quantity + delta) } : wine
        )
        .filter((wine) => wine.quantity > 0)
    );
  };

  const deleteWine = (wineId: string) => {
    setInventory(inventory.filter((wine) => wine.id !== wineId));
  };

  const refreshWineSources = async (wine: WineItem) => {
    setLookingUpWineIds((current) => Array.from(new Set([...current, wine.id])));
    setSourceLookupStatus(`Checking sources for ${wine.name}...`);

    try {
      const enrichedWine = await enrichWineWithSources(wine);
      setInventory(
        inventory.map((item) =>
          item.id === wine.id
            ? {
                ...enrichedWine,
                id: wine.id,
                quantity: wine.quantity
              }
            : item
        )
      );
      setExpandedWineId(wine.id);
      setSourceRefreshTimes((current) => ({
        ...current,
        [sourceRefreshKey(wine)]: Date.now()
      }));
      setSourceLookupStatus(sourceLookupMessage(enrichedWine));
    } catch {
      setSourceLookupStatus(`Could not refresh ${wine.name}. Try again in a moment.`);
    } finally {
      setLookingUpWineIds((current) => current.filter((id) => id !== wine.id));
    }
  };

  const refreshAllSources = async () => {
    if (!inventory.length) return;

    setIsRefreshingAllSources(true);
    setLookingUpWineIds(inventory.map((wine) => wine.id));
    setSourceLookupStatus("Checking sources for every inVINtory bottle...");

    try {
      const refreshed = await Promise.all(
        inventory.map(async (wine) => {
          const enrichedWine = await enrichWineWithSources(wine);
          return { ...enrichedWine, id: wine.id, quantity: wine.quantity };
        })
      );
      setInventory(refreshed);
      setSourceRefreshTimes((current) => {
        const next = { ...current };
        refreshed.forEach((wine) => {
          next[sourceRefreshKey(wine)] = Date.now();
        });
        return next;
      });
      const matchedCount = refreshed.filter((wine) => wine.source_matches.some((match) => match.status === "matched")).length;
      setSourceLookupStatus(`${matchedCount} of ${refreshed.length} bottles refreshed with matched source data.`);
    } catch {
      setSourceLookupStatus("Some source lookups could not complete. Try refreshing individual bottles.");
    } finally {
      setLookingUpWineIds([]);
      setIsRefreshingAllSources(false);
    }
  };

  const refreshStaleSources = async (reason: "startup" | "scheduled") => {
    if (autoRefreshInFlight.current || isRefreshingAllSources || lookingUpWineIds.length) return;

    const staleWines = inventory
      .filter((wine) => shouldAutoRefreshWine(wine, sourceRefreshTimes))
      .slice(0, 3);

    if (!staleWines.length) {
      if (reason === "startup") {
        setSourceLookupStatus("Auto source updates are on. Bottle data is current.");
      }
      return;
    }

    autoRefreshInFlight.current = true;
    setLookingUpWineIds(staleWines.map((wine) => wine.id));
    setSourceLookupStatus(`Auto-updating ${staleWines.length} stale source profile${staleWines.length === 1 ? "" : "s"}...`);

    try {
      const refreshed = await Promise.all(
        staleWines.map(async (wine) => {
          const enrichedWine = await enrichWineWithSources(wine);
          return { original: wine, refreshed: { ...enrichedWine, id: wine.id, quantity: wine.quantity } };
        })
      );
      const refreshedById = new Map(refreshed.map((item) => [item.original.id, item.refreshed]));

      setInventory(inventory.map((wine) => refreshedById.get(wine.id) ?? wine));
      setSourceRefreshTimes((current) => {
        const next = { ...current };
        refreshed.forEach(({ refreshed: wine }) => {
          next[sourceRefreshKey(wine)] = Date.now();
        });
        return next;
      });

      const matchedCount = refreshed.filter(({ refreshed: wine }) =>
        wine.source_matches.some((match) => match.status === "matched")
      ).length;
      setSourceLookupStatus(
        matchedCount
          ? `Auto-updated ${refreshed.length} bottle${refreshed.length === 1 ? "" : "s"}; ${matchedCount} found matched source data.`
          : `Auto-updated ${refreshed.length} bottle${refreshed.length === 1 ? "" : "s"} with current verification links.`
      );
    } catch {
      setSourceLookupStatus("Auto source update paused after a lookup issue. It will retry later.");
    } finally {
      setLookingUpWineIds((current) => current.filter((id) => !staleWines.some((wine) => wine.id === id)));
      autoRefreshInFlight.current = false;
    }
  };

  const toggleWineDetails = (wine: WineItem) => {
    const opening = expandedWineId !== wine.id;
    setExpandedWineId(opening ? wine.id : null);

    if (
      opening &&
      autoSourceRefresh &&
      !lookingUpWineIds.includes(wine.id) &&
      shouldAutoRefreshWine(wine, sourceRefreshTimes)
    ) {
      void refreshWineSources(wine);
    }
  };

  const resetCellar = () => setInventory(starterInventory);

  return (
    <section className="panel inventory-panel">
      <div className="inventory-header">
        <div className="section-heading">
          <span>
            <Wine size={20} />
          </span>
          <div>
            <p className="eyebrow">Your cellar</p>
            <h2>inVINtory</h2>
          </div>
        </div>
        <div className="inventory-header-actions">
          <label className="auto-refresh-toggle">
            <input
              checked={autoSourceRefresh}
              onChange={(event) => setAutoSourceRefresh(event.target.checked)}
              type="checkbox"
            />
            Auto source updates
          </label>
          <button className="secondary-button" type="button" onClick={refreshAllSources} disabled={isRefreshingAllSources}>
            <Sparkles size={17} />
            {isRefreshingAllSources ? "Checking..." : "Refresh sources"}
          </button>
          <button className="secondary-button" type="button" onClick={resetCellar}>
            <RefreshCcw size={17} />
            Reset cellar
          </button>
        </div>
      </div>
      <p className="source-lookup-status">{sourceLookupStatus}</p>

      <div className="cellar-summary">
        <Metric label="Bottles" value={`${cellarSummary.totalBottles}`} />
        <Metric label="Top style" value={cellarSummary.readyStyles[0] ?? "Unknown"} />
        <Metric label="Styles" value={`${Object.keys(cellarSummary.styles).length}`} />
      </div>

      <div className="add-wine-row">
        <input
          onChange={(event) => setNewWine(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") addWine();
          }}
          placeholder="Example: 2019 Poggio Amorelli Chianti Classico, 2 bottles"
          value={newWine}
        />
        <button className="primary-button compact-button" type="button" onClick={addWine} disabled={isAddingWine}>
          <Plus size={19} />
          {isAddingWine ? "Analyzing..." : "Add Wine"}
        </button>
      </div>

      <section className="barcode-panel">
        <div className="section-heading compact">
          <span>
            <Barcode size={19} />
          </span>
          <div>
            <p className="eyebrow">Barcode lookup</p>
            <h3>Add from public bottle data</h3>
            <p>Enter the UPC or EAN on the bottle to check Open Food Facts, then verify with wine services.</p>
          </div>
        </div>
        <div className="add-wine-row barcode-row">
          <input
            inputMode="numeric"
            onChange={(event) => setBarcodeInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") lookupBarcode();
            }}
            placeholder="Example: 3760033590005"
            value={barcodeInput}
          />
          <button className="primary-button compact-button" type="button" onClick={lookupBarcode} disabled={isLookingUpBarcode}>
            <Search size={18} />
            {isLookingUpBarcode ? "Checking..." : "Lookup"}
          </button>
        </div>
        <p className="lookup-status">{barcodeStatus}</p>
        {barcodeCandidate && (
          <BarcodeLookupCard
            candidate={barcodeCandidate}
            onAdd={addBarcodeCandidate}
            onDismiss={() => {
              setBarcodeCandidate(null);
              setBarcodeStatus("Barcode candidate dismissed");
            }}
          />
        )}
      </section>

      <section className="label-scan-panel">
        <div className="label-scan-header">
          <div>
            <p className="eyebrow">AI label scan</p>
            <h3>Add bottles from photos</h3>
            <p>Upload bottle or shelf photos, review the recognized wine, then add it to your inVINtory.</p>
          </div>
          <label className="file-button">
            <ScanText size={17} />
            Scan labels
            <input accept="image/*" multiple onChange={scanWineLabels} type="file" />
          </label>
        </div>

        {isScanningLabels && (
          <div className="scan-status">
            <Sparkles size={17} />
            Reading label photos...
          </div>
        )}

        {labelQueue.length > 0 && (
          <>
            <div className="scan-actions">
              <span>{labelQueue.length} bottle{labelQueue.length === 1 ? "" : "s"} ready to review</span>
              <button className="secondary-button" type="button" onClick={addAllLabelCandidates}>
                <Plus size={16} />
                Add all
              </button>
            </div>
            <div className="label-candidate-grid">
              {labelQueue.map((candidate) => (
                <LabelScanCard
                  candidate={candidate}
                  key={candidate.id}
                  onAdd={() => addLabelCandidate(candidate)}
                  onDismiss={() => dismissLabelCandidate(candidate)}
                  onNameChange={(name) => updateLabelCandidate(candidate.id, name)}
                />
              ))}
            </div>
          </>
        )}
      </section>

      <div className="inventory-tools">
        <label>
          <span>Search cellar</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Chablis, sparkling, mineral..."
            value={query}
          />
        </label>
        <label>
          <span>Style</span>
          <select onChange={(event) => setStyleFilter(event.target.value as WineStyle | "All")} value={styleFilter}>
            <option>All</option>
            {styleOptions.map((style) => (
              <option key={style}>{style}</option>
            ))}
            <option>Unknown</option>
          </select>
        </label>
      </div>

      <div className="wine-grid">
        {filteredInventory.map((wine) => (
          <WineCard
            expanded={expandedWineId === wine.id}
            key={wine.id}
            onDelete={() => deleteWine(wine.id)}
            onRefreshSources={() => refreshWineSources(wine)}
            onQuantityDown={() => updateQuantity(wine.id, -1)}
            onQuantityUp={() => updateQuantity(wine.id, 1)}
            onToggleDetails={() => toggleWineDetails(wine)}
            refreshingSources={lookingUpWineIds.includes(wine.id)}
            wine={wine}
          />
        ))}
      </div>
    </section>
  );
}

function BarcodeLookupCard({
  candidate,
  onAdd,
  onDismiss
}: {
  candidate: LabelScanCandidate;
  onAdd: () => void;
  onDismiss: () => void;
}) {
  return (
    <article className="barcode-candidate-card">
      <div className="label-candidate-top">
        <span>{Math.round(candidate.confidence * 100)}% confidence</span>
        <small>{candidate.fileName}</small>
      </div>
      <h4>{candidate.wine.name}</h4>
      <p>{candidate.note}</p>
      <div className="wine-meta">
        <span>{candidate.wine.style}</span>
        <span>{candidate.wine.body} body</span>
        <span>{candidate.wine.acidity} acidity</span>
      </div>
      <TagList items={candidate.wine.tags} />
      <ExternalMatchList matches={candidate.externalMatches} />
      <div className="label-card-actions">
        <button className="secondary-button danger-button" type="button" onClick={onDismiss}>
          Dismiss
        </button>
        <button className="primary-button compact-button" type="button" onClick={onAdd}>
          <Plus size={17} />
          Add to inVINtory
        </button>
      </div>
    </article>
  );
}

function LabelScanCard({
  candidate,
  onAdd,
  onDismiss,
  onNameChange
}: {
  candidate: LabelScanCandidate;
  onAdd: () => void;
  onDismiss: () => void;
  onNameChange: (name: string) => void;
}) {
  return (
    <article className="label-candidate-card">
      <img alt={`Uploaded label for ${candidate.wine.name}`} src={candidate.imageUrl} />
      <div>
        <div className="label-candidate-top">
          <span>{Math.round(candidate.confidence * 100)}% confidence</span>
          <small>{candidate.fileName}</small>
        </div>
        <label>
          <span>Recognized wine</span>
          <input onChange={(event) => onNameChange(event.target.value)} value={candidate.wine.name} />
        </label>
        <p>{candidate.note}</p>
        <div className="wine-meta">
          <span>{candidate.wine.style}</span>
          <span>{candidate.wine.body} body</span>
          <span>{candidate.wine.acidity} acidity</span>
        </div>
        <TagList items={candidate.wine.tags} />
        <ExternalMatchList matches={candidate.externalMatches} />
        <div className="label-card-actions">
          <button className="secondary-button danger-button" type="button" onClick={onDismiss}>
            Dismiss
          </button>
          <button className="primary-button compact-button" type="button" onClick={onAdd}>
            <Plus size={17} />
            Add to inVINtory
          </button>
        </div>
      </div>
    </article>
  );
}

function ExternalMatchList({ matches }: { matches: ExternalWineMatch[] }) {
  if (!matches.length) return null;

  return (
    <div className="external-match-list">
      <h4>Sources and wine services</h4>
      <div>
        {matches.map((match) => (
          <a href={match.url} key={`${match.provider}-${match.url}`} rel="noreferrer" target="_blank">
            <span>{match.provider}</span>
            <strong>{match.label}</strong>
            {typeof match.confidence === "number" && <small>{Math.round(match.confidence * 100)}%</small>}
          </a>
        ))}
      </div>
    </div>
  );
}

function InputModeCard({
  active,
  description,
  icon,
  label,
  onClick
}: {
  active: boolean;
  description: string;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className={active ? "input-mode-card active" : "input-mode-card"} type="button" onClick={onClick}>
      {icon}
      <strong>{label}</strong>
      <span>{description}</span>
    </button>
  );
}

function PreferenceGroup<T extends string>({
  options,
  selected,
  title,
  onToggle
}: {
  options: T[];
  selected: T[];
  title: string;
  onToggle: (option: T) => void;
}) {
  return (
    <fieldset className="preference-group">
      <legend>{title}</legend>
      <div>
        {options.map((option) => (
          <button
            className={selected.includes(option) ? "chip selected" : "chip"}
            key={option}
            onClick={() => onToggle(option)}
            type="button"
          >
            {selected.includes(option) && <Check size={14} />}
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function WineCard({
  expanded,
  onDelete,
  onQuantityDown,
  onQuantityUp,
  onRefreshSources,
  onToggleDetails,
  refreshingSources,
  wine
}: {
  expanded: boolean;
  onDelete: () => void;
  onQuantityDown: () => void;
  onQuantityUp: () => void;
  onRefreshSources: () => void;
  onToggleDetails: () => void;
  refreshingSources: boolean;
  wine: WineItem;
}) {
  return (
    <article className={expanded ? "wine-card expanded" : "wine-card"}>
      <div className="wine-card-top">
        <div>
          <h3>{wine.name}</h3>
          <p>
            {wine.style} · {wine.body} body · {wine.acidity} acidity
          </p>
        </div>
        <div className="quantity-control" aria-label={`Quantity for ${wine.name}`}>
          <button type="button" onClick={onQuantityDown} title="Decrease quantity">
            <Minus size={15} />
          </button>
          <span>x{wine.quantity}</span>
          <button type="button" onClick={onQuantityUp} title="Increase quantity">
            <Plus size={15} />
          </button>
        </div>
      </div>
      <div className="wine-meta">
        <span>Tannin: {wine.tannin}</span>
        <span>{wine.sweetness}</span>
        <span>{wine.verification_status}</span>
      </div>
      <WineProfileVisual wine={wine} compact />
      <TagList items={wine.tags} />
      <div className="wine-card-actions">
        <button className="secondary-button" type="button" onClick={onToggleDetails}>
          <ListChecks size={15} />
          {expanded ? "Hide details" : "Details"}
        </button>
        <button className="secondary-button" type="button" onClick={onRefreshSources} disabled={refreshingSources}>
          <Sparkles size={15} />
          {refreshingSources ? "Checking..." : "Source lookup"}
        </button>
        <button className="delete-wine" type="button" onClick={onDelete}>
          <Trash2 size={15} />
          Remove
        </button>
      </div>
      {expanded && <WineDetailPanel wine={wine} />}
    </article>
  );
}

function WineDetailPanel({ wine }: { wine: WineItem }) {
  const producer = wine.producer || inferProducerFromName(wine.name);
  const grapes = wine.grape?.length ? wine.grape.join(", ") : inferGrapeSummary(wine);

  return (
    <div className="wine-detail-panel">
      <WineFunkMeter wine={wine} />
      <ServingGuidanceCard wine={wine} />
      <div className="wine-detail-grid">
        <ProfileChip label="Producer" value={producer} />
        <ProfileChip label="Vintage" value={wine.vintage ?? "NV / unknown"} />
        <ProfileChip label="Grape" value={grapes} />
        <ProfileChip label="Origin" value={wineOriginLabel(wine)} />
        <ProfileChip label="Drinking window" value={drinkingWindowForWine(wine)} />
        <ProfileChip label="Source status" value={wine.verification_status} />
      </div>
      <div className="wine-analysis">
        <div>
          <h4>Tasting notes</h4>
          <TagList items={wine.flavor_notes?.length ? wine.flavor_notes : ["needs review"]} />
        </div>
        <div>
          <h4>Pairing profile</h4>
          <p>{wine.pairing_notes?.[0] ?? "Add or verify details to improve cellar pairing."}</p>
        </div>
      </div>
      <ExternalMatchList matches={wine.source_matches ?? []} />
    </div>
  );
}

function LoadingState() {
  return (
    <section className="panel loading-panel" aria-live="polite">
      <div className="pulse-icon">
        <Sparkles size={28} />
      </div>
      <h2>Asking your AI sommelier...</h2>
      <div className="loading-steps">
        {thinkingSteps.map((step, index) => (
          <div className="loading-step" key={step}>
            <span>{index < thinkingSteps.length - 1 ? <Check size={14} /> : <Sparkles size={14} />}</span>
            {step}
          </div>
        ))}
      </div>
    </section>
  );
}

function ArchitecturePanel() {
  const layers = [
    {
      icon: <Sparkles size={18} />,
      title: "OCI Generative AI",
      body: "Meal extraction, sommelier reasoning, and plain-English explanations."
    },
    {
      icon: <ScanText size={18} />,
      title: "OCI Vision",
      body: "Menu screenshot OCR before the user corrects or confirms the dish."
    },
    {
      icon: <Database size={18} />,
      title: "Oracle Database",
      body: "Durable inVINtory, preferences, pairing history, and retailer metadata."
    },
    {
      icon: <BadgeDollarSign size={18} />,
      title: "Retail Expansion",
      body: "Local bottle availability and budget-aware shopping recommendations."
    }
  ];

  return (
    <section className="architecture-panel">
      <div>
        <p className="eyebrow">AI service path</p>
        <h2>Pairing intelligence with a clean production upgrade path.</h2>
      </div>
      <div className="architecture-grid">
        {layers.map((layer) => (
          <article key={layer.title}>
            <span>{layer.icon}</span>
            <h3>{layer.title}</h3>
            <p>{layer.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function SnapshotStep({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="snapshot-step">
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function PairingGaugePanel({
  confidence,
  funkLabel,
  funkScore
}: {
  confidence: number;
  funkLabel: string;
  funkScore: number;
}) {
  return (
    <div className="pairing-gauge-panel" aria-label="Pairing meters">
      <ConfidenceMeter confidence={confidence} />
      <FunkMeter label={funkLabel} score={funkScore} />
    </div>
  );
}

function ConfidenceMeter({ confidence }: { confidence: number }) {
  const percent = Math.round(clamp(confidence * 100, 0, 100));
  const degrees = Math.round(percent * 3.6);

  return (
    <div className="confidence-meter-card">
      <div
        aria-label={`${percent}% pairing confidence`}
        className="confidence-orb"
        role="img"
        style={{
          background: `conic-gradient(var(--gold) ${degrees}deg, rgba(255, 255, 255, 0.18) ${degrees}deg)`
        }}
      >
        <span>
          <strong>{percent}%</strong>
          <small>confidence</small>
        </span>
      </div>
      <p>Pairing fit</p>
    </div>
  );
}

function FunkMeter({ label, score }: { label: string; score: number }) {
  const safeScore = clamp(score, 0, 100);

  return (
    <div className="funk-meter-card">
      <div className="meter-title">
        <span>Classic</span>
        <strong>{label}</strong>
        <span>Funky</span>
      </div>
      <div className="funk-track" aria-label={`Traditional to funky meter: ${label}`} role="img">
        <i style={{ width: `${safeScore}%` }} />
        <b style={{ left: `${safeScore}%` }}>
          <Wine size={15} />
        </b>
      </div>
      <div className="meter-scale">
        <small>benchmark</small>
        <small>adventurous</small>
      </div>
    </div>
  );
}

function WineFunkMeter({ wine }: { wine: WineItem }) {
  const score = funkScoreForWine(wine, {
    wine_name: wine.name,
    headline_dish: "",
    reason: wine.pairing_notes.join(" "),
    ideal_pairings: wine.pairing_notes,
    weeknight_pairings: [],
    avoid: [],
    serving_note: "",
    occasion_note: "",
    confidence: 0.82
  });

  return (
    <div className="wine-funk-meter">
      <FunkMeter label={funkLabel(score)} score={score} />
    </div>
  );
}

function ProfileChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="profile-chip">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function OccasionModes({
  occasion,
  onOccasion
}: {
  occasion: OccasionMode;
  onOccasion: (occasion: OccasionMode) => void;
}) {
  return (
    <fieldset className="occasion-modes">
      <legend>Occasion</legend>
      <div>
        {occasionOptions.map((option) => (
          <button
            className={occasion === option.mode ? "active" : ""}
            key={option.mode}
            onClick={() => onOccasion(option.mode)}
            type="button"
          >
            {option.icon}
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function BudgetRangeControl({
  max,
  min,
  onChange
}: {
  max: number;
  min: number;
  onChange: (min: number, max: number) => void;
}) {
  const safeMin = Math.max(10, Math.min(min, 145));
  const safeMax = Math.max(safeMin + 5, Math.min(max, 150));
  const minPercent = ((safeMin - 10) / 140) * 100;
  const maxPercent = ((safeMax - 10) / 140) * 100;

  return (
    <div className="budget-range-control" role="group" aria-label="Bottle budget range">
      <div className="budget-range-header">
        <span>Bottle budget</span>
        <strong>{formatBudgetRange(safeMin, safeMax)}</strong>
      </div>
      <div className="budget-slider" style={{ "--budget-min": `${minPercent}%`, "--budget-max": `${maxPercent}%` } as CSSProperties}>
        <input
          aria-label="Minimum bottle budget"
          max={145}
          min={10}
          onChange={(event) => onChange(Number(event.target.value), safeMax)}
          step={5}
          type="range"
          value={safeMin}
        />
        <input
          aria-label="Maximum bottle budget"
          max={150}
          min={15}
          onChange={(event) => onChange(safeMin, Number(event.target.value))}
          step={5}
          type="range"
          value={safeMax}
        />
      </div>
      <div className="budget-scale">
        <span>$10</span>
        <span>$75</span>
        <span>$150+</span>
      </div>
    </div>
  );
}

function PairingCompass({ metrics, title }: { metrics: CompassMetric[]; title: string }) {
  const center = 72;
  const radius = 48;
  const points = metrics
    .map((metric, index) => {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index) / metrics.length;
      const distance = radius * metric.value;
      return `${center + Math.cos(angle) * distance},${center + Math.sin(angle) * distance}`;
    })
    .join(" ");
  const axisPoints = metrics.map((metric, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / metrics.length;
    return {
      ...metric,
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
      labelX: center + Math.cos(angle) * (radius + 17),
      labelY: center + Math.sin(angle) * (radius + 17)
    };
  });

  return (
    <div className="pairing-compass" aria-label={title}>
      <div className="compass-art">
        <svg aria-hidden="true" viewBox="0 0 144 144">
          <circle cx={center} cy={center} r="48" />
          <circle cx={center} cy={center} r="32" />
          <circle cx={center} cy={center} r="16" />
          {axisPoints.map((point) => (
            <line key={point.label} x1={center} x2={point.x} y1={center} y2={point.y} />
          ))}
          <polygon points={points} />
          {axisPoints.map((point) => (
            <text key={point.label} x={point.labelX} y={point.labelY}>
              {point.label}
            </text>
          ))}
        </svg>
      </div>
      <div className="compass-readout">
        <strong>{title}</strong>
        <div>
          {metrics.map((metric) => (
            <span key={metric.label}>
              {metric.label}
              <b>{Math.round(metric.value * 100)}</b>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function FlavorConstellation({
  foodNotes,
  title,
  wineNotes
}: {
  foodNotes: string[];
  title: string;
  wineNotes: string[];
}) {
  const nodes = buildConstellationNodes(wineNotes, foodNotes);

  return (
    <div className="flavor-constellation">
      <div className="constellation-header">
        <strong>{title}</strong>
        <span>{nodes.length} flavor signals</span>
      </div>
      <div className="constellation-map">
        <svg aria-hidden="true" viewBox="0 0 300 170">
          {nodes.slice(1).map((node) => (
            <line key={`line-${node.label}`} x1="150" x2={node.x} y1="85" y2={node.y} />
          ))}
        </svg>
        {nodes.map((node, index) => (
          <span
            className={`constellation-node ${node.kind}`}
            key={`${node.label}-${index}`}
            style={{ left: `${node.x}px`, top: `${node.y}px` }}
          >
            {node.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function WineProfileVisual({ compact, wine }: { compact?: boolean; wine: WineItem }) {
  const origin = [wine.vintage, wine.region, wine.country].filter(Boolean).join(" · ");
  const grapes = wine.grape?.join(", ");

  return (
    <div className={compact ? "wine-profile-visual compact" : "wine-profile-visual"}>
      <WineLabelVisual compact={compact} wine={wine} />
      <div className="wine-swatch" style={{ background: wineStyleColor(wine.style) }}>
        <small>Style</small>
        <span>{wine.style}</span>
      </div>
      <div className="wine-visual-body">
        <div className="wine-visual-header">
          <strong>{wine.style} profile</strong>
          <span>{wine.verification_status}</span>
        </div>
        {(origin || grapes) && <p>{origin || grapes}</p>}
        <StructureMeter label="Body" value={bodyScore(wine.body)} />
        <StructureMeter label="Acid" value={acidityScore(wine.acidity)} />
        <StructureMeter label="Tannin" value={tanninScore(wine.tannin)} />
      </div>
    </div>
  );
}

function ServingGuidanceCard({ compact, wine }: { compact?: boolean; wine: WineItem }) {
  const guidance = servingGuidanceForWine(wine);

  return (
    <div className={compact ? "serving-guidance-card compact" : "serving-guidance-card"}>
      <div>
        <span>Serve</span>
        <strong>{guidance.temperature}</strong>
      </div>
      <div>
        <span>Open</span>
        <strong>{guidance.openTime}</strong>
      </div>
      <div>
        <span>Glass</span>
        <strong>{guidance.glass}</strong>
      </div>
      <p>
        <Clock size={14} />
        {guidance.note}
      </p>
    </div>
  );
}

function WineLabelVisual({ compact, wine }: { compact?: boolean; wine: WineItem }) {
  const hasImage = Boolean(wine.label_image_url);
  const source = wine.label_image_source || (hasImage ? "Source image" : "Photo pending");

  return (
    <div className={compact ? "wine-label-visual compact" : "wine-label-visual"}>
      {hasImage ? (
        <img alt={`Wine label for ${wine.name}`} src={wine.label_image_url} />
      ) : (
        <div className="label-fallback" aria-label={`Generated label placeholder for ${wine.name}`}>
          <span>Label</span>
          <strong>{shortWineLabel(wine.name)}</strong>
          <small>{wine.vintage ?? "No photo yet"}</small>
        </div>
      )}
      <em>{source}</em>
    </div>
  );
}

function StructureMeter({ label, value }: { label: string; value: number }) {
  return (
    <div className="structure-meter">
      <span>{label}</span>
      <i>
        <b style={{ width: `${Math.round(value * 100)}%` }} />
      </i>
    </div>
  );
}

function FoodPairingTiles({
  items,
  title,
  tone
}: {
  items: string[];
  title: string;
  tone: "classic" | "casual";
}) {
  return (
    <div className="food-tile-section">
      <h3>
        <ChefHat size={17} />
        {title}
      </h3>
      <div className="food-tile-grid">
        {items.map((item, index) => (
          <article className={`food-tile ${tone}`} key={item}>
            <span>{tone === "classic" ? `Classic ${index + 1}` : `Casual ${index + 1}`}</span>
            <strong>{item}</strong>
            <small>{foodTileHint(item)}</small>
          </article>
        ))}
      </div>
    </div>
  );
}

function DetailBlock({
  icon,
  items,
  title,
  warning
}: {
  icon?: ReactNode;
  items: string[];
  title: string;
  warning?: boolean;
}) {
  return (
    <div className={warning ? "detail-block warning" : "detail-block"}>
      <h3>
        {icon}
        {title}
      </h3>
      <TagList items={items} />
    </div>
  );
}

function TagList({ items }: { items: string[] }) {
  return (
    <div className="tag-list">
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}

function mealCompassMetrics(meal: MealAnalysis): CompassMetric[] {
  return [
    { label: "Rich", value: mealLevelScore(meal.richness) },
    { label: "Acid", value: mealLevelScore(meal.acidity) },
    { label: "Spice", value: mealLevelScore(meal.spice_level) },
    { label: "Sweet", value: mealLevelScore(meal.sweetness) },
    { label: "Umami", value: mealLevelScore(meal.umami) }
  ];
}

function wineCompassMetrics(wine: WineItem): CompassMetric[] {
  return [
    { label: "Body", value: bodyScore(wine.body) },
    { label: "Acid", value: acidityScore(wine.acidity) },
    { label: "Tannin", value: tanninScore(wine.tannin) },
    { label: "Sweet", value: sweetnessScore(wine.sweetness) },
    { label: "Flavor", value: flavorScore(wine) }
  ];
}

function mealLevelScore(value: string) {
  const scores: Record<string, number> = {
    low: 0.24,
    medium: 0.52,
    "medium-high": 0.74,
    high: 0.92
  };

  return scores[value] ?? 0.48;
}

function bodyScore(value: string) {
  const scores: Record<string, number> = {
    Light: 0.28,
    Medium: 0.55,
    "Medium-full": 0.76,
    Full: 0.94,
    Unknown: 0.4
  };

  return scores[value] ?? 0.45;
}

function acidityScore(value: string) {
  const scores: Record<string, number> = {
    Low: 0.22,
    Medium: 0.5,
    "Medium-high": 0.72,
    High: 0.94,
    Unknown: 0.42
  };

  return scores[value] ?? 0.45;
}

function tanninScore(value: string) {
  const scores: Record<string, number> = {
    Low: 0.22,
    Medium: 0.52,
    "Medium-high": 0.74,
    High: 0.94,
    Unknown: 0.4
  };

  return scores[value] ?? 0.45;
}

function sweetnessScore(value: string) {
  const scores: Record<string, number> = {
    Dry: 0.16,
    "Off-dry": 0.58,
    Sweet: 0.92,
    Unknown: 0.35
  };

  return scores[value] ?? 0.35;
}

function flavorScore(wine: WineItem) {
  const noteCount = wine.flavor_notes?.filter((note) => note !== "needs review").length ?? 0;
  const tagCount = wine.tags?.length ?? 0;
  return Math.min(0.95, 0.34 + noteCount * 0.1 + tagCount * 0.04);
}

function wineStyleColor(style: WineStyle) {
  const colors: Record<WineStyle, string> = {
    Red: "linear-gradient(160deg, #43101e, #8c2541)",
    White: "linear-gradient(160deg, #f7e9a6, #d4a63e)",
    Rose: "linear-gradient(160deg, #f4a4af, #b94462)",
    Orange: "linear-gradient(160deg, #e5933f, #9d4e24)",
    Sparkling: "linear-gradient(160deg, #fff4bd, #9fb890)",
    Unknown: "linear-gradient(160deg, #d7cec5, #7d7470)"
  };

  return colors[style];
}

function foodTileHint(item: string) {
  const text = item.toLowerCase();
  if (/(tomato|pizza|ziti|parmesan|arrabbiata|red sauce)/.test(text)) return "Tomato acid meets wine acid.";
  if (/(fried|chips|tempura|crispy)/.test(text)) return "Crunch, salt, and lift.";
  if (/(mushroom|truffle|lentils)/.test(text)) return "Earth and savor line up.";
  if (/(steak|lamb|burger|short rib|beef)/.test(text)) return "Protein softens structure.";
  if (/(salmon|shrimp|scallop|oyster|fish|sushi)/.test(text)) return "Freshness keeps it bright.";
  if (/(cheese|cream|butter|aioli)/.test(text)) return "Richness gets a clean edge.";
  if (/(spice|harissa|shawarma|kimchi|tacos)/.test(text)) return "Aromatic contrast, not weight.";
  return "Balanced intensity and flavor.";
}

function buildConstellationNodes(wineNotes: string[], foodNotes: string[]) {
  const cleanedWine = cleanFlavorNotes(wineNotes).slice(0, 5);
  const cleanedFood = cleanFlavorNotes(foodNotes).slice(0, 5);
  const labels = ["Match", ...cleanedWine, ...cleanedFood].slice(0, 11);

  return labels.map((label, index) => {
    if (index === 0) {
      return { label, kind: "core", x: 150, y: 85 };
    }

    const angle = -Math.PI / 2 + (Math.PI * 2 * (index - 1)) / Math.max(1, labels.length - 1);
    const radius = index % 2 === 0 ? 68 : 54;

    return {
      label,
      kind: index <= cleanedWine.length ? "wine" : "food",
      x: Math.round(150 + Math.cos(angle) * radius),
      y: Math.round(85 + Math.sin(angle) * radius)
    };
  });
}

function cleanFlavorNotes(notes: string[]) {
  return Array.from(
    new Set(
      notes
        .flatMap((note) => note.split(/,| and | with |\/|;|\./i))
        .map((note) =>
          note
            .replace(
              /\b(needs review|excellent|best|good|strong|works|pairing|wine|dish|with|and|the|a|an|to|for|from|that|this|can|very|avoid)\b/gi,
              ""
            )
            .replace(/\s+/g, " ")
            .trim()
        )
        .filter((note) => note.length >= 4 && note.length <= 24)
    )
  );
}

async function readWineLabelText(file: File) {
  return readImageText(file);
}

async function readImageText(file: File) {
  type Recognize = (image: File | Blob, lang?: string) => Promise<{ data: { text: string } }>;

  try {
    const tesseractModule = (await import("tesseract.js")) as unknown as {
      recognize?: Recognize;
      default?: { recognize: Recognize };
    };
    const recognize = tesseractModule.recognize ?? tesseractModule.default?.recognize;
    if (!recognize) return "";

    const preparedImage = await prepareImageForOcr(file);
    const result = await recognize(preparedImage, "eng");
    return result.data.text.trim();
  } catch {
    return "";
  }
}

async function prepareImageForOcr(file: File): Promise<File | Blob> {
  if (typeof document === "undefined" || typeof createImageBitmap === "undefined") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(3, Math.max(1.4, 1800 / Math.max(bitmap.width, bitmap.height)));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) return file;

    context.filter = "contrast(1.25) saturate(0)";
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 0.92));
    return blob ?? file;
  } catch {
    return file;
  }
}

async function lookupBestWineProfile(queries: string[]): Promise<WineLookupResult> {
  const cleanedQueries = Array.from(new Set(queries.map((query) => query.trim()).filter(Boolean))).slice(0, 5);
  if (!cleanedQueries.length) return { matches: [] };

  const lookups = await Promise.all(cleanedQueries.map((query) => lookupWineWithProfile(query)));
  return lookups
    .map((lookup, index) => ({ lookup, score: scoreWineLookup(lookup, cleanedQueries[index]) }))
    .sort((a, b) => b.score - a.score)[0].lookup;
}

function scoreWineLookup(lookup: WineLookupResult, query: string) {
  const matchedConfidence = lookup.matches.reduce(
    (best, match) => Math.max(best, match.status === "matched" ? match.confidence ?? 0.7 : 0),
    0
  );
  const profile = lookup.profile;
  let score = matchedConfidence * 100;
  if (profile?.producer) score += 18;
  if (profile?.vintage) score += 12;
  if (profile?.region) score += 10;
  if (profile?.country) score += 8;
  if (profile?.grape?.length) score += 8;
  if (profile?.label_image_url) score += 8;
  score += Math.min(12, query.split(/\s+/).length * 1.5);
  return score;
}

function scanNoteForLookup(baseNote: string, queries: string[], lookup: WineLookupResult) {
  const matched = lookup.matches.find((match) => match.status === "matched");
  if (matched) {
    return `${baseNote} Best source match: ${matched.label}.`;
  }

  if (queries.length > 1) {
    return `${baseNote} Tried ${queries.length} label-based searches; review the recognized name before adding.`;
  }

  return baseNote;
}

function toggleValue<T>(values: T[], option: T) {
  return values.includes(option) ? values.filter((value) => value !== option) : [...values, option];
}

function normalizePreferences(preferences: UserPreferences): UserPreferences {
  const fallback = budgetBoundsFromBucket(preferences.budget_range ?? defaultPreferences.budget_range);
  const budgetMin = Number.isFinite(preferences.budget_min) ? preferences.budget_min : fallback.min;
  const budgetMax = Number.isFinite(preferences.budget_max) ? preferences.budget_max : fallback.max;

  return {
    ...defaultPreferences,
    ...preferences,
    budget_min: Math.max(10, Math.min(budgetMin, budgetMax - 5)),
    budget_max: Math.min(150, Math.max(budgetMax, budgetMin + 5))
  };
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function budgetBoundsFromBucket(bucket: BudgetRange) {
  const ranges: Record<BudgetRange, { min: number; max: number }> = {
    "Under $20": { min: 10, max: 20 },
    "$20-$40": { min: 20, max: 40 },
    "$40-$75": { min: 40, max: 75 },
    "$75+": { min: 75, max: 150 }
  };

  return ranges[bucket] ?? { min: 20, max: 45 };
}

function budgetBucketForRange(min: number, max: number): BudgetRange {
  if (max <= 20) return "Under $20";
  if (min >= 75) return "$75+";
  if (max <= 45) return "$20-$40";
  return "$40-$75";
}

function formatBudgetRange(min: number, max: number) {
  return max >= 150 ? `$${min}+` : `$${min}-$${max}`;
}

function modeLabel(mode: PairingMode) {
  if (mode === "inventory") return "inVINtory";
  if (mode === "perfect") return "Buy";
  return "Both";
}

function occasionLabel(occasion: OccasionMode) {
  return occasionOptions.find((option) => option.mode === occasion)?.label ?? "Classic";
}

function funkScoreForRecommendation(recommendation: PairingRecommendation, analysis: MealAnalysis) {
  const corpus = [
    recommendation.recommended_style,
    recommendation.specific_suggestion,
    recommendation.reason,
    recommendation.perfect_pairing.style,
    recommendation.alternatives.join(" "),
    analysis.dish_name,
    analysis.dominant_flavors.join(" "),
    analysis.pairing_considerations.join(" ")
  ]
    .join(" ")
    .toLowerCase();

  let score = 30;
  if (hasText(corpus, ["chianti", "sangiovese", "rioja", "chablis", "champagne", "bordeaux", "riesling"])) score -= 8;
  if (hasText(corpus, ["classic", "benchmark", "traditional", "reserve", "reserva"])) score -= 7;
  if (hasText(corpus, ["gamay", "pinot", "pet-nat", "chillable", "volcanic"])) score += 12;
  if (hasText(corpus, ["orange", "skin-contact", "skin contact", "natural", "biodynamic", "funky", "amphora"])) score += 32;
  if (hasText(corpus, ["fermented", "kimchi", "miso", "curry", "spice", "savory herbs"])) score += 8;

  return clamp(score, 8, 94);
}

function funkScoreForWine(wine: WineItem, recommendation: WineFoodRecommendation) {
  const corpus = [
    wine.name,
    wine.style,
    wine.tags.join(" "),
    wine.flavor_notes.join(" "),
    wine.pairing_notes.join(" "),
    recommendation.reason,
    recommendation.ideal_pairings.join(" ")
  ]
    .join(" ")
    .toLowerCase();

  let score = wine.style === "Orange" ? 68 : 30;
  if (hasText(corpus, ["chablis", "champagne", "rioja", "reserva", "chianti", "bordeaux"])) score -= 10;
  if (hasText(corpus, ["natural", "biodynamic", "funky", "skin-contact", "skin contact", "orange", "amphora"])) score += 30;
  if (hasText(corpus, ["mineral", "crisp", "classic", "toast", "savory oak"])) score -= 4;
  if (hasText(corpus, ["fermented", "tea", "dried apricot", "savory herbs"])) score += 10;

  return clamp(score, 8, 94);
}

function funkLabel(score: number) {
  if (score < 26) return "Traditional";
  if (score < 48) return "Classic";
  if (score < 70) return "Adventurous";
  return "Funky";
}

function inferProducerFromName(name: string) {
  const clean = name.replace(/^\d{4}\s+/, "").trim();
  const stopWords = [
    "chianti",
    "chablis",
    "rioja",
    "reserva",
    "reserve",
    "champagne",
    "sancerre",
    "barolo",
    "barbaresco",
    "brunello",
    "montalcino",
    "pinot",
    "chardonnay",
    "riesling",
    "cabernet",
    "sauvignon",
    "merlot",
    "malbec",
    "syrah",
    "shiraz",
    "grenache",
    "tempranillo",
    "sangiovese",
    "red",
    "white",
    "sparkling",
    "rosé",
    "rose",
    "orange"
  ];
  const words = clean.split(/\s+/).filter(Boolean);
  const stopIndex = words.findIndex((word) =>
    stopWords.some((stopWord) => word.toLowerCase().replace(/[^a-zé]/g, "").startsWith(stopWord))
  );
  const candidateWords =
    stopIndex > 0 ? words.slice(0, stopIndex) : /domaine|chateau|estate|cellars|winery|bodega/i.test(clean) ? words.slice(0, 3) : [];
  const candidate = candidateWords.join(" ").replace(/[,\-]+$/g, "").trim();

  if (candidate.length >= 4 && !/^(nv|red|white|rose|rosé|sparkling|orange)$/i.test(candidate)) {
    return candidate;
  }

  return "Auto lookup in progress";
}

function inferGrapeSummary(wine: WineItem) {
  const text = `${wine.name} ${wine.region ?? ""} ${wine.tags.join(" ")}`.toLowerCase();
  if (text.includes("chablis") || text.includes("chardonnay")) return "Chardonnay";
  if (text.includes("chianti") || text.includes("sangiovese")) return "Sangiovese";
  if (text.includes("rioja") || text.includes("tempranillo")) return "Tempranillo";
  if (text.includes("pinot")) return "Pinot Noir";
  if (text.includes("gamay")) return "Gamay";
  if (wine.style === "Sparkling") return "Traditional sparkling blend";
  if (wine.style === "Orange") return "Skin-contact white grapes";
  return "Verify grape";
}

function wineOriginLabel(wine: WineItem) {
  return [wine.region, wine.country].filter(Boolean).join(", ") || "Origin needs source check";
}

function sourceLookupMessage(wine: WineItem) {
  const matched = wine.source_matches?.filter((match) => match.status === "matched") ?? [];
  const sourceNames = matched.map((match) => match.provider).filter(Boolean);

  if (sourceNames.length) {
    return `${wine.name} refreshed from ${Array.from(new Set(sourceNames)).join(", ")}.`;
  }

  if (wine.source_matches?.length) {
    return `${wine.name} now has verification links for wine-service review.`;
  }

  return `${wine.name} refreshed with inferred analysis; no source match yet.`;
}

function sourceRefreshKey(wine: WineItem) {
  return `${wine.name}|${wine.vintage ?? ""}|${wine.producer ?? ""}`.toLowerCase();
}

function shouldAutoRefreshWine(wine: WineItem, refreshTimes: Record<string, number>) {
  const lastRefresh = refreshTimes[sourceRefreshKey(wine)] ?? 0;
  const stale = Date.now() - lastRefresh > sourceRefreshStaleMs;
  const retryable = Date.now() - lastRefresh > sourceRefreshRetryMs;
  const missingCoreData =
    wine.verification_status === "needs-review" ||
    !wine.producer ||
    !wine.region ||
    !wine.country ||
    !wine.grape?.length ||
    !wine.source_matches?.length;
  const missingSourceImage = !wine.label_image_url && wine.label_image_source !== "Uploaded label scan";

  return (stale || (retryable && missingCoreData)) && (missingCoreData || missingSourceImage || wine.verification_status !== "verified");
}

function drinkingWindowForWine(wine: WineItem) {
  const currentYear = new Date().getFullYear();
  const vintage = wine.vintage ? Number.parseInt(wine.vintage, 10) : undefined;
  const start = vintage && Number.isFinite(vintage) ? vintage : currentYear - 1;
  let end = start + 3;

  if (wine.style === "Sparkling") end = start + 5;
  if (wine.style === "White" && wine.acidity === "High") end = start + 5;
  if (wine.style === "Red" && ["Medium-high", "High"].includes(wine.tannin)) end = start + 8;
  if (wine.body === "Full") end += 2;
  if (wine.style === "Orange") end = start + 4;
  if (wine.verification_status === "needs-review") return "Verify before cellaring";

  return `${Math.max(start, currentYear)}-${Math.max(end, currentYear + 1)}`;
}

function servingGuidanceForWine(wine: WineItem) {
  const text = [
    wine.name,
    wine.style,
    wine.body,
    wine.tannin,
    wine.acidity,
    ...(wine.tags ?? []),
    ...(wine.flavor_notes ?? []),
    ...(wine.grape ?? [])
  ]
    .join(" ")
    .toLowerCase();
  const vintageYear = wine.vintage ? Number.parseInt(wine.vintage, 10) : undefined;
  const bottleAge = vintageYear && Number.isFinite(vintageYear) ? new Date().getFullYear() - vintageYear : 0;

  if (wine.style === "Sparkling") {
    return {
      temperature: "42-48°F",
      openTime: "At pour",
      glass: "Tulip",
      note: "Keep it properly chilled; a tulip or white wine glass preserves fizz while letting aromatics show."
    };
  }

  if (wine.style === "White") {
    if (wine.body === "Full" || /chardonnay|white burgundy|rich|butter|cream|lees/.test(text)) {
      return {
        temperature: "50-55°F",
        openTime: "10 min",
        glass: "White wine",
        note: "Take it out of the fridge briefly so texture, oak, and orchard-fruit notes do not feel muted."
      };
    }

    return {
      temperature: "45-50°F",
      openTime: "At pour",
      glass: "White wine",
      note: "Serve chilled but not icy, keeping acidity crisp while still letting citrus and mineral notes register."
    };
  }

  if (wine.style === "Rose") {
    return {
      temperature: "46-52°F",
      openTime: "At pour",
      glass: "White wine",
      note: "Serve chilled; let richer or darker rosé warm slightly in the glass if the fruit feels closed."
    };
  }

  if (wine.style === "Orange") {
    return {
      temperature: "52-58°F",
      openTime: "15-20 min",
      glass: "Universal",
      note: "Serve cellar-cool and give it a short rest so phenolic texture and savory aromatics settle."
    };
  }

  if (wine.style === "Red") {
    if (wine.tannin === "High" || wine.body === "Full" || /cabernet|barolo|nebbiolo|syrah|bordeaux|structured/.test(text)) {
      return {
        temperature: "60-64°F",
        openTime: bottleAge >= 8 ? "30 min decant" : "45-60 min",
        glass: "Red wine",
        note: "Serve below room temperature; air helps firm tannin relax and lets darker fruit come forward."
      };
    }

    if (wine.body === "Light" || /pinot|gamay|beaujolais|chillable|light/.test(text)) {
      return {
        temperature: "54-58°F",
        openTime: "10-15 min",
        glass: "Universal",
        note: "A light chill keeps red fruit bright, freshness high, and alcohol tucked neatly into the background."
      };
    }

    return {
      temperature: "58-62°F",
      openTime: "20-30 min",
      glass: "Red wine",
      note: "A short rest after opening helps savory notes, acidity, and fruit settle into a cleaner first glass."
    };
  }

  return {
    temperature: "50-58°F",
    openTime: "10-20 min",
    glass: "Universal",
    note: "Verify producer and style details for tighter service guidance; this is a flexible cellar-cool baseline."
  };
}

function hasText(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getHeroContent(screen: Screen) {
  if (screen === "wine") {
    return {
      eyebrow: "Start with the bottle",
      title: "Open the bottle. VinoPair finds the plate.",
      body:
        "Choose a cellar bottle or type what you want to open, then get food matches shaped around acidity, body, tannin, sweetness, and occasion."
    };
  }

  return {
    eyebrow: "VinoPair starts with dinner",
    title: "Pair smarter. Pour better.",
    body:
      "Describe the meal, scan a menu, or pick a bottle. VinoPair translates flavor into confident wine and food matches, with inVINtory tracking what is ready to open."
  };
}

function shortMeal(meal: string) {
  if (meal.includes("salmon")) return "Salmon";
  if (meal.includes("Duck")) return "Duck";
  if (meal.includes("Thai")) return "Thai curry";
  return "Steak";
}

function snapshotDishName(dishName: string) {
  if (dishName.length <= 24) return dishName;
  return `${dishName.slice(0, 23).trim()}...`;
}

function shortWineLabel(name: string) {
  const clean = name.replace(/^\d{4}\s+/, "").trim();
  if (clean.length <= 32) return clean;
  return `${clean.slice(0, 29).trim()}...`;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

export default App;
