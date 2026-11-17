"use client";
// The floating chat widget. It streams the agent's reply and shows every step:
// thinking, tool calls (as chips), model fallbacks, and the final answer.
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ToolChip } from "./ToolChip";
import { DEMO_PROMPTS, SAMPLE_ORDERS } from "@/lib/demo-prompts";
import type { ToolPartLike } from "@/lib/agent/chip-labels";

type Metadata = { fallbacks?: { from: string; to: string }[] };
type ChatMessage = UIMessage<Metadata>;

// Our own conversation id, created when the first message is sent
// (so "New chat" starts a fresh log entry on the admin page).
const session: { conversationId: string | null } = { conversationId: null };

const transport = new DefaultChatTransport<ChatMessage>({
  api: "/api/chat",
  prepareSendMessagesRequest: ({ messages, trigger, messageId }) => {
    session.conversationId ??= crypto.randomUUID();
    return { body: { id: session.conversationId, messages, trigger, messageId } };
  },
});

/** The API returns JSON like {"error": "..."}; show only the friendly text. */
function readableError(error: Error | undefined) {
  if (!error) return null;
  try {
    const parsed = JSON.parse(error.message);
    if (parsed?.error) return String(parsed.error);
  } catch {
    /* not JSON */
  }
  return error.message && error.message.length < 200 && !error.message.includes("at ")
    ? error.message
    : "Sorry, something went wrong. Please try again.";
}

