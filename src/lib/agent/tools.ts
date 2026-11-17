// The agent's tools. Each tool is a small, plain function the model can call.
// The model decides WHEN to call a tool; the tool code decides WHAT is allowed
// (e.g. phone verification and return rules are enforced here, not by the model).
import { tool, type UIMessage } from "ai";
import { z } from "zod";
import { db } from "../supabase";
import { searchPolicyChunks } from "../rag";
import { withRetry } from "./retry";

const RETURN_WINDOW_DAYS = 14; // from data/policies/returns.md
const MAX_FAILED_VERIFICATIONS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

type OrderRow = {
  id: number;
  customer_name: string;
  phone: string;
  city: string;
  items: { name: string; size: string; qty: number; price: number }[];
  total: number;
  payment: string;
  status: string;
  courier: string | null;
  tracking_no: string | null;
  ordered_at: string;
  shipped_at: string | null;
  delivered_at: string | null;
};

type ProductRow = {
  id: string;
  name: string;
  category: string;
  fabric: string;
  price: number;
  sizes: string[];
  colors: string[];
  description: string;
  in_stock: boolean;
};

// ---------- small helpers ----------

/** Runs a Supabase query with retries and turns its error into a thrown Error. */
async function query<T>(run: () => PromiseLike<{ data: T | null; error: { message: string } | null }>) {
  return withRetry(async () => {
    const { data, error } = await run();
    if (error) throw new Error(error.message);
    return data;
  });
}

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;

const firstName = (name: string) => name.split(" ")[0];

// Delivery estimate from the shipping policy (big cities are faster).
const FAST_CITIES = ["karachi", "lahore", "islamabad", "rawalpindi"];
const MAJOR_CITIES = ["faisalabad", "multan", "peshawar", "quetta", "hyderabad", "sialkot", "gujranwala"];
function deliveryWindow(city: string): [number, number] {
  const c = city.toLowerCase();
  if (FAST_CITIES.includes(c)) return [2, 3];
  if (MAJOR_CITIES.includes(c)) return [3, 5];
  return [5, 7];
}

/** Looks through earlier tool results in this chat for a given tool + order. */
function previousToolOutputs(messages: UIMessage[], toolName: string, orderId: number) {
  const outputs: Record<string, unknown>[] = [];
  for (const m of messages) {
    for (const part of m.parts) {
      const p = part as { type: string; state?: string; input?: { orderId?: number }; output?: unknown };
      if (p.type === `tool-${toolName}` && p.state === "output-available" && Number(p.input?.orderId) === orderId) {
        outputs.push(p.output as Record<string, unknown>);
      }
    }
  }
  return outputs;
}

// ---------- the tools ----------

/**
 * Builds the tool set for one chat request. We pass in the conversation so tools
 * can check what already happened (failed phone checks, pending confirmations).
 */
