// Per-IP daily limit, to protect the free Gemini quota on the public demo.
// We store a hash of the IP (never the raw IP) with a counter per day.
import { createHash } from "node:crypto";
import { db } from "./supabase";

export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

function hashIp(ip: string) {
  return createHash("sha256").update(`${process.env.APP_SECRET ?? ""}:${ip}`).digest("hex").slice(0, 32);
}

export type RateLimitResult = { allowed: boolean; used: number; limit: number };

/** Counts one chat run for this IP and says whether it is still allowed today. */
export async function checkRateLimit(req: Request): Promise<RateLimitResult> {
  const limit = Number(process.env.RATE_LIMIT_PER_DAY) || 10;
  const day = new Date().toISOString().slice(0, 10); // UTC date, e.g. 2026-11-17
  const { data, error } = await db().rpc("bump_rate_limit", { p_ip_hash: hashIp(clientIp(req)), p_day: day });
  if (error) {
    // If the counter itself fails, let the chat through rather than block real users.
    console.error("Rate limit check failed:", error.message);
    return { allowed: true, used: 0, limit };
  }
  const used = Number(data);
  return { allowed: used <= limit, used, limit };
}
