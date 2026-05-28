import type { UserProfile } from "@/lib/types";

export const demoProfile: UserProfile = {
  name: "Robin",
  region: "northeast_us",
  dietaryPattern: "flexible",
  allergies: [],
  avoids: ["mushrooms"],
  likes: ["eggs", "Greek yogurt", "rice bowls", "roasted vegetables", "salty snacks"],
  goals: ["eat more protein", "avoid afternoon energy crashes"],
  maxPrepMinutes: 20,
  tone: "practical",
};
