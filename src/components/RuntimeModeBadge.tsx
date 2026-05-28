"use client";

type Props = { mode: "sample" | "llm" | "loading" };

export function RuntimeModeBadge({ mode }: Props) {
  const label =
    mode === "llm" ? "Claude mode" : mode === "sample" ? "Sample mode" : "…";
  const cls =
    mode === "llm"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : "bg-amber-100 text-amber-800 border-amber-200";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}
      title={
        mode === "llm"
          ? "Anthropic API key detected — using Claude to refine replies."
          : "Running on the built-in sample engine. No API key needed."
      }
    >
      {label}
    </span>
  );
}
