"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/types";
import { RuntimeModeBadge } from "@/components/RuntimeModeBadge";

type Props = {
  messages: ChatMessage[];
  onSend: (text: string) => Promise<void>;
  mode: "sample" | "llm" | "loading";
  sending: boolean;
};

export function ChatPanel({ messages, onSend, mode, sending }: Props) {
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, sending]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setDraft("");
    await onSend(text);
  }

  return (
    <section className="flex h-full flex-col rounded-2xl border border-stone-200 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-stone-800">Chat</h2>
        <RuntimeModeBadge mode={mode} />
      </header>
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-stone-900"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-stone-100 px-3 py-2 text-sm text-stone-500">
              Thinking…
            </div>
          </div>
        )}
      </div>
      <form onSubmit={submit} className="flex gap-2 border-t border-stone-200 p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. I had eggs and toast for breakfast"
          className="flex-1 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-stone-500"
          disabled={sending}
        />
        <button
          type="submit"
          className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:bg-stone-400"
          disabled={sending || !draft.trim()}
        >
          Send
        </button>
      </form>
    </section>
  );
}
