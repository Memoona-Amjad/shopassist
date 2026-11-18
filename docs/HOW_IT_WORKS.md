# How ShopAssist works (plain-English guide)

This guide explains the project simply, so you can walk a CEO or an engineer through it with confidence.

---

## 1. The big idea in 30 seconds

A normal chatbot can only **talk**. ShopAssist is an **agent**: it can also **do things**, like look up an order, start a return or create a support ticket.

It works like a new support employee with a rule book and access to a few systems:
- It reads the customer's message.
- It **decides which system (tool) to use**.
- It uses it, reads the result, and decides again if needed.
- Then it replies.

Every action shows up on screen as a small **chip**, so anyone watching can see it is really doing work, not just chatting.

## 2. What happens when a customer sends a message

Example: *"Where is my order #1042? Phone ends 4821"*

1. **The chat widget** sends the conversation to our server (`/api/chat`).
2. **Rate limit check:** each visitor (IP address) gets 10 messages a day. This keeps the free AI quota safe.
3. **The agent loop starts.** We give Gemini:
   - the conversation,
   - the **instructions** (`src/lib/agent/prompt.ts`), which are the rule book,
   - the **list of tools** it may use, each with a description.
4. Gemini replies *"I want to call `getOrderStatus` with orderId 1042, phoneLast4 4821"*.
5. **Our code runs the tool**: it loads the order from the database and checks that the phone ends in 4821. If the digits are wrong, it refuses and shares nothing.
6. The tool result goes back to Gemini, which writes the answer: *"Hi Ayesha, your order shipped via Leopards…"*
7. All of this is **streamed** to the widget live: the chip appears first, then the text types out.
8. When the reply is finished, the whole conversation, including every tool call, is **saved** so the owner can replay it in `/admin`.

The loop can repeat up to **6 steps** per message. For example: search the policy → check the order → answer.

## 3. The five tools

| Tool | What it does | The safety rule in the code |
| --- | --- | --- |
| 📄 `searchPolicies(query)` | Finds the most relevant parts of the policy documents (RAG) | The agent must answer **only** from what it finds, and cite the file. If nothing matches, it says so and offers a human. |
| 🛍️ `searchProducts(query, maxPrice?, size?)` | Searches the 30 demo products | Only shows real products from the database (no invented items or prices). |
| 🔎 `getOrderStatus(orderId, phoneLast4)` | Returns status, courier, tracking and expected delivery | Checks the **last 4 phone digits first**. Never returns the phone number. After **3 wrong tries** the order is locked for that chat. |
| ↩️ `startReturn(orderId, phoneLast4, reason, confirmed)` | Checks if a return is allowed, then creates it | Must be **delivered**, **within 14 days**, and not already returned. It **only creates the return after the customer says yes** in a later message. |
| 🧑 `escalateToHuman(summary, reason)` | Creates a ticket (e.g. ESC-12) with a short summary | Used when the customer is angry, asks for a person, or the agent is unsure. |

### What "RAG" means here
RAG stands for *Retrieval-Augmented Generation*: look up the facts first, then write the answer.
1. When a policy document is added (by the seed script or the admin upload), we **split it into small chunks**, one per section.
2. Each chunk is turned into an **embedding**: a list of 768 numbers that captures its meaning, made by Gemini's embedding model.
3. These are stored in Postgres using **pgvector**.
4. When a customer asks a question, we turn the question into numbers too and find the **closest chunks** (cosine similarity).
5. Those chunks are given to the agent, which must answer from them and cite the source (e.g. *returns.md*).

## 4. Why it is designed this way

- **"The AI decides what to do, the code decides what is allowed."** Prompts can be ignored or tricked, so every important rule (phone check, 14-day window, ask before acting) is enforced **inside the tool code**. The prompt explains the rules; the code enforces them.
- **Ask before acting.** Starting a return changes data, so it is a two-step action: first *"you're eligible, shall I go ahead?"*, then the real action only after the customer says yes. The server also checks that the confirmation question was asked in an earlier message.
- **Show the work.** Tool chips, "thinking" notes and fallback notes make the agent's behaviour visible. This builds trust and makes debugging easy.
- **Easy to swap the AI provider.** Only `src/lib/llm.ts` knows we use Gemini.
- **Cheap to run.** Gemini's free tier, Supabase's free tier and Vercel's free tier mean the demo costs **Rs 0 per month**.
- **Simple, readable code.** Each file does one job, with short comments.

