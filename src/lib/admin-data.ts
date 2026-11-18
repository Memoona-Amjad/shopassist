// Loads everything the owner dashboard shows, in parallel.
import type { UIMessage } from "ai";
import { db } from "./supabase";
import { toolCallsOf } from "./conversations";
import { LAST_SEED_ORDER_ID } from "./orders";

// The 5 seed policy docs. The demo depends on them, so they can't be deleted.
export const CORE_POLICIES = ["shipping.md", "returns.md", "sizing.md", "faq.md", "contact.md"];

export type ConversationRow = {
  id: string;
  messages: UIMessage[];
  tool_calls: number;
  escalated: boolean;
  created_at: string;
  updated_at: string;
};
export type EscalationRow = { id: number; conversation_id: string | null; summary: string; reason: string | null; status: string; created_at: string };
export type SiteOrderRow = { id: number; customer_name: string; city: string; items: { name: string; size: string; qty: number }[]; total: number; status: string; ordered_at: string };
export type ReturnRow = { id: number; order_id: number; reason: string; status: string; created_at: string };
export type DocumentRow = { id: number; title: string; source: string; created_at: string; chunks: number };

export async function getDashboardData() {
  const supabase = db();
  const [conversations, escalations, returns, documents, chunkCounts, totals, siteOrders] = await Promise.all([
    supabase.from("conversations").select("*").order("updated_at", { ascending: false }).limit(40),
    supabase.from("escalations").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.from("returns").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.from("documents").select("id, title, source, created_at").order("source"),
    supabase.from("doc_chunks").select("document_id"),
    supabase.from("conversations").select("tool_calls, escalated", { count: "exact" }),
    // Orders placed by visitors on the store page (numbers above the seed orders).
    supabase.from("orders").select("id, customer_name, city, items, total, status, ordered_at", { count: "exact" }).gt("id", LAST_SEED_ORDER_ID).order("id", { ascending: false }).limit(10),
  ]);

  const firstError = [conversations, escalations, returns, documents, chunkCounts, totals, siteOrders].find((r) => r.error)?.error;
  if (firstError) throw new Error(firstError.message);

  const convs = (conversations.data ?? []) as ConversationRow[];
  const chunksPerDoc = new Map<number, number>();
  for (const c of chunkCounts.data ?? []) chunksPerDoc.set(c.document_id, (chunksPerDoc.get(c.document_id) ?? 0) + 1);

  // Which tools the agent uses most (across the latest conversations).
  const toolUsage: Record<string, number> = {};
  for (const c of convs) {
    for (const call of toolCallsOf(c.messages)) {
      const name = call.type.replace(/^tool-/, "");
      toolUsage[name] = (toolUsage[name] ?? 0) + 1;
    }
  }

  const allTotals = totals.data ?? [];
  const escalationList = (escalations.data ?? []) as EscalationRow[];
  return {
    conversations: convs,
    escalations: escalationList,
    returns: (returns.data ?? []) as ReturnRow[],
    siteOrders: (siteOrders.data ?? []) as SiteOrderRow[],
    documents: ((documents.data ?? []) as Omit<DocumentRow, "chunks">[]).map((d) => ({ ...d, chunks: chunksPerDoc.get(d.id) ?? 0 })),
    toolUsage: Object.entries(toolUsage).sort((a, b) => b[1] - a[1]),
    stats: {
      conversations: totals.count ?? allTotals.length,
      toolCalls: allTotals.reduce((sum, r) => sum + (r.tool_calls ?? 0), 0),
      escalationRate: allTotals.length ? Math.round((allTotals.filter((r) => r.escalated).length / allTotals.length) * 100) : 0,
      openEscalations: escalationList.filter((e) => e.status === "open").length,
      returnsStarted: (returns.data ?? []).length,
      ordersPlaced: siteOrders.count ?? 0,
    },
  };
}
