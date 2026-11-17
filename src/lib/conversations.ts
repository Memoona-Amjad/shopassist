// Saves a chat (with all its tool calls) so the admin page can replay it.
import type { UIMessage } from "ai";
import { db } from "./supabase";

/** All tool calls in a chat, in order. */
export function toolCallsOf(messages: UIMessage[]) {
  return messages.flatMap((m) =>
    m.parts
      .filter((p) => p.type.startsWith("tool-"))
      .map((p) => p as { type: string; state?: string; input?: unknown; output?: unknown }),
  );
}

export async function saveConversation(id: string, messages: UIMessage[]) {
  const calls = toolCallsOf(messages);
  const escalated = calls.some(
    (c) => c.type === "tool-escalateToHuman" && (c.output as { escalated?: boolean } | undefined)?.escalated,
  );
  const { error } = await db().from("conversations").upsert({
    id,
    messages,
    tool_calls: calls.length,
    escalated,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}
