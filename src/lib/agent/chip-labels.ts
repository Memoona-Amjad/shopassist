// Turns a tool call into a short, customer-friendly label
// (e.g. "Checked order #1042 · On the way"). Used by the chat widget and the admin page.

export type ToolPartLike = {
  type: string; // "tool-getOrderStatus", ...
  state?: string; // input-streaming | input-available | output-available | output-error
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

export type ChipTone = "running" | "ok" | "warn" | "error";
export type ChipLabel = { icon: string; text: string; tone: ChipTone };

type In = Record<string, unknown>;
type Out = Record<string, unknown>;

// Friendly names for the policy documents.
const DOC_NAMES: Record<string, string> = {
  "shipping.md": "shipping policy",
  "returns.md": "returns policy",
  "sizing.md": "size guide",
  "faq.md": "FAQs",
  "contact.md": "contact info",
};
export function docName(source: string) {
  return DOC_NAMES[source] ?? source.replace(/\.md$/, "").replace(/-/g, " ");
}

const ORDER_STATUS: Record<string, string> = {
  processing: "Processing",
  shipped: "On the way",
  delivered: "Delivered",
  return_requested: "Return requested",
  returned: "Returned",
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const listWords = (items: string[]) =>
  items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

export function chipLabel(part: ToolPartLike): ChipLabel {
  const name = part.type.replace(/^tool-/, "");
  const input = (part.input ?? {}) as In;
  const out = (part.output ?? {}) as Out;
  const running = part.state === "input-streaming" || part.state === "input-available";
  const failed = part.state === "output-error";
  const order = input.orderId ? `#${input.orderId}` : "your order";
  const retried = Number(out.attempts ?? 1) > 1 ? " · retried" : "";

  switch (name) {
    case "searchPolicies": {
      if (running) return { icon: "📄", text: "Checking our store policies…", tone: "running" };
      if (failed) return { icon: "📄", text: "Couldn't open our policies", tone: "error" };
      if (out.found === false) return { icon: "📄", text: "Not covered in our policies", tone: "warn" };
      const docs = ((out.sources as string[] | undefined) ?? []).map(docName);
      return { icon: "📄", text: `Checked our ${listWords(docs) || "policies"}${retried}`, tone: "ok" };
    }
    case "searchProducts": {
      const price = input.maxPrice ? ` under Rs ${Number(input.maxPrice).toLocaleString("en-US")}` : "";
      if (running) return { icon: "🛍️", text: "Searching our collection…", tone: "running" };
      if (failed) return { icon: "🛍️", text: "Product search failed", tone: "error" };
      const count = Number(out.count ?? 0);
      if (count === 0) return { icon: "🛍️", text: `No matching products${price}`, tone: "warn" };
      return { icon: "🛍️", text: `Found ${plural(count, "product")}${price}${retried}`, tone: "ok" };
    }
    case "getOrderStatus": {
      if (running) return { icon: "🔎", text: `Looking up order ${order}…`, tone: "running" };
      if (failed) return { icon: "🔎", text: "Couldn't look up the order", tone: "error" };
      if (out.locked) return { icon: "🔒", text: `Order ${order} locked for your security`, tone: "error" };
      if (out.found === false) return { icon: "🔎", text: `Order ${order} not found`, tone: "warn" };
      if (out.needsPhone) return { icon: "🔒", text: "Phone verification needed", tone: "warn" };
      if (out.verified === false) return { icon: "🔒", text: "Phone digits didn't match", tone: "warn" };
      return { icon: "🔎", text: `Checked order ${order} · ${ORDER_STATUS[String(out.status)] ?? out.status}${retried}`, tone: "ok" };
    }
    case "startReturn": {
      if (running) return { icon: "↩️", text: "Checking our return rules…", tone: "running" };
      if (failed) return { icon: "↩️", text: "Couldn't start the return", tone: "error" };
      if (out.locked) return { icon: "🔒", text: `Order ${order} locked for your security`, tone: "error" };
      if (out.found === false) return { icon: "↩️", text: `Order ${order} not found`, tone: "warn" };
      if (out.needsPhone) return { icon: "🔒", text: "Phone verification needed", tone: "warn" };
      if (out.verified === false) return { icon: "🔒", text: "Phone digits didn't match", tone: "warn" };
      if (out.eligible === false) return { icon: "↩️", text: `Return not possible for ${order}`, tone: "warn" };
      if (out.status === "needs_confirmation") return { icon: "↩️", text: "Return eligible · waiting for your OK", tone: "warn" };
      return { icon: "↩️", text: `Return started · ${out.returnId}${retried}`, tone: "ok" };
    }
    case "escalateToHuman": {
      if (running) return { icon: "🧑", text: "Connecting you to our team…", tone: "running" };
      if (failed) return { icon: "🧑", text: "Couldn't reach our team", tone: "error" };
      return { icon: "🧑", text: `Passed to our team · ticket ${out.ticketId}${retried}`, tone: "ok" };
    }
    default:
      return { icon: "🛠️", text: name, tone: running ? "running" : "ok" };
  }
}
