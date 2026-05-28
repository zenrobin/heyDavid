"use client";

import { useState } from "react";
import type { UserProfile } from "@/lib/types";

type Props = {
  profile: UserProfile;
  onChange: (next: UserProfile) => void;
};

function CsvField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState(value.join(", "));
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
        {label}
      </span>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() =>
          onChange(
            draft
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          )
        }
        className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-2 py-1 text-sm"
      />
    </label>
  );
}

export function ProfileCard({ profile, onChange }: Props) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-stone-800">Profile</h3>
      <div className="grid grid-cols-1 gap-3">
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Dietary pattern
          </span>
          <select
            value={profile.dietaryPattern}
            onChange={(e) =>
              onChange({ ...profile, dietaryPattern: e.target.value as UserProfile["dietaryPattern"] })
            }
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-2 py-1 text-sm"
          >
            <option value="flexible">flexible</option>
            <option value="vegetarian">vegetarian</option>
            <option value="vegan">vegan</option>
            <option value="pescatarian">pescatarian</option>
            <option value="unknown">unknown</option>
          </select>
        </label>
        <CsvField
          label="Allergies"
          value={profile.allergies}
          onChange={(next) => onChange({ ...profile, allergies: next })}
        />
        <CsvField
          label="Avoids"
          value={profile.avoids}
          onChange={(next) => onChange({ ...profile, avoids: next })}
        />
        <CsvField
          label="Likes"
          value={profile.likes}
          onChange={(next) => onChange({ ...profile, likes: next })}
        />
        <CsvField
          label="Goals"
          value={profile.goals}
          onChange={(next) => onChange({ ...profile, goals: next })}
        />
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Max prep minutes
          </span>
          <input
            type="number"
            min={1}
            max={180}
            value={profile.maxPrepMinutes}
            onChange={(e) =>
              onChange({ ...profile, maxPrepMinutes: Number(e.target.value) || 0 })
            }
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-2 py-1 text-sm"
          />
        </label>
      </div>
    </section>
  );
}
