// POST /api/chat — the agent loop.
// 1. Receive the chat history from the widget.
// 2. Let the model think, call tools, read results, and repeat (up to MAX_STEPS).
// 3. Stream every step (thoughts, tool calls, text) back to the widget.
// 4. Save the conversation so the admin page can show it.
import {
  convertToModelMessages,
  createIdGenerator,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { chatModel, chatProviderOptions } from "@/lib/llm";
import { createTools } from "@/lib/agent/tools";
import { agentInstructions } from "@/lib/agent/prompt";
import { saveConversation } from "@/lib/conversations";
import { friendlyError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rate-limit";

export const maxDuration = 60; // seconds (Vercel function limit)

const MAX_STEPS = 6;
const MAX_HISTORY = 30; // keep requests small on the free tier
const MAX_MESSAGE_CHARS = 1000;

export async function POST(req: Request) {
  let body: { id?: string; messages?: UIMessage[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const conversationId = String(body.id ?? "").slice(0, 100);
  const messages = (body.messages ?? []).slice(-MAX_HISTORY);
  if (!conversationId || messages.length === 0) {
    return Response.json({ error: "Missing conversation id or messages." }, { status: 400 });
  }

  // Basic input checks: the newest message must be a reasonable-length user message.
  const last = messages[messages.length - 1];
  const lastText = last?.parts?.map((p) => (p.type === "text" ? p.text : "")).join("") ?? "";
  if (last?.role !== "user" || !lastText.trim()) {
    return Response.json({ error: "Please type a message." }, { status: 400 });
  }
  if (lastText.length > MAX_MESSAGE_CHARS) {
    return Response.json({ error: `Please keep messages under ${MAX_MESSAGE_CHARS} characters.` }, { status: 400 });
  }

  // Protect the free AI quota: about 10 agent runs per visitor per day.
  const rate = await checkRateLimit(req).catch(() => ({ allowed: true, used: 0, limit: 0 }));
  if (!rate.allowed) {
    return Response.json(
      {
        error: `You've used all ${rate.limit} free demo messages for today 🙏 This keeps the demo free for everyone. Please come back tomorrow!`,
      },
      { status: 429 },
    );
  }

  try {
    const tools = createTools({ conversationId, messages });
    // Every time the main model is busy and we switch to a backup, remember it
    // so the widget can show a "retried with backup model" chip.
    const fallbacks: { from: string; to: string }[] = [];

    const result = streamText({
      model: chatModel((info) => fallbacks.push(info)),
      instructions: agentInstructions(),
      messages: await convertToModelMessages(messages, { tools, ignoreIncompleteToolCalls: true }),
      tools,
      stopWhen: isStepCount(MAX_STEPS),
      maxRetries: 1, // plus one SDK retry if every model fails
      // Never let a chat hang: stop if the model goes silent or the turn runs too long.
      timeout: { totalMs: 55_000, chunkMs: 20_000, toolMs: 15_000 },
      providerOptions: chatProviderOptions(),
    });

    const stream = toUIMessageStream({
      stream: result.stream,
      tools,
      originalMessages: messages,
      generateMessageId: createIdGenerator({ prefix: "msg", size: 16 }), // ids for saved replies
      sendReasoning: true,
      messageMetadata: ({ part }) => (part.type === "finish" ? { fallbacks } : undefined),
      onError: (error) => friendlyError(error),
      onEnd: async ({ messages: finalMessages }) => {
        // Logging must never break the chat, so errors are only printed.
        await saveConversation(conversationId, finalMessages).catch((e) =>
          console.error("Could not save conversation:", e),
        );
      },
    });

    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    console.error("Chat error:", error);
    return Response.json({ error: friendlyError(error) }, { status: 500 });
  }
}
