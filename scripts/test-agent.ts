// End-to-end check of the agent through the real /api/chat endpoint.
// Start the app first (npm run dev), then run:  npm run test:agent
// Optionally point at another server:          npm run test:agent -- https://your-app.vercel.app
// Run one scenario only:                        npm run test:agent -- http://localhost:3000 "return flow"
// Note: the return test creates a real return. Reset demo data afterwards: npm run seed -- --no-docs
//
// Each scenario is a list of customer messages sent one after another in the
// same chat, so multi-turn flows (verify phone -> confirm return) are tested too.
import { parseJsonEventStream, readUIMessageStream, uiMessageChunkSchema, type UIMessage } from "ai";

const BASE = process.argv[2] ?? "http://localhost:3000";
const ONLY = process.argv[3]?.toLowerCase(); // optional: run only scenarios whose name contains this

type Check = (assistant: UIMessage, tools: string[], text: string) => string | null;

const scenarios: { name: string; turns: { say: string; expectTools?: string[]; check?: Check }[] }[] = [
  {
    name: "Order status (demo prompt 1)",
    turns: [{ say: "Where is my order #1042? Phone ends 4821", expectTools: ["getOrderStatus"], check: (_a, _t, text) => (/ship/i.test(text) ? null : "reply should mention shipped") }],
  },
  {
    name: "Wrong phone digits",
    turns: [{ say: "Where is order 1042? last 4 digits 0000", expectTools: ["getOrderStatus"], check: (_a, _t, text) => (/ayesha|TCS|LEO|tracking/i.test(text) ? "leaked order details" : null) }],
  },
  {
    name: "Return flow (demo prompt 2)",
    turns: [
      { say: "I want to return order #1037" },
      { say: "Phone ends 5590, the colour didn't suit me" , expectTools: ["startReturn"] },
      { say: "Yes, please go ahead", expectTools: ["startReturn"], check: (_a, _t, text) => (/RET-\d+/.test(text) ? null : "reply should include a RET- reference") },
    ],
  },
  {
    name: "Return outside window",
    turns: [{ say: "I want to return order 1029, phone ends 1234, it's too small", expectTools: ["startReturn"], check: (_a, _t, text) => (/14/.test(text) ? null : "should mention the 14-day window") }],
  },
  {
    name: "Product search (demo prompt 3)",
    turns: [{ say: "Show me lawn suits under Rs 5,000", expectTools: ["searchProducts"], check: (_a, _t, text) => (/Gulnar|Chambeli|Mehr|Rooh|Sitara/.test(text) ? null : "should list lawn suits") }],
  },
  {
    name: "Policy question (demo prompt 4)",
    turns: [{ say: "What is your return policy?", expectTools: ["searchPolicies"], check: (_a, _t, text) => (/14/.test(text) ? null : "should mention 14 days") }],
  },
  {
    name: "Unknown policy -> no made-up answer",
    turns: [{ say: "Do you offer a loyalty points program?", expectTools: ["searchPolicies"] }],
  },
  {
    name: "Escalation (demo prompt 5)",
    turns: [{ say: "This is the third time I'm asking, I want a human", expectTools: ["escalateToHuman"], check: (_a, _t, text) => (/ESC-\d+/.test(text) ? null : "should give an ESC- ticket") }],
  },
];

async function send(chatId: string, history: UIMessage[], fakeIp: string) {
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    // A different (fake) IP per scenario so local tests don't use up the daily limit.
    // On Vercel this header is set by the platform, so it cannot be faked there.
    headers: { "content-type": "application/json", "x-forwarded-for": fakeIp },
    body: JSON.stringify({ id: chatId, messages: history, trigger: "submit-message" }),
  });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

  // Rebuild the assistant message from the stream, exactly like the widget does.
  const chunks = parseJsonEventStream({ stream: res.body, schema: uiMessageChunkSchema }).pipeThrough(
    new TransformStream({
      transform(part, controller) {
        if (!part.success) throw part.error;
        controller.enqueue(part.value);
      },
    }),
  );
  let last: UIMessage | undefined;
  for await (const m of readUIMessageStream({ stream: chunks })) last = m;
  if (!last) throw new Error("Empty response");
  return last;
}

async function main() {
  let failures = 0;
  for (const s of scenarios.filter((x) => !ONLY || x.name.toLowerCase().includes(ONLY))) {
    console.log(`\n=== ${s.name}`);
    const chatId = `test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const history: UIMessage[] = [];
    const fakeIp = `198.51.100.${Math.floor(Math.random() * 250)}`;
    for (const turn of s.turns) {
      history.push({ id: crypto.randomUUID(), role: "user", parts: [{ type: "text", text: turn.say }] });
      const assistant = await send(chatId, history, fakeIp);
      history.push(assistant);

      const tools = assistant.parts.filter((p) => p.type.startsWith("tool-")).map((p) => {
        const t = p as { type: string; state: string; output?: Record<string, unknown> };
        const out = t.output ?? {};
        const flag = out.status ?? (out.verified === false ? "not-verified" : out.found === false ? "not-found" : "ok");
        return `${t.type.slice(5)}[${t.state === "output-available" ? flag : t.state}]`;
      });
      const text = assistant.parts.filter((p) => p.type === "text").map((p) => (p as { text: string }).text).join("");

      console.log(`> ${turn.say}`);
      console.log(`  tools: ${tools.join(", ") || "(none)"}`);
      console.log(`  reply: ${text.replace(/\s+/g, " ").slice(0, 300)}`);

      const problems: string[] = [];
      for (const t of turn.expectTools ?? []) if (!tools.some((x) => x.startsWith(t))) problems.push(`expected tool ${t}`);
      if (!text.trim()) problems.push("empty reply");
      const extra = turn.check?.(assistant, tools, text);
      if (extra) problems.push(extra);
      if (problems.length) {
        failures++;
        console.log(`  ❌ ${problems.join("; ")}`);
      } else console.log("  ✅");
    }
  }
  console.log(`\n${failures === 0 ? "All scenarios passed" : `${failures} check(s) failed`}`);
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
