// Turns a tool call into a short, human-friendly label for the chat chips
// (e.g. "🔎 Checked order #1042"). Used by the chat widget and the admin page.

export type ToolPartLike = {
  type: string; // "tool-getOrderStatus", ...
  state?: string; // input-streaming | input-available | output-available | output-error
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

export type ChipTone = "running" | "ok" | "warn" | "error";

type In = Record<string, unknown>;
type Out = Record<string, unknown>;

export function chipLabel(part: ToolPartLike): { icon: string; text: string; tone: ChipTone } {
  const name = part.type.replace(/^tool-/, "");
  const input = (part.input ?? {}) as In;
  const out = (part.output ?? {}) as Out;
  const running = part.state === "input-streaming" || part.state === "input-available";
  const failed = part.state === "output-error";
  const order = input.orderId ? `#${input.orderId}` : "";
  const retried = Number(out.attempts ?? 1) > 1 ? " · retried" : "";

  switch (name) {
    case "searchPolicies": {
      if (running) return { icon: "📄", text: "Searching store policies…", tone: "running" };
      if (failed) return { icon: "📄", text: "Policy search failed", tone: "error" };
      if (out.found === false) return { icon: "📄", text: "No matching policy found", tone: "warn" };
      const sources = (out.sources as string[] | undefined) ?? [];
      return { icon: "📄", text: `Read ${sources.join(", ") || "policies"}${retried}`, tone: "ok" };
    }
    case "searchProducts": {
      const price = input.maxPrice ? ` under Rs ${Number(input.maxPrice).toLocaleString("en-US")}` : "";
      if (running) return { icon: "🛍️", text: `Searching products${price}…`, tone: "running" };
      if (failed) return { icon: "🛍️", text: "Product search failed", tone: "error" };
      return { icon: "🛍️", text: `Found ${out.count ?? 0} products${price}${retried}`, tone: Number(out.count) > 0 ? "ok" : "warn" };
    }
    case "getOrderStatus": {
      if (running) return { icon: "🔎", text: `Checking order ${order}…`, tone: "running" };
      if (failed) return { icon: "🔎", text: `Order check failed`, tone: "error" };
      if (out.locked) return { icon: "🔒", text: `Order ${order} locked (too many tries)`, tone: "error" };
      if (out.found === false) return { icon: "🔎", text: `Order ${order} not found`, tone: "warn" };
      if (out.needsPhone) return { icon: "🔒", text: `Phone check needed for ${order}`, tone: "warn" };
      if (out.verified === false) return { icon: "🔒", text: `Phone check failed for ${order}`, tone: "warn" };
      return { icon: "🔎", text: `Checked order ${order} · ${out.status}${retried}`, tone: "ok" };
    }
    case "startReturn": {
      if (running) return { icon: "↩️", text: `Checking return rules for ${order}…`, tone: "running" };
      if (failed) return { icon: "↩️", text: "Return failed", tone: "error" };
      if (out.locked) return { icon: "🔒", text: `Order ${order} locked (too many tries)`, tone: "error" };
      if (out.found === false) return { icon: "↩️", text: `Order ${order} not found`, tone: "warn" };
      if (out.needsPhone) return { icon: "🔒", text: `Phone check needed for ${order}`, tone: "warn" };
      if (out.verified === false) return { icon: "🔒", text: `Phone check failed for ${order}`, tone: "warn" };
      if (out.eligible === false) return { icon: "↩️", text: `Return not allowed for ${order}`, tone: "warn" };
      if (out.status === "needs_confirmation") return { icon: "↩️", text: `Return eligible · waiting for your OK`, tone: "warn" };
      return { icon: "↩️", text: `Return started · ${out.returnId}${retried}`, tone: "ok" };
    }
    case "escalateToHuman": {
      if (running) return { icon: "🧑", text: "Handing over to a human…", tone: "running" };
      if (failed) return { icon: "🧑", text: "Could not reach a human", tone: "error" };
      return { icon: "🧑", text: `Sent to a human · ${out.ticketId}${retried}`, tone: "ok" };
    }
    default:
      return { icon: "🛠️", text: name, tone: running ? "running" : "ok" };
  }
}
