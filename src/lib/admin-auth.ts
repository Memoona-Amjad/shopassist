// Simple password login for the owner dashboard.
// After a correct password we set an httpOnly cookie holding an HMAC signature,
// so the password itself is never stored in the browser.
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { requireEnv } from "./env";

const COOKIE = "sa_admin";
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

function sign(value: string) {
  return createHmac("sha256", requireEnv("APP_SECRET")).update(value).digest("hex");
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function passwordIsCorrect(password: string) {
  return safeEqual(sign(password), sign(requireEnv("ADMIN_PASSWORD")));
}

export async function startAdminSession() {
  const expires = Date.now() + MAX_AGE_SECONDS * 1000;
  (await cookies()).set(COOKIE, `${expires}.${sign(`admin:${expires}`)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endAdminSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return false;
  const [expires, signature] = value.split(".");
  if (!expires || !signature || Number(expires) < Date.now()) return false;
  return safeEqual(signature, sign(`admin:${expires}`));
}
