// POST /api/orders: place a demo order (cash on delivery) from the store page.
import { OrderError, orderInputSchema, placeOrder } from "@/lib/orders";
import { checkRateLimit } from "@/lib/rate-limit";

const ORDERS_PER_DAY = 5; // per visitor IP, keeps the demo database tidy

export async function POST(req: Request) {
  const parsed = orderInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return Response.json({ error: first?.message ?? "Please check the form and try again." }, { status: 400 });
  }

  const rate = await checkRateLimit(req, { bucket: "order", limit: ORDERS_PER_DAY }).catch(() => ({ allowed: true }));
  if (!rate.allowed) {
    return Response.json({ error: `You've placed ${ORDERS_PER_DAY} demo orders today. Please come back tomorrow!` }, { status: 429 });
  }

  try {
    return Response.json(await placeOrder(parsed.data));
  } catch (error) {
    if (error instanceof OrderError) return Response.json({ error: error.message }, { status: 400 });
    console.error("Order failed:", error);
    return Response.json({ error: "Sorry, we couldn't place your order. Please try again." }, { status: 500 });
  }
}
