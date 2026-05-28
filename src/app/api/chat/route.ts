import { NextResponse } from "next/server";
import type { ChatRequest, ChatResponse, Suggestion, UserProfile } from "@/lib/types";
import { getRuntimeMode } from "@/lib/config";
import {
  classifyIntent,
  extractProfileUpdate,
  getSuggestions,
  logMealFromText,
} from "@/lib/sampleEngine";
import { rewriteAssistantReply } from "@/lib/llmEngine";

export const runtime = "nodejs";

function randomId(): string {
  return `id_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function buildSampleReplyForSuggestions(suggestions: Suggestion[]): string {
  if (!suggestions.length) {
    return "I don't have a great match in the sample catalog right now — try asking for a snack or dinner idea.";
  }
  const lines = suggestions.map(
    (s, i) =>
      `${i + 1}. ${s.title}\n   ${s.description}${s.why.length ? ` (${s.why[0]})` : ""}`,
  );
  return `Here are a few ideas:\n\n${lines.join("\n\n")}`;
}

function detectAllergyConfirmation(
  message: string,
  state: ChatRequest["state"],
): { confirmed: boolean; value?: string } {
  const lastUserBeforeNow = [...state.messages].reverse().find((m) => m.role === "assistant");
  if (!lastUserBeforeNow) return { confirmed: false };
  const match = lastUserBeforeNow.content.match(/save (.+?) as an allergy/i);
  if (!match) return { confirmed: false };
  const value = match[1].trim();
  const yes = /^\s*(y(es)?|yeah|yep|sure|please do|ok(ay)?|do it|save it)\b/i.test(message.trim());
  return { confirmed: yes, value };
}

export async function POST(req: Request): Promise<NextResponse<ChatResponse | { error: string }>> {
  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body?.message || !body?.state) {
    return NextResponse.json({ error: "Missing message or state" }, { status: 400 });
  }

  const { message, state } = body;
  const mode = getRuntimeMode();
  const now = new Date();

  // Allergy confirmation flow takes priority.
  const allergyConfirm = detectAllergyConfirmation(message, state);
  if (allergyConfirm.confirmed && allergyConfirm.value) {
    const value = allergyConfirm.value;
    const items = value
      .split(/,| and /i)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const nextAllergies = Array.from(new Set([...state.profile.allergies, ...items]));
    const updatedProfile: UserProfile = { ...state.profile, allergies: nextAllergies };
    const reply: ChatResponse = {
      assistantMessage: `Saved — I'll always avoid ${value} in suggestions.`,
      intent: "update_profile",
      updatedStatePatch: { profile: updatedProfile },
      mode,
    };
    return NextResponse.json(reply);
  }

  const intent = classifyIntent(message);
  let assistantMessage = "Got it.";
  let updatedStatePatch: Partial<ChatRequest["state"]> | undefined;
  let suggestions: Suggestion[] | undefined;
  let mealLog: ChatResponse["mealLog"];
  let pendingConfirmation: ChatResponse["pendingConfirmation"];

  if (intent === "log_meal") {
    mealLog = logMealFromText(message, now);
    const mealTypeLabel = mealLog.mealType === "unknown" ? "meal" : mealLog.mealType;
    assistantMessage = `Logged ${mealTypeLabel}: ${mealLog.text}.`;
    if (state.profile.goals.length) {
      assistantMessage += ` I'll keep your goal "${state.profile.goals[0]}" in mind next time.`;
    }
    updatedStatePatch = { meals: [...state.meals, mealLog] };
  } else if (intent === "request_suggestion") {
    suggestions = getSuggestions(message, state, now);
    assistantMessage = buildSampleReplyForSuggestions(suggestions);
    updatedStatePatch = { suggestions };
  } else if (intent === "update_profile") {
    const { patch, pendingAllergy, reply } = extractProfileUpdate(message, state.profile);
    assistantMessage = reply;
    if (Object.keys(patch).length) {
      updatedStatePatch = { profile: { ...state.profile, ...patch } };
    }
    if (pendingAllergy) {
      pendingConfirmation = { type: "allergy", value: pendingAllergy };
    }
  } else {
    assistantMessage =
      "I can log meals (\"I had eggs and toast\"), suggest ideas (\"give me a snack idea\"), or update your profile (\"I don't like mushrooms\"). What would you like?";
  }

  // Optionally let Claude rewrite the assistant reply.
  if (mode === "llm") {
    try {
      const rewritten = await rewriteAssistantReply({
        userMessage: message,
        state,
        intent,
        fallbackAssistantText: assistantMessage,
        suggestions,
      });
      assistantMessage = rewritten;
    } catch (err) {
      console.error("[chat] LLM rewrite failed, falling back to sample mode:", err);
      assistantMessage =
        "I'm using the built-in sample suggestion mode right now. " + assistantMessage;
    }
  }

  const response: ChatResponse = {
    assistantMessage,
    intent,
    updatedStatePatch,
    suggestions,
    mealLog,
    mode,
    pendingConfirmation,
  };
  return NextResponse.json(response);
}

export async function GET() {
  return NextResponse.json({ mode: getRuntimeMode() });
}
