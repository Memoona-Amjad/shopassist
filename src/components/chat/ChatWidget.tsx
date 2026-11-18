"use client";
// The floating chat widget. It streams the agent's reply and shows what the
// agent did as one friendly line ("✓ Checked order #1042 · Searched products"),
// which expands to the full step-by-step details (tool inputs/outputs, retries).
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { ToolChip } from "./ToolChip";
import { DEMO_PROMPTS, SAMPLE_ORDERS } from "@/lib/demo-prompts";
import { chipLabel, type ToolPartLike } from "@/lib/agent/chip-labels";

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

const PROMPT_ICONS = ["🔎", "↩️", "🛍️", "📄", "🧑"];

export function ChatWidget({ embedded = false }: { embedded?: boolean }) {
  const [open, setOpen] = useState(embedded);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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
    const onAsk = (e: Event) => {
      setOpen(true);
      const text = String((e as CustomEvent).detail ?? "");
      if (text) askRef.current(text);
    };
    window.addEventListener("shopassist:ask", onAsk);
    return () => window.removeEventListener("shopassist:ask", onAsk);
  }, []);

  // Keep the newest message in view, and put the cursor in the input when opened.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);
  useEffect(() => {
    if (open && window.innerWidth >= 640) inputRef.current?.focus();
  }, [open]);

  const newChat = () => {
    stop();
    session.conversationId = null;
    setMessages([]);
    clearError();
    setInput("");
  };

  // On phones the chat covers the page, so close it when the customer follows a link.
  const onLinkClick = () => {
    if (!embedded && window.innerWidth < 640) setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Open chat with ShopAssist"
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 rounded-full bg-[var(--brand)] p-3 text-sm font-semibold text-white shadow-xl shadow-emerald-900/25 transition hover:-translate-y-0.5 hover:shadow-2xl sm:bottom-5 sm:right-5 sm:py-3 sm:pl-3.5 sm:pr-5"
      >
        <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-base">
          💬
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--brand)] bg-emerald-400" />
        </span>
        {/* On phones just the round icon, so it doesn't cover products. */}
        <span className="hidden sm:inline">Need help? Chat with us</span>
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="ShopAssist chat"
      className={
        embedded
          ? "flex h-full w-full flex-col overflow-hidden bg-white"
          : "modal-in fixed bottom-0 right-0 z-50 flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-2xl sm:bottom-5 sm:right-5 sm:h-[660px] sm:max-h-[calc(100dvh-2.5rem)] sm:w-[410px] sm:rounded-3xl sm:border sm:border-stone-200"
      }
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-[var(--brand)] px-4 py-3 text-white">
        <div className="flex items-center gap-3">
          <Avatar large />
          <div>
            <div className="text-sm font-semibold">ShopAssist</div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> AI assistant · replies instantly
            </div>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {messages.length > 0 && (
            <button onClick={newChat} className="whitespace-nowrap rounded-lg px-2 py-1.5 text-xs text-emerald-50 hover:bg-white/10" title="Start a new chat">
              ↺ New chat
            </button>
          )}
          {!embedded && (
            <button onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-xl leading-none hover:bg-white/10" aria-label="Close chat">
              ×
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-[var(--cream)] px-3.5 py-4" aria-live="polite">
        {messages.length === 0 && <Welcome onPick={ask} />}
        {messages.map((m) =>
          m.role === "user" ? (
            <UserBubble key={m.id} message={m} />
          ) : (
            <AssistantTurn key={m.id} message={m} streaming={status === "streaming" && m.id === messages[messages.length - 1]?.id} onLinkClick={onLinkClick} />
          ),
        )}
        {status === "submitted" && (
          <div className="flex items-end gap-2">
            <Avatar />
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm" aria-label="ShopAssist is typing">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400 [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400 [animation-delay:300ms]" />
            </div>
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
            {readableError(error)}
            {/* Retrying doesn't help when the daily demo limit is reached. */}
            {!readableError(error)?.includes("tomorrow") && (
              <button onClick={() => { clearError(); regenerate(); }} className="ml-2 font-semibold underline">
                Try again
              </button>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="border-t border-stone-200 bg-white px-3 pb-2 pt-3"
      >
        <div className="flex items-center gap-2 rounded-full border border-stone-300 bg-white py-1 pl-4 pr-1 transition focus-within:border-[var(--brand)] focus-within:ring-2 focus-within:ring-[var(--brand)]/15">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about an order, a return, sizes…"
            aria-label="Your message"
            maxLength={500}
            className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none"
          />
          {busy ? (
            <button type="button" onClick={() => stop()} className="rounded-full bg-stone-200 px-4 py-1.5 text-sm font-medium text-stone-700">
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand)] text-white transition disabled:bg-stone-200 disabled:text-stone-400"
            >
              ➤
            </button>
          )}
        </div>
        <p className="mt-1.5 text-center text-[10.5px] text-stone-400">AI assistant · can make mistakes · ask for a human any time</p>
      </form>
    </div>
  );
}

function Avatar({ large = false }: { large?: boolean }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-serif font-semibold ${
        large ? "h-9 w-9 bg-white/15 text-sm text-white" : "h-7 w-7 bg-[var(--brand)] text-[11px] text-white"
      }`}
      aria-hidden
    >
      L&amp;L
    </span>
  );
}

function Welcome({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2">
        <Avatar />
        <div className="rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-sm leading-relaxed text-stone-700 shadow-sm">
          Assalam-o-alaikum! 👋 I&apos;m <b>ShopAssist</b>. I can track your order, start a return, help you find the right
          outfit or size, and answer questions about delivery and payments.
        </div>
      </div>
      <div className="pl-9">
        <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-stone-400">Try asking</div>
        <div className="flex flex-col gap-1.5">
          {DEMO_PROMPTS.map((p, i) => (
            <button
              key={p.text}
              onClick={() => onPick(p.text)}
              className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-left text-[13px] text-stone-700 transition hover:border-[var(--brand)]/40 hover:bg-emerald-50/50"
            >
              <span>{PROMPT_ICONS[i]}</span>
              {p.text}
            </button>
          ))}
        </div>
        <details className="mt-2.5 rounded-xl border border-dashed border-stone-300 bg-white/60 px-3 py-2 text-[11.5px] text-stone-600" open>
          <summary className="cursor-pointer font-medium text-stone-700">🧪 Sample orders you can try</summary>
          <div className="mt-1.5 space-y-0.5">
            {SAMPLE_ORDERS.map((o) => (
              <div key={o.id}>
                <b>#{o.id}</b> · phone ends <b>{o.phoneLast4}</b> · {o.note}
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}

function UserBubble({ message }: { message: ChatMessage }) {
  const text = message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-[var(--brand)] px-3.5 py-2 text-sm text-white">{text}</div>
    </div>
  );
}

/** One agent turn: a compact "what I did" line, then the answer. */
function AssistantTurn({ message, streaming, onLinkClick }: { message: ChatMessage; streaming: boolean; onLinkClick: () => void }) {
  const tools = message.parts.filter((p) => p.type.startsWith("tool-")) as unknown as ToolPartLike[];
  const thoughts = message.parts.filter((p) => p.type === "reasoning" && p.text.trim()) as { text: string }[];
  const texts = message.parts.filter((p) => p.type === "text" && p.text.trim()) as { text: string }[];
  const steps = message.parts.filter((p) => p.type === "step-start").length;
  const fallbacks = message.metadata?.fallbacks ?? [];

  return (
    <div className="space-y-1.5">
      {(tools.length > 0 || thoughts.length > 0) && (
        <AgentSteps tools={tools} thoughts={thoughts} steps={steps} retriedModel={fallbacks.length > 0} working={streaming && texts.length === 0} />
      )}
      {texts.length > 0 && (
        <div className="flex items-end gap-2">
          <Avatar />
          <div className="chat-md min-w-0 max-w-[88%] rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-sm leading-relaxed text-stone-800 shadow-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents(onLinkClick)}>
              {texts.map((t) => t.text).join("\n\n")}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * The agent's work in one line, e.g. "✓ Checked our size guide · Found 1 product".
 * Tapping it shows each step with its exact input/output (for the curious, and for engineers).
 */
function AgentSteps({
  tools,
  thoughts,
  steps,
  retriedModel,
  working,
}: {
  tools: ToolPartLike[];
  thoughts: { text: string }[];
  steps: number;
  retriedModel: boolean;
  working: boolean;
}) {
  const [open, setOpen] = useState(false);
  const labels = tools.map(chipLabel);
  const running = labels.find((l) => l.tone === "running");
  const summary = running ? running.text : labels.map((l) => l.text).join(" · ") || "Thought it through";

  return (
    <div className="pl-9">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="group flex max-w-full items-start gap-1.5 rounded-lg px-1 py-0.5 text-left text-[11.5px] text-stone-500 hover:text-stone-800"
      >
        {running || working ? (
          <span className="mt-[3px] h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-stone-300 border-t-[var(--brand)]" aria-hidden />
        ) : labels.some((l) => l.tone === "warn" || l.tone === "error") ? (
          <span className="mt-[5px] h-2 w-2 shrink-0 rounded-full bg-amber-400" aria-hidden />
        ) : (
          <span className="shrink-0 text-emerald-600" aria-hidden>✓</span>
        )}
        <span className="min-w-0">
          {summary}
          <span className="ml-1 whitespace-nowrap text-stone-400 group-hover:text-stone-600">{open ? "· hide steps ▴" : "· see steps ▾"}</span>
        </span>
      </button>
      {open && (
        <div className="mt-1.5 space-y-1.5 rounded-xl border border-stone-200 bg-white/70 p-2.5">
          <div className="text-[10.5px] font-medium uppercase tracking-wide text-stone-400">
            What ShopAssist did · {steps || 1} step{steps === 1 ? "" : "s"}
          </div>
          {thoughts.length > 0 && (
            <div className="border-l-2 border-stone-200 pl-2 text-[11.5px] italic text-stone-500">
              💭 {thoughts.map((t) => t.text).join(" ").slice(0, 600)}
            </div>
          )}
          {tools.map((t, i) => (
            <ToolChip key={i} part={t} />
          ))}
          {retriedModel && <div className="text-[11px] text-sky-700">🔁 Our main AI model was busy, so a backup model answered.</div>}
          <div className="text-[10.5px] text-stone-400">Tap a step to see exactly what was sent and received.</div>
        </div>
      )}
    </div>
  );
}

/** Links inside answers: store pages open in place, other sites in a new tab. */
function markdownComponents(onLinkClick: () => void): Components {
  return {
    a: ({ href = "", children }) =>
      href.startsWith("/") ? (
        <Link href={href} onClick={onLinkClick}>{children}</Link>
      ) : (
        <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
      ),
    table: ({ children }) => (
      <div className="my-2 overflow-x-auto rounded-lg border border-stone-200">
        <table>{children}</table>
      </div>
    ),
  };
}
