// Turns any error into a short, friendly sentence for the customer.
// The real error is logged on the server; the UI never shows stack traces.
export function friendlyError(error: unknown): string {
  console.error("[ShopAssist]", error);
  const e = error as { message?: string; statusCode?: number; lastError?: { statusCode?: number; message?: string } };
  const status = e?.statusCode ?? e?.lastError?.statusCode;
  const text = `${e?.message ?? error} ${e?.lastError?.message ?? ""}`.toLowerCase();

  if (status === 503 || text.includes("high demand") || text.includes("unavailable") || text.includes("overloaded")) {
    return "Our AI provider is overloaded right now. Please try again in a minute.";
  }

  if (status === 429 || text.includes("429") || text.includes("quota") || text.includes("resource_exhausted") || text.includes("rate limit")) {
    return "Our assistant is very busy right now (free AI quota reached). Please try again in a minute.";
  }
  if (text.includes("missing environment variable")) {
    return "The assistant is not fully set up yet. Please try again later.";
  }
  if (text.includes("timeout") || text.includes("timed out") || text.includes("abort") || text.includes("did not respond") || text.includes("fetch failed")) {
    return "That took too long, the AI service is slow right now. Please try again.";
  }
  return "Sorry, something went wrong on our side. Please try again in a moment.";
}