## 5. What happens when something fails

| Failure | What the agent does |
| --- | --- |
| Gemini's main model is overloaded (error 503) or out of quota (429) | Switches to a **backup model** straight away (list in `LLM_FALLBACK_MODELS`), skips the busy model for 60 seconds, and shows a 🔁 chip: *"Main AI model busy, retried with …"* |
| A model doesn't respond within 15 seconds | Treated as busy, so the next model is tried |
| The whole reply takes too long | Stopped after 55 seconds (or 20 seconds of silence) with a friendly *"please try again"* message |
| A database call inside a tool fails | Retried up to **3 times** with a short wait. The chip shows *"· retried"* |
| Wrong phone digits | Order details are hidden and the agent asks again. After 3 tries the order is locked and a human is offered |
| The policy docs don't cover the question | The agent says it couldn't find it and offers a human. It never invents a policy |
| A visitor sends too many messages | Friendly message: *"You've used all 10 free demo messages for today"* |
| Any unexpected error | The customer sees a short friendly sentence (never a stack trace). The real error is logged on the server |

## 6. Ordering from the store page

Visitors can click any product and order it (size, quantity, name, phone, city, address, cash on delivery).
- The browser only sends **which product and how many**. The **server** looks up the price and stock in the database, adds shipping (Rs 250 below Rs 5,000, otherwise free), and refuses sold-out items, wrong sizes, invalid phone numbers and cash-on-delivery orders above Rs 25,000.
- The order gets the next order number (e.g. #1043) with status *processing*.
- The confirmation screen has a **"Track it with ShopAssist"** button. It opens the chat with *"Where is my order #1043? Phone ends 4321"*, and the agent finds the order you just placed. This is a nice way to show the agent working on *live* data, not only the seed data.
- **Stock:** each order takes stock in **one atomic database step** (`take_stock`). If two people try to buy the last unit at the same moment, only one succeeds and the other gets a friendly "just sold out" message. If saving the order fails afterwards, the stock is put back.
- Limits: 5 orders per visitor per day. All visitor orders are deleted by the nightly demo reset (stock is not reset, because the owner controls it).
- The agent itself does **not** place orders. If a customer asks to buy, it tells them to click the product. Taking payment is a step we keep with the customer, on purpose.

## 7. The owner dashboard (`/admin`)

- **Login** with the password from the environment settings. The browser gets a signed, secure cookie, never the password.
- **Stats:** conversations, tool calls, orders placed on the site, returns started, open escalations, % of chats sent to a human.
- **Orders placed on the site:** the latest visitor orders.
- **Escalations** with the agent's summary, and a "mark resolved" button.
- **Conversation logs:** open any chat to replay every message and tool call.
- **Upload a policy** (.md/.txt or pasted text). It is chunked, embedded and usable by the agent immediately.
- **Products & stock** (`/admin/products`): add, replace or remove each product's **photo**, set the **stock** number, or use **Mark sold out** / **Restock**. Filters show low-stock items, sold-out items and products without a photo.
  - Photos are shrunk in the browser (max 1200px, WebP) before upload, so uploads are fast, then stored in **Supabase Storage**.
  - The store page is cached for speed. Every owner change "expires" the cache (Next.js `updateTag`), so the store shows the change on the next page load.
  - At 0 stock a product shows **Sold out**, can't be ordered, and the agent's product search reports it as unavailable. Items with 5 or fewer left show **"Only N left"**.
- **Reset demo orders** button, and the **one-line `<script>`** to add the chat to any website.

## 8. How to demo it in 3 minutes

1. Open the live site and click **"Try the AI support agent"**.
2. **Track an order:** *"Where is my order #1042? Phone ends 4821"*. Point at the 🔎 chip, then click it to show the real tool input and output.
3. **Return:** *"I want to return order #1037"*. It asks for the phone digits. Reply *"5590, the colour didn't suit me"*. It checks the rules and **asks for confirmation**. Say *"yes"* and you get ↩️ *Return started · RET-…*
4. **Policy:** *"What is your return policy?"*. The answer cites *returns.md*.
5. **Escalate:** *"This is the third time I'm asking, I want a human"*. You get 🧑 a ticket.
6. **Order:** click any product, place an order, then click **"Track it with ShopAssist"**. The agent finds the brand-new order.
7. Open **/admin** and show the same conversations, the escalation summary, the new order and the stats.

**Tip:** press **Reset demo orders** on the dashboard right before the call, so #1037 can be returned again.

## 9. Likely interview questions (with short answers)

**1. What makes this "agentic" and not just a chatbot?**
It decides which actions to take, calls real tools that read and change data, looks at the results, and can take several steps before answering. The chips on screen show each decision and action.

**2. How do you stop the AI from making things up?**
Policy answers must come from retrieved document text with a cited source. If nothing relevant is found, it says so and offers a human. Order and product facts come only from the database through tools.

**3. What stops someone from looking up another person's order?**
The tool checks the last 4 digits of the phone on the order before sharing anything, and locks the order after 3 wrong tries. The rule is in code, so a clever prompt can't skip it. In production I'd use an OTP or a logged-in account.

**4. What if the AI tries to start a return without asking?**
It can't. The tool only creates a return if the customer was asked to confirm in an earlier message and then agreed. Otherwise it returns "needs confirmation".

**5. What happens when Gemini is down or slow?**
The LLM wrapper automatically falls back to backup models, skips busy ones for a minute, and has timeouts so a chat never hangs. The user sees a small "retried" note.

**6. How much does it cost to run?**
Nothing for the demo: free tiers of Gemini, Supabase and Vercel, protected by a 10-messages-per-day limit per visitor. At real scale the main cost is LLM tokens, roughly a few cents per hundred conversations with a Flash model.

**7. How would you connect it to a real store?**
Replace the database queries inside the tools with calls to the store's systems (Shopify/WooCommerce for orders, the courier API for tracking). The agent, prompt and UI stay the same, because the tools are the only connection to the business systems.

**8. How do you know it works, and how would you keep it working?**
`npm run test:agent` runs 8 multi-turn conversations against the real API (all demo prompts plus edge cases: wrong phone, late return, unknown policy) and checks which tools were called and what the reply contains. Next step: run it in CI on every change.

**9. Why Supabase + pgvector instead of a separate vector database?**
One free database holds the store data, the logs and the vectors, so there are fewer moving parts. pgvector with an HNSW index is plenty for thousands of chunks.

**10. What would you build next?**
A real hand-off (WhatsApp/email/helpdesk notification for escalations), OTP verification, Urdu/Roman-Urdu tuning, and analytics on the most common questions so the store can improve its policies.

## 10. Where to find things in the code

| You want to explain… | Open this file |
| --- | --- |
| The agent loop | `src/app/api/chat/route.ts` |
| The tools and their rules | `src/lib/agent/tools.ts` |
| The agent's instructions | `src/lib/agent/prompt.ts` |
| Gemini, fallback models, embeddings | `src/lib/llm.ts` |
| Chunking and vector search | `src/lib/rag.ts` and `supabase/migrations/001_init.sql` |
| The chat widget and chips | `src/components/chat/ChatWidget.tsx`, `src/lib/agent/chip-labels.ts` |
| Rate limiting | `src/lib/rate-limit.ts` |
| Admin dashboard | `src/app/admin/page.tsx`, `src/app/admin/actions.ts` |
| Ordering | `src/components/store/OrderDialog.tsx`, `src/lib/orders.ts`, `src/app/api/orders/route.ts` |
| Products, photos, stock | `src/app/admin/products/`, `src/lib/products.ts`, `supabase/migrations/002_product_images_and_stock.sql` |
| Demo data | `src/lib/seed-data.ts`, `data/policies/*.md` |
