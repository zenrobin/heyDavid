import type {
  AppState,
  Intent,
  MealLog,
  MealType,
  Suggestion,
  SuggestionCatalogItem,
  UserProfile,
} from "@/lib/types";
import { suggestionCatalog } from "@/data/suggestions";
import { currentSeasonalIngredients } from "@/data/seasonality";

function randomId(): string {
  return `id_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

const MEAL_LOG_PATTERNS = [
  /\bi (?:had|ate|made|cooked|grabbed|got|finished)\b/i,
  /\b(?:for|at) (?:breakfast|lunch|dinner|brunch)\b/i,
  /\b(?:my|the) (?:breakfast|lunch|dinner|snack) (?:was|is)\b/i,
  /\bsnack was\b/i,
  /\bi drank\b/i,
  /\bjust (?:had|ate|finished)\b/i,
];

const SUGGESTION_PATTERNS = [
  /\bwhat should i (?:eat|have|make|cook)\b/i,
  /\bsuggest\b/i,
  /\b(?:any |an )?idea(?:s)?\b/i,
  /\b(?:give|recommend) me\b/i,
  /\bwant (?:something|some)\b/i,
  /\bi('?m| am) hungry\b/i,
  /\b(?:snack|meal|dinner|lunch|breakfast) (?:idea|ideas|suggestion|suggestions)?\b/i,
];

const PROFILE_PATTERNS = [
  /\bi (?:don'?t|do not) like\b/i,
  /\bi hate\b/i,
  /\bi'?m allergic\b/i,
  /\bi am allergic\b/i,
  /\bi'?m (?:a )?(?:vegetarian|vegan|pescatarian|flexitarian)\b/i,
  /\bi am (?:a )?(?:vegetarian|vegan|pescatarian|flexitarian)\b/i,
  /\btrying to eat (?:more|less)\b/i,
  /\bwant to eat (?:more|less)\b/i,
];

export function classifyIntent(message: string): Intent {
  const msg = message.trim();
  if (!msg) return "unknown";

  const isProfile = PROFILE_PATTERNS.some((re) => re.test(msg));
  const isLog = MEAL_LOG_PATTERNS.some((re) => re.test(msg));
  const isSuggest = SUGGESTION_PATTERNS.some((re) => re.test(msg));

  // Profile updates win over logs when both match (e.g., "I had no allergies before").
  if (isProfile && !isLog) return "update_profile";
  if (isLog && !isSuggest) return "log_meal";
  if (isSuggest && !isLog) return "request_suggestion";
  if (isLog) return "log_meal";
  if (isSuggest) return "request_suggestion";
  if (isProfile) return "update_profile";
  return "unknown";
}

export function guessMealTypeFromMessage(message: string, now: Date = new Date()): MealType {
  const msg = message.toLowerCase();
  if (/\bbreakfast\b|\bbrunch\b/.test(msg)) return "breakfast";
  if (/\blunch\b/.test(msg)) return "lunch";
  if (/\bdinner\b|\bsupper\b/.test(msg)) return "dinner";
  if (/\bsnack\b/.test(msg)) return "snack";
  return mealTypeFromHour(now.getHours());
}

export function mealTypeFromHour(hour: number): MealType {
  if (hour >= 5 && hour < 10) return "breakfast";
  if (hour >= 10 && hour < 15) return "lunch";
  if (hour >= 15 && hour < 17) return "snack";
  if (hour >= 17 && hour < 22) return "dinner";
  return "unknown";
}

export function logMealFromText(message: string, now: Date = new Date()): MealLog {
  const cleaned = message
    .replace(/^\s*(i (?:had|ate|made|cooked|grabbed|got|finished)|just (?:had|ate|finished))\s+/i, "")
    .replace(/\s+for\s+(breakfast|lunch|dinner|brunch|a snack)\s*\.?$/i, "")
    .trim();
  return {
    id: randomId(),
    text: cleaned || message.trim(),
    mealType: guessMealTypeFromMessage(message, now),
    createdAt: now.toISOString(),
  };
}

function lc(arr: string[]): string[] {
  return arr.map((s) => s.toLowerCase());
}

function itemConflictsWithRestrictions(
  item: SuggestionCatalogItem,
  profile: UserProfile,
): boolean {
  const allergies = lc(profile.allergies);
  const avoids = lc(profile.avoids);
  const ingredients = lc(item.ingredients);

  for (const a of allergies) {
    if (!a) continue;
    if (ingredients.some((ing) => ing.includes(a) || a.includes(ing))) return true;
  }
  for (const a of avoids) {
    if (!a) continue;
    if (ingredients.some((ing) => ing.includes(a) || a.includes(ing))) return true;
  }
  return false;
}

function itemMatchesDietaryPattern(
  item: SuggestionCatalogItem,
  profile: UserProfile,
): boolean {
  const ingredients = lc(item.ingredients);
  const meaty = ["chicken", "turkey", "beef", "pork", "bacon", "ham"];
  const fish = ["tuna", "salmon", "fish", "shrimp"];
  const dairy = ["yogurt", "cheese", "cottage cheese", "greek yogurt", "milk"];
  const eggs = ["eggs", "egg"];

  const has = (list: string[]) =>
    ingredients.some((ing) => list.some((x) => ing.includes(x)));

  switch (profile.dietaryPattern) {
    case "vegetarian":
      return !has(meaty) && !has(fish);
    case "vegan":
      return !has(meaty) && !has(fish) && !has(dairy) && !has(eggs);
    case "pescatarian":
      return !has(meaty);
    default:
      return true;
  }
}

function inferRequestedMealType(message: string, now: Date): MealType | null {
  const m = message.toLowerCase();
  if (/\bbreakfast\b|\bbrunch\b/.test(m)) return "breakfast";
  if (/\blunch\b/.test(m)) return "lunch";
  if (/\bdinner\b|\bsupper\b/.test(m)) return "dinner";
  if (/\bsnack\b/.test(m)) return "snack";
  const fromHour = mealTypeFromHour(now.getHours());
  return fromHour === "unknown" ? null : fromHour;
}

export function getSuggestions(
  message: string,
  state: AppState,
  now: Date = new Date(),
): Suggestion[] {
  const profile = state.profile;
  const requestedMealType = inferRequestedMealType(message, now);
  const seasonal = currentSeasonalIngredients(now);
  const seasonalLc = lc(seasonal);
  const msgLc = message.toLowerCase();
  const wantsCozy = /\bcozy|warm|comfort\b/.test(msgLc);

  // Hard filters: dietary pattern + allergies/avoids.
  const base = suggestionCatalog.filter(
    (item) =>
      itemMatchesDietaryPattern(item, profile) &&
      !itemConflictsWithRestrictions(item, profile),
  );

  type Scored = { item: SuggestionCatalogItem; score: number; why: string[] };
  const scored: Scored[] = base.map((item) => {
    const why: string[] = [];
    let score = 0;
    if (requestedMealType && item.mealType === requestedMealType) {
      score += 5;
      why.push(`Fits a ${requestedMealType}.`);
    }
    if (item.prepMinutes <= profile.maxPrepMinutes) {
      score += 2;
      why.push(`Ready in about ${item.prepMinutes} min.`);
    }
    const matchedGoals = item.goalsSupported.filter((g) =>
      profile.goals.map((x) => x.toLowerCase()).includes(g.toLowerCase()),
    );
    if (matchedGoals.length) {
      score += matchedGoals.length * 2;
      why.push(`Supports: ${matchedGoals.join(", ")}.`);
    }
    const matchedSeasonal = item.seasonalIngredients.filter((ing) =>
      seasonalLc.includes(ing.toLowerCase()),
    );
    if (matchedSeasonal.length) {
      score += 1;
      why.push(`Uses seasonal: ${matchedSeasonal.join(", ")}.`);
    }
    const matchedLikes = profile.likes.filter((like) =>
      item.ingredients.some((ing) => ing.toLowerCase().includes(like.toLowerCase())) ||
      item.tags.some((t) => t.toLowerCase().includes(like.toLowerCase())),
    );
    if (matchedLikes.length) {
      score += matchedLikes.length;
      why.push(`Includes things you like: ${matchedLikes.join(", ")}.`);
    }
    if (wantsCozy && item.tags.includes("cozy")) {
      score += 3;
      why.push("Feels cozy.");
    }
    return { item, score, why };
  });

  // Try strict-first selection (must match meal type + prep limit when known).
  let pool = scored.filter((s) => {
    if (requestedMealType && s.item.mealType !== requestedMealType) return false;
    if (s.item.prepMinutes > profile.maxPrepMinutes) return false;
    return true;
  });

  // Loosen: seasonality is already a soft signal (only affects score).
  if (pool.length < 3) {
    pool = scored.filter((s) => {
      if (requestedMealType && s.item.mealType !== requestedMealType) return false;
      return true;
    });
  }
  // Loosen: drop goal requirement (already soft) and prep time.
  if (pool.length < 3) {
    pool = scored.filter(
      (s) => !requestedMealType || s.item.mealType === requestedMealType,
    );
  }
  // Loosen: drop meal type.
  if (pool.length < 3) pool = scored;

  pool.sort((a, b) => b.score - a.score);
  const top = pool.slice(0, 3);

  const createdAt = now.toISOString();
  return top.map(({ item, why }) => ({
    id: randomId(),
    title: item.title,
    description: item.description,
    mealType: item.mealType,
    prepMinutes: item.prepMinutes,
    tags: item.tags,
    seasonalIngredients: item.seasonalIngredients.filter((ing) =>
      seasonalLc.includes(ing.toLowerCase()),
    ),
    why: why.length ? why : ["Matches your profile."],
    createdAt,
  }));
}

export function extractProfileUpdate(
  message: string,
  profile: UserProfile,
): { patch: Partial<UserProfile>; pendingAllergy?: string; reply: string } {
  const m = message.trim();
  const lower = m.toLowerCase();

  // Allergy — needs confirmation, don't save yet.
  const allergyMatch = m.match(/i'?m allergic to ([^.,!?]+)/i) || m.match(/i am allergic to ([^.,!?]+)/i);
  if (allergyMatch) {
    const value = allergyMatch[1].trim().replace(/\s+and\s+/g, ", ");
    return {
      patch: {},
      pendingAllergy: value,
      reply: `Got it — should I save ${value} as an allergy so I always avoid suggesting ${value.includes(",") ? "them" : "it"}?`,
    };
  }

  // Dislikes — save immediately.
  const dislikeMatch =
    m.match(/i (?:don'?t|do not) like ([^.,!?]+)/i) || m.match(/i hate ([^.,!?]+)/i);
  if (dislikeMatch) {
    const items = dislikeMatch[1]
      .split(/,| and /i)
      .map((s) => s.trim())
      .filter(Boolean);
    const next = Array.from(new Set([...profile.avoids, ...items.map((s) => s.toLowerCase())]));
    return {
      patch: { avoids: next },
      reply: `Got it — I'll avoid ${items.join(", ")} in suggestions.`,
    };
  }

  // Dietary pattern.
  if (/\b(i'?m|i am) (a )?vegan\b/i.test(lower)) {
    return { patch: { dietaryPattern: "vegan" }, reply: "Saved — I'll keep suggestions vegan." };
  }
  if (/\b(i'?m|i am) (a )?vegetarian\b/i.test(lower)) {
    return {
      patch: { dietaryPattern: "vegetarian" },
      reply: "Saved — I'll keep suggestions vegetarian.",
    };
  }
  if (/\b(i'?m|i am) (a )?pescatarian\b/i.test(lower)) {
    return {
      patch: { dietaryPattern: "pescatarian" },
      reply: "Saved — I'll keep suggestions pescatarian.",
    };
  }

  // Goals.
  const goalMatch = m.match(/(?:trying|want) to eat (more|less) ([^.,!?]+)/i);
  if (goalMatch) {
    const goal = `eat ${goalMatch[1].toLowerCase()} ${goalMatch[2].trim().toLowerCase()}`;
    const next = Array.from(new Set([...profile.goals, goal]));
    return {
      patch: { goals: next },
      reply: `Added goal: ${goal}. I'll keep that in mind.`,
    };
  }

  return { patch: {}, reply: "Got it." };
}