export function ChatWidget({ embedded = false }: { embedded?: boolean }) {
  const [open, setOpen] = useState(embedded);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, setMessages, status, error, regenerate, clearError, stop } = useChat<ChatMessage>({
    transport,
  });
  const busy = status === "submitted" || status === "streaming";

  const ask = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    clearError();
    sendMessage({ text: trimmed });
    setInput("");
  };

  // Buttons elsewhere on the page can open the widget with a prompt.
  const askRef = useRef(ask);
  useEffect(() => {
    askRef.current = ask;
  });
  useEffect(() => {
    const handler = (e: Event) => {
      setOpen(true);
      askRef.current(String((e as CustomEvent).detail ?? ""));
    };
    window.addEventListener("shopassist:ask", handler);
    return () => window.removeEventListener("shopassist:ask", handler);
  }, []);

  // Keep the newest message in view.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const newChat = () => {
    stop();
    session.conversationId = null;
    setMessages([]);
    clearError();
    setInput("");
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[var(--brand)] px-5 py-3.5 text-sm font-semibold text-white shadow-xl shadow-emerald-900/20 transition hover:scale-105"
      >
        <span className="text-lg">💬</span> Chat with us
      </button>
    );
  }

  return (
    <div
      className={
        embedded
          ? "flex h-full w-full flex-col overflow-hidden bg-white"
          : "fixed bottom-0 right-0 z-50 flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-2xl sm:bottom-5 sm:right-5 sm:h-[640px] sm:max-h-[calc(100dvh-2.5rem)] sm:w-[400px] sm:rounded-2xl sm:border sm:border-stone-200"
      }
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-[var(--brand)] px-4 py-3 text-white">
        <div>
          <div className="text-sm font-semibold">ShopAssist · Lawn &amp; Loom</div>
          <div className="text-[11px] text-emerald-100">AI agent · checks orders, starts returns, finds products</div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={newChat} className="whitespace-nowrap rounded-md px-2 py-1 text-xs text-emerald-50 hover:bg-white/10" title="Start a new chat">
            New chat
          </button>
          {!embedded && (
            <button onClick={() => setOpen(false)} className="rounded-md px-2 py-1 text-lg leading-none hover:bg-white/10" aria-label="Close chat">
              ×
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-[var(--cream)] px-3 py-4">
        {messages.length === 0 && <EmptyState onPick={ask} />}
        {messages.map((m) => (m.role === "user" ? <UserBubble key={m.id} message={m} /> : <AssistantTurn key={m.id} message={m} />))}
        {status === "submitted" && (
          <div className="flex items-center gap-2 pl-1 text-xs text-stone-500">
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400 [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400 [animation-delay:300ms]" />
            </span>
            ShopAssist is thinking…
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {readableError(error)}
            <button onClick={() => { clearError(); regenerate(); }} className="ml-2 font-semibold underline">
              Try again
            </button>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex gap-2 border-t border-stone-200 bg-white p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about an order, a return, products…"
          maxLength={500}
          className="flex-1 rounded-full border border-stone-300 px-4 py-2 text-sm outline-none focus:border-[var(--brand)]"
        />
        {busy ? (
          <button type="button" onClick={() => stop()} className="rounded-full bg-stone-200 px-4 text-sm font-medium text-stone-700">
            Stop
          </button>
        ) : (
          <button type="submit" disabled={!input.trim()} className="rounded-full bg-[var(--brand)] px-4 text-sm font-semibold text-white disabled:opacity-40">
            Send
          </button>
        )}
      </form>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl rounded-tl-sm bg-white p-3 text-sm text-stone-700 shadow-sm">
        Assalam-o-alaikum! 👋 I&apos;m ShopAssist. I can track your order, start a return, find products and answer
        policy questions. Try one of these:
      </div>
      <div className="flex flex-wrap gap-2">
        {DEMO_PROMPTS.map((p) => (
          <button
            key={p.text}
            onClick={() => onPick(p.text)}
            className="rounded-full border border-[var(--brand)]/30 bg-white px-3 py-1.5 text-left text-xs text-[var(--brand)] hover:bg-emerald-50"
          >
            {p.text}
          </button>
        ))}
      </div>
      <div className="rounded-xl border border-dashed border-stone-300 bg-white/60 p-2.5 text-[11px] text-stone-600">
        <div className="mb-1 font-semibold">Sample data (made-up orders)</div>
        {SAMPLE_ORDERS.map((o) => (
          <div key={o.id}>
            #{o.id} · phone ends <b>{o.phoneLast4}</b> · {o.note}
          </div>
        ))}
      </div>
    </div>
  );
}

function UserBubble({ message }: { message: ChatMessage }) {
  const text = message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-[var(--brand)] px-3.5 py-2 text-sm text-white">{text}</div>
    </div>
  );
}

/** One agent turn: thinking → tool chips → answer, in the order they happened. */
function AssistantTurn({ message }: { message: ChatMessage }) {
  const toolParts = message.parts.filter((p) => p.type.startsWith("tool-"));
  const steps = message.parts.filter((p) => p.type === "step-start").length;
  const fallbacks = message.metadata?.fallbacks ?? [];
  const fallbackTo = [...new Set(fallbacks.map((f) => f.to))];

  return (
    <div className="space-y-1.5">
      {message.parts.map((part, i) => {
        if (part.type === "reasoning") {
          if (!part.text.trim()) return null;
          return (
            <details key={i} className="text-xs text-stone-500">
              <summary className="cursor-pointer list-none">💭 Thinking{part.state === "streaming" ? "…" : " (tap to see)"}</summary>
              <div className="mt-1 whitespace-pre-wrap border-l-2 border-stone-300 pl-2 italic">{part.text}</div>
            </details>
          );
        }
        if (part.type.startsWith("tool-")) {
          return <ToolChip key={i} part={part as unknown as ToolPartLike} />;
        }
        if (part.type === "text" && part.text.trim()) {
          return (
            <div key={i} className="chat-md max-w-[92%] rounded-2xl rounded-tl-sm bg-white px-3.5 py-2.5 text-sm text-stone-800 shadow-sm">
              <ReactMarkdown>{part.text}</ReactMarkdown>
            </div>
          );
        }
        return null;
      })}
      {fallbackTo.length > 0 && (
        <div className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800">
          🔁 Main AI model busy · retried with {fallbackTo.join(", ")}
        </div>
      )}
      {(toolParts.length > 0 || steps > 1) && (
        <div className="pl-1 text-[10.5px] text-stone-400">
          {steps} step{steps === 1 ? "" : "s"} · {toolParts.length} tool call{toolParts.length === 1 ? "" : "s"}
        </div>
      )}
    </div>
  );
}
