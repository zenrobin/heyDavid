"use client";

import type { MealLog, Suggestion, UserProfile } from "@/lib/types";
import { ProfileCard } from "@/components/ProfileCard";
import { RecentMealsCard } from "@/components/RecentMealsCard";
import { SuggestionsCard } from "@/components/SuggestionsCard";

type Props = {
  profile: UserProfile;
  meals: MealLog[];
  suggestions: Suggestion[];
  onProfileChange: (p: UserProfile) => void;
  onReset: () => void;
};

export function ContextPanel({ profile, meals, suggestions, onProfileChange, onReset }: Props) {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto">
      <ProfileCard profile={profile} onChange={onProfileChange} />
      <RecentMealsCard meals={meals} />
      <SuggestionsCard suggestions={suggestions} />
      <button
        type="button"
        onClick={onReset}
        className="self-start rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-100"
      >
        Reset demo data
      </button>
    </div>
  );
}
