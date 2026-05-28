export const DEFAULT_ANTHROPIC_MODEL = "claude-opus-4-7";

export type RuntimeMode = "sample" | "llm";

export function getRuntimeMode(): RuntimeMode {
  const override = process.env.MEAL_TRACKER_MODE?.toLowerCase();
  if (override === "sample") return "sample";
  if (override === "llm") {
    return process.env.ANTHROPIC_API_KEY ? "llm" : "sample";
  }
  return process.env.ANTHROPIC_API_KEY ? "llm" : "sample";
}

export function getAnthropicModel(): string {
  return process.env.ANTHROPIC_MODEL || DEFAULT_ANTHROPIC_MODEL;
}
