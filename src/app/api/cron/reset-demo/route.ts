// GET /api/cron/reset-demo: puts the demo orders back to their starting state.
// Vercel Cron calls this once a day (see vercel.json) so dates stay fresh and
// order #1037 can always be returned. Vercel sends "Authorization: Bearer <CRON_SECRET>".
import { resetStoreData } from "@/lib/demo-reset";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const counts = await resetStoreData();
    return Response.json({ ok: true, ...counts, at: new Date().toISOString() });
  } catch (error) {
    console.error("Demo reset failed:", error);
    return Response.json({ ok: false, error: "Reset failed" }, { status: 500 });
  }
}
