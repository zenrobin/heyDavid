"use client";

import { useCallback, useEffect, useState } from "react";
import type { AppState, ChatMessage, ChatResponse, UserProfile } from "@/lib/types";
import { cryptoRandomId, loadState, resetState, saveState } from "@/lib/appState";
import { ChatPanel } from "@/components/ChatPanel";
import { ContextPanel } from "@/components/ContextPanel";

export default function Page() {
  const [state, setState] = useState<AppState | null>(null);
  const [mode, setMode] = useState<"sample" | "llm" | "loading">("loading");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setState(loadState());
    fetch("/api/chat")
      .then((r) => r.json())
      .then((j) => setMode(j.mode === "llm" ? "llm" : "sample"))
      .catch(() => setMode("sample"));
  }, []);

  useEffect(() => {
    if (state) saveState(state);
  }, [state]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!state) return;
      const userMsg: ChatMessage = {
        id: cryptoRandomId(),
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
      };
      const stateWithUser: AppState = { ...state, messages: [...state.messages, userMsg] };
      setState(stateWithUser);
      setSending(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, state: stateWithUser }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as ChatResponse;
        if (data.mode) setMode(data.mode);
        const assistantMsg: ChatMessage = {
          id: cryptoRandomId(),
          role: "assistant",
          content: data.assistantMessage,
          createdAt: new Date().toISOString(),
        };
        setState((prev) => {
          const base: AppState = prev ?? stateWithUser;
          const patch = data.updatedStatePatch ?? {};
          return {
            ...base,
            ...patch,
            profile: patch.profile ?? base.profile,
            meals: patch.meals ?? base.meals,
            suggestions: patch.suggestions ?? base.suggestions,
            messages: [...base.messages, assistantMsg],
          };
        });
      } catch (err) {
        console.error(err);
        const assistantMsg: ChatMessage = {
          id: cryptoRandomId(),
          role: "assistant",
          content:
            "Something went wrong. I'm still here — try again, or use the sample examples in the input placeholder.",
          createdAt: new Date().toISOString(),
        };
        setState((prev) =>
          prev ? { ...prev, messages: [...prev.messages, assistantMsg] } : prev,
        );
      } finally {
        setSending(false);
      }
    },
    [state],
  );

  const handleProfileChange = (next: UserProfile) =>
    setState((prev) => (prev ? { ...prev, profile: next } : prev));

  const handleReset = () => {
    const fresh = resetState();
    setState(fresh);
  };

  if (!state) {
    return (
      <main className="flex h-screen items-center justify-center text-sm text-stone-500">
        Loading…
      </main>
    );
  }

  return (
    <main className="mx-auto flex h-screen max-w-6xl flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-900">heyDavid</h1>
          <p className="text-xs text-stone-500">
            Conversational meal tracker · POC
          </p>
        </div>
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-[1.2fr_1fr]">
        <ChatPanel
          messages={state.messages}
          onSend={handleSend}
          mode={mode}
          sending={sending}
        />
        <ContextPanel
          profile={state.profile}
          meals={state.meals}
          suggestions={state.suggestions}
          onProfileChange={handleProfileChange}
          onReset={handleReset}
        />
      </div>
    </main>
  );
}
