"use client";

import type { AppState } from "@/lib/types";
import { demoProfile } from "@/data/demoProfile";

export const STORAGE_KEY = "meal-tracker-poc-state";

export function initialState(): AppState {
  return {
    profile: { ...demoProfile },
    meals: [],
    suggestions: [],
    messages: [
      {
        id: cryptoRandomId(),
        role: "assistant",
        content:
          "Hi Robin — tell me what you ate, ask for a meal idea, or tell me something about your preferences.",
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

export function loadState(): AppState {
  if (typeof window === "undefined") return initialState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.profile || !Array.isArray(parsed.meals)) return initialState();
    return parsed;
  } catch {
    return initialState();
  }
}

export function saveState(state: AppState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetState(): AppState {
  const fresh = initialState();
  saveState(fresh);
  return fresh;
}

export function cryptoRandomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}
