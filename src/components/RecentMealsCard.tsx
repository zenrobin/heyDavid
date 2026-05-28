"use client";

import type { MealLog } from "@/lib/types";

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function RecentMealsCard({ meals }: { meals: MealLog[] }) {
  const recent = [...meals].slice(-5).reverse();
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-stone-800">Recent meals</h3>
      {recent.length === 0 ? (
        <p className="text-sm text-stone-500">No meals logged yet. Try "I had eggs and toast."</p>
      ) : (
        <ul className="space-y-2">
          {recent.map((m) => (
            <li key={m.id} className="rounded-xl bg-stone-50 px-3 py-2 text-sm">
              <div className="font-medium text-stone-900">{m.text}</div>
              <div className="mt-0.5 text-xs text-stone-500">
                {m.mealType} · {formatTime(m.createdAt)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
