// POST /api/chat — the agent loop.
// 1. Receive the chat history from the widget.
// 2. Let the model think, call tools, read results, and repeat (up to MAX_STEPS).
// 3. Stream every step (thoughts, tool calls, text) back to the widget.
// 4. Save the conversation so the admin page can show it.
import {
  convertToModelMessages,
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

export const maxDuration = 60; // seconds (Vercel function limit)

const MAX_STEPS = 6;
const MAX_HISTORY = 30; // keep requests small on the free tier

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
      providerOptions: chatProviderOptions(),
    });

    const stream = toUIMessageStream({
      stream: result.stream,
      tools,
      originalMessages: messages,
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
