"use client";

import type { Suggestion } from "@/lib/types";

export function SuggestionsCard({ suggestions }: { suggestions: Suggestion[] }) {
  const latest = [...suggestions].slice(-3).reverse();
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-stone-800">Latest suggestions</h3>
      {latest.length === 0 ? (
        <p className="text-sm text-stone-500">
          Ask "give me a snack idea" to see suggestions here.
        </p>
      ) : (
        <ul className="space-y-3">
          {latest.map((s) => (
            <li key={s.id} className="rounded-xl bg-stone-50 px-3 py-2">
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-sm font-semibold text-stone-900">{s.title}</div>
                <div className="text-xs text-stone-500">{s.prepMinutes} min</div>
              </div>
              <div className="mt-1 text-sm text-stone-700">{s.description}</div>
              {s.tags.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {s.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] uppercase tracking-wide text-stone-700"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {s.why.length > 0 && (
                <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs text-stone-600">
                  {s.why.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
