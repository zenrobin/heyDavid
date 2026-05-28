import Anthropic from "@anthropic-ai/sdk";
import type { AppState, Suggestion } from "@/lib/types";
import { getAnthropicModel } from "@/lib/config";
import { getSuggestions as sampleGetSuggestions } from "@/lib/sampleEngine";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

const SYSTEM_PROMPT = `You are a warm, practical meal-tracker assistant for a single user.
Style rules:
- Keep replies short (1-4 sentences or a compact numbered list).
- Never give medical advice, calorie counts, or macro estimates.
- Always respect allergies and avoided foods.
- If the user mentions a new allergy, ask before saving it.
- For dislikes, acknowledge them but assume the app already saved them.
- Don't invent new dishes that contradict the suggestions you were given as grounding.`;

export type LlmRewriteInput = {
  userMessage: string;
  state: AppState;
  intent: "log_meal" | "request_suggestion" | "update_profile" | "unknown";
  fallbackAssistantText: string;
  suggestions?: Suggestion[];
};

export async function rewriteAssistantReply(input: LlmRewriteInput): Promise<string> {
  const { userMessage, state, intent, fallbackAssistantText, suggestions } = input;
  const profileSummary = JSON.stringify(
    {
      dietaryPattern: state.profile.dietaryPattern,
      allergies: state.profile.allergies,
      avoids: state.profile.avoids,
      likes: state.profile.likes,
      goals: state.profile.goals,
      maxPrepMinutes: state.profile.maxPrepMinutes,
      tone: state.profile.tone,
    },
    null,
    2,
  );

  const recentMeals = state.meals.slice(-5).map((m) => `- ${m.mealType}: ${m.text}`).join("\n") || "(none)";
  const grounding = suggestions?.length
    ? suggestions
        .map(
          (s, i) =>
            `${i + 1}. ${s.title} (${s.mealType}, ${s.prepMinutes} min) — ${s.description} [why: ${s.why.join(" ")}]`,
        )
        .join("\n")
    : "(no suggestions in this turn)";

  const userPrompt = `Intent: ${intent}
User message: """${userMessage}"""

User profile:
${profileSummary}

Recent meals:
${recentMeals}

Suggestions to ground your reply (do not invent new dishes outside this list when intent is request_suggestion):
${grounding}

Default reply (use this as the structure if useful):
"""${fallbackAssistantText}"""

Write the final assistant reply. Keep it short and conversational. If suggestions are present, list them as a short numbered list with a one-line "why".`;

  const resp = await getClient().messages.create({
    model: getAnthropicModel(),
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = resp.content
    .map((c) => (c.type === "text" ? c.text : ""))
    .join("")
    .trim();
  if (!text) throw new Error("Empty LLM response");
  return text;
}

// Lightly re-rank/keep our local catalog suggestions; we don't let the LLM
// invent new ones in v0.
export async function rankSuggestions(
  message: string,
  state: AppState,
): Promise<Suggestion[]> {
  return sampleGetSuggestions(message, state);
}
