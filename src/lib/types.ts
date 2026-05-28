export type UserProfile = {
  name: string;
  region: "northeast_us" | "west_us" | "south_us" | "midwest_us" | "unknown";
  dietaryPattern: "flexible" | "vegetarian" | "vegan" | "pescatarian" | "unknown";
  allergies: string[];
  avoids: string[];
  likes: string[];
  goals: string[];
  maxPrepMinutes: number;
  tone: "practical" | "encouraging" | "minimal";
};

export type MealType = "breakfast" | "lunch" | "dinner" | "snack" | "unknown";

export type MealLog = {
  id: string;
  text: string;
  mealType: MealType;
  createdAt: string;
};

export type Suggestion = {
  id: string;
  title: string;
  description: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  prepMinutes: number;
  tags: string[];
  seasonalIngredients: string[];
  why: string[];
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type Intent =
  | "log_meal"
  | "request_suggestion"
  | "update_profile"
  | "unknown";

export type AppState = {
  profile: UserProfile;
  meals: MealLog[];
  suggestions: Suggestion[];
  messages: ChatMessage[];
};

export type ChatRequest = {
  message: string;
  state: AppState;
};

export type ChatResponse = {
  assistantMessage: string;
  intent: Intent;
  updatedStatePatch?: Partial<AppState>;
  suggestions?: Suggestion[];
  mealLog?: MealLog;
  mode?: "sample" | "llm";
  pendingConfirmation?: {
    type: "allergy";
    value: string;
  };
};

export type SuggestionCatalogItem = {
  title: string;
  description: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  prepMinutes: number;
  tags: string[];
  ingredients: string[];
  avoidIngredients: string[];
  seasonalIngredients: string[];
  goalsSupported: string[];
};