export function createTools({ conversationId, messages }: { conversationId: string; messages: UIMessage[] }) {
  // Failed phone checks in THIS request (earlier ones are read from the history).
  const failedNow = new Map<number, number>();

  function failedVerifications(orderId: number) {
    const earlier = ["getOrderStatus", "startReturn"]
      .flatMap((t) => previousToolOutputs(messages, t, orderId))
      .filter((o) => o.verified === false).length;
    return earlier + (failedNow.get(orderId) ?? 0);
  }

  /** Loads an order and checks the last 4 phone digits. Never returns the phone. */
  async function loadVerifiedOrder(orderId: number, phoneLast4: string | undefined) {
    if (failedVerifications(orderId) >= MAX_FAILED_VERIFICATIONS) {
      return {
        ok: false as const,
        result: {
          verified: false,
          locked: true,
          message: "Too many failed phone checks for this order. For security, offer to connect the customer to a human.",
        },
      };
    }
    const { value: order, attempts } = await query<OrderRow>(() =>
      db().from("orders").select("*").eq("id", orderId).maybeSingle(),
    );
    if (!order) {
      return { ok: false as const, result: { found: false, attempts, message: `No order #${orderId} exists. Ask the customer to double-check the number.` } };
    }
    const digits = (phoneLast4 ?? "").replace(/\D/g, "");
    // Missing digits are not a failed attempt: the agent simply has to ask.
    if (digits.length !== 4) {
      return {
        ok: false as const,
        result: { found: true, needsPhone: true, message: "Ask the customer for the last 4 digits of the phone number on the order." },
      };
    }
    if (!order.phone.endsWith(digits)) {
      failedNow.set(orderId, (failedNow.get(orderId) ?? 0) + 1);
      return {
        ok: false as const,
        result: {
          found: true,
          verified: false,
          attemptsLeft: Math.max(MAX_FAILED_VERIFICATIONS - failedVerifications(orderId), 0),
          message: "The last 4 digits do not match the phone on this order. Do not share any order details.",
        },
      };
    }
    return { ok: true as const, order, attempts };
  }

  return {
    searchPolicies: tool({
      description:
        "Search Lawn & Loom's official policy documents (shipping, delivery times, COD, returns, refunds, exchanges, sizing, FAQ, contact). " +
        "ALWAYS call this before answering any question about store policies or rules.",
      inputSchema: z.object({
        query: z.string().describe("The customer's question, rewritten as a short search query"),
      }),
      execute: async ({ query: q }) => {
        const { value: hits, attempts } = await withRetry(() => searchPolicyChunks(q, 4));
        if (hits.length === 0) {
          return { found: false, attempts, chunks: [], message: "No policy text matched. Say you could not find this in our policies and offer a human." };
        }
        return {
          found: true,
          attempts,
          sources: [...new Set(hits.map((h) => h.source))],
          chunks: hits.map((h) => ({ source: h.source, section: h.heading, text: h.content, score: h.similarity })),
        };
      },
    }),

    searchProducts: tool({
      description: "Find products in the Lawn & Loom catalogue by keywords, with an optional maximum price (PKR) and size.",
      inputSchema: z.object({
        query: z.string().describe("What the customer wants, e.g. 'lawn suit', 'black kurta', 'kids frock'"),
        maxPrice: z.number().optional().describe("Maximum price in PKR, e.g. 5000"),
        size: z.string().optional().describe("Size such as XS, S, M, L, XL, or a kids size like 4-5Y"),
      }),
      execute: async ({ query: q, maxPrice, size }) => {
        const { value: products, attempts } = await query<ProductRow[]>(() => db().from("products").select("*"));
        const words = q
          .toLowerCase()
          .split(/[^a-z0-9-]+/)
          .filter((w) => w.length > 2 && !["show", "the", "and", "for", "with", "under", "piece", "some", "any", "want", "looking"].includes(w))
          .map((w) => w.replace(/s$/, ""));

        // Words found in the name or category count more than words in the description.
        const scored = (products ?? [])
          .filter((p) => maxPrice === undefined || p.price <= maxPrice)
          .filter((p) => {
            if (!size) return true;
            const sizes = p.sizes.map((s) => s.toLowerCase());
            // Unstitched / one-size items fit any size (see the size guide).
            return sizes.includes(size.toLowerCase()) || sizes.includes("unstitched") || sizes.includes("one size");
          })
          .map((p) => {
            const title = `${p.name} ${p.category}`.toLowerCase();
            const details = `${p.fabric} ${p.colors.join(" ")} ${p.description}`.toLowerCase();
            const score = words.reduce((s, w) => s + (title.includes(w) ? 3 : details.includes(w) ? 1 : 0), 0);
            return { p, score };
          });
        // Keep only good matches: more than half as relevant as the best one.
        const best = Math.max(0, ...scored.map((x) => x.score));
        const matches = scored
          .filter(({ score }) => words.length === 0 || (score > 0 && score > best / 2))
          .sort((a, b) => b.score - a.score || Number(b.p.in_stock) - Number(a.p.in_stock) || a.p.price - b.p.price)
          .slice(0, 6)
          .map(({ p }) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            fabric: p.fabric,
            sizes: p.sizes,
            colors: p.colors,
            inStock: p.in_stock,
            description: p.description,
          }));

        return { count: matches.length, attempts, products: matches };
      },
    }),

    getOrderStatus: tool({
      description:
        "Get the status of an order. Requires the order number AND the last 4 digits of the phone number on the order. " +
        "Never guess the digits: ask the customer if they did not give them.",
      inputSchema: z.object({
        orderId: z.number().int().describe("Order number, e.g. 1042"),
        phoneLast4: z.string().optional().describe("Last 4 digits of the customer's phone number. Leave out if the customer has not given them; never guess."),
      }),
      execute: async ({ orderId, phoneLast4 }) => {
        const check = await loadVerifiedOrder(orderId, phoneLast4);
        if (!check.ok) return check.result;
        const o = check.order;

        let expectedDelivery: string | null = null;
        if (o.status === "shipped" && o.shipped_at) {
          const [minDays, maxDays] = deliveryWindow(o.city);
          const from = new Date(new Date(o.shipped_at).getTime() + minDays * DAY_MS).toISOString();
          const to = new Date(new Date(o.shipped_at).getTime() + maxDays * DAY_MS).toISOString();
          expectedDelivery = `${formatDate(from)} – ${formatDate(to)}`;
        }

        return {
          found: true,
          verified: true,
          attempts: check.attempts,
          orderId: o.id,
          customerFirstName: firstName(o.customer_name),
          status: o.status,
          city: o.city,
          items: o.items.map((i) => `${i.qty} × ${i.name} (${i.size})`),
          total: o.total,
          payment: o.payment,
          courier: o.courier,
          trackingNo: o.tracking_no,
          orderedOn: formatDate(o.ordered_at),
          shippedOn: formatDate(o.shipped_at),
          deliveredOn: formatDate(o.delivered_at),
          expectedDelivery,
        };
      },
    }),

    startReturn: tool({
      description:
        "Start a return for a delivered order. Two-step: first call with confirmed=false to check eligibility, " +
        "then show the summary to the customer and ask them to confirm. Only after the customer clearly says yes, " +
        "call again with confirmed=true. Requires the last 4 digits of the phone number.",
      inputSchema: z.object({
        orderId: z.number().int().describe("Order number, e.g. 1037"),
        phoneLast4: z.string().optional().describe("Last 4 digits of the customer's phone number. Leave out if the customer has not given them; never guess."),
        reason: z.string().describe("Why the customer wants to return it, in a few words"),
        confirmed: z.boolean().describe("true ONLY if the customer has already confirmed this exact return in their latest message"),
      }),
      execute: async ({ orderId, phoneLast4, reason, confirmed }) => {
        const check = await loadVerifiedOrder(orderId, phoneLast4);
        if (!check.ok) return check.result;
        const o = check.order;

        // Rule 1: only delivered orders can be returned.
        if (o.status === "return_requested" || o.status === "returned") {
          const { value: existing } = await query<{ id: number; created_at: string }[]>(() =>
            db().from("returns").select("id, created_at").eq("order_id", o.id).order("id", { ascending: false }).limit(1),
          );
          return {
            verified: true,
            eligible: false,
            reason: o.status === "returned" ? "This order has already been returned." : "A return is already open for this order.",
            existingReturnId: existing?.[0] ? `RET-${existing[0].id}` : null,
          };
        }
        if (o.status !== "delivered" || !o.delivered_at) {
          return {
            verified: true,
            eligible: false,
            reason: `The order is "${o.status}", not delivered yet. Only delivered orders can be returned (returns policy).`,
          };
        }

        // Rule 2: within 14 days of delivery.
        const daysSinceDelivery = Math.floor((Date.now() - new Date(o.delivered_at).getTime()) / DAY_MS);
        if (daysSinceDelivery > RETURN_WINDOW_DAYS) {
          return {
            verified: true,
            eligible: false,
            reason: `Delivered ${daysSinceDelivery} days ago (${formatDate(o.delivered_at)}). Returns must be requested within ${RETURN_WINDOW_DAYS} days of delivery.`,
          };
        }

        const summary = {
          orderId: o.id,
          items: o.items.map((i) => `${i.qty} × ${i.name} (${i.size})`),
          deliveredOn: formatDate(o.delivered_at),
          daysLeftInWindow: RETURN_WINDOW_DAYS - daysSinceDelivery,
          reason,
          conditions: "Items must be unworn, unwashed, with original tags and packaging.",
        };

        // Rule 3: never act without the customer's OK. The customer must have
        // seen a confirmation request for this order in an EARLIER turn.
        const askedBefore = previousToolOutputs(messages, "startReturn", orderId).some(
          (out) => out.status === "needs_confirmation",
        );
        if (!confirmed || !askedBefore) {
          return {
            verified: true,
            eligible: true,
            status: "needs_confirmation",
            summary,
            message: "Show this summary and ask the customer to confirm. Do not say the return has started.",
          };
        }

        // All checks passed: create the return and update the order.
        const { value: created, attempts } = await query<{ id: number }>(() =>
          db().from("returns").insert({ order_id: o.id, reason }).select("id").single(),
        );
        await query(() => db().from("orders").update({ status: "return_requested" }).eq("id", o.id));

        return {
          verified: true,
          eligible: true,
          status: "return_started",
          attempts,
          returnId: `RET-${created?.id}`,
          summary,
          nextSteps: "Free courier pickup within 3–5 working days. Refund within 5–7 working days after quality check.",
        };
      },
    }),

    escalateToHuman: tool({
      description:
        "Hand the chat to a human support agent. Use when the customer is angry or frustrated, asks for a human, " +
        "repeats the same problem, or when you are unsure / cannot help.",
      inputSchema: z.object({
        summary: z.string().describe("2–3 sentence summary of the customer's issue for the human agent"),
        reason: z.enum(["customer_request", "frustrated_customer", "agent_unsure", "security", "other"]),
      }),
      execute: async ({ summary, reason }) => {
        const { value: row, attempts } = await query<{ id: number }>(() =>
          db().from("escalations").insert({ conversation_id: conversationId, summary, reason }).select("id").single(),
        );
        return {
          escalated: true,
          attempts,
          ticketId: `ESC-${row?.id}`,
          message: "A human teammate will review this chat and get back to the customer.",
        };
      },
    }),
  };
}

export type ShopTools = ReturnType<typeof createTools>;
