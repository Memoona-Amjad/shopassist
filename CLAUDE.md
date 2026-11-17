# ShopAssist — a support agent that answers AND takes actions for an online store

Keep this one lean: working end to end, tool calls visible, deployed.

---

## How to work (read this first)
- **Work through ALL milestones below, in order, until the project is deployed.**
  Do not stop to ask for approval between steps or milestones.
- After each milestone: test it yourself (run it, run tests, run the build),
  fix any problems, then **commit and push**, give a 2-line progress update, and
  go straight on to the next milestone.
- **Only stop and ask the user when you truly need something from them**, for example:
  an API key in `.env`, a login, a button they must click on a hosting site,
  a decision this file does not cover, or something still failing after a few tries.
  When you ask, give exact numbered steps (what to open, what to click, what to paste
  back to you), then continue once they reply.
- **At the very start**, send one message listing everything you will need from the user
  for the whole project (keys, accounts), so they can get it all ready at once.
- **When the last milestone is done**, give the user: the **live demo link**, the
  GitHub link, and a short list of anything left as TODO.

## Who this is for
- Owner: **Memoona Amjad**. GitHub username: **Memoona-Amjad**
- This is one of 3 **agentic AI** portfolio projects being sent to a **CEO** in a few days.
- The audience is a busy CEO first and engineers second. The project must:
  1. Work end to end with a **live demo link**.
  2. Have a **"Try with sample data"** option, so nobody needs to upload their own files.
  3. Show the **agent's thinking on screen** (steps, tool calls, retries).
     This is what proves it is agentic, not just a chatbot.
- We only have a few days: **working end to end first, polish second.**
  Do not add features that are not in this file without asking.

## Git and GitHub
- Git identity is already set to Memoona Amjad. Do not change git config.
- This folder is its own repo. Remote: `https://github.com/Memoona-Amjad/shopassist.git`
- If it is not a git repo yet: `git init`, `git branch -M main`, add the remote.
- Create `.gitignore` **before the first commit** (`.env`, `node_modules`, `.venv`,
  `__pycache__`, `.next`, build outputs, OS files).
- Small commits with clear messages (e.g. `feat: add fit scoring agent`).
- **Do not add any `Co-Authored-By` line or "Generated with Claude Code" line**
  to commits, PRs or READMEs. Plain commit messages only.
- Never force push. The first push may open a GitHub login window: tell the user to
  log in as Memoona-Amjad.

## Secrets
- Never put API keys in code or commits. Read them from `.env`.
- Keep an up-to-date `.env.example` with empty values.
- The user fills in `.env` by hand. Do not read or print `.env`.

## LLM
- Use **Google Gemini** (free tier) through its official SDK.
- Model name comes from an env variable (`LLM_MODEL`), never hard-coded.
  Check the current Gemini docs for the right free-tier "flash" model and SDK.
- Keep LLM calls behind one small wrapper module, so the provider can be swapped.
- Protect the free tier on the public demo: per-IP rate limit
  (about 10 runs per IP per day) with a friendly message when it is hit.

## Code quality (so Memoona can explain it)
- Simple, readable code with short plain-English comments on the important parts.
- Type hints in Python, TypeScript in JS projects.
- Friendly error messages in the UI (never show raw stack traces).
- Check the latest docs for any library whose API may have changed.

## The repo must include
1. `README.md`, in this order: one-line pitch + **Live demo** link + demo GIF/screenshot
   placeholder; the problem (2–3 lines, business language); what the agent does
   (short numbered steps); architecture diagram in **Mermaid**; tech stack;
   run locally (Windows commands); honest "Limitations and next steps".
2. `docs/HOW_IT_WORKS.md`: a simple-English walkthrough for Memoona to prepare for a call
   with the CEO: what each agent/tool does, why it is designed this way, what happens when
   something fails, and 8–10 likely interview questions with short answers.

## Environment
- Windows 11, VS Code, Python 3.12, Node, Git. Give Windows-friendly commands.
- Python: use a `.venv` virtual environment and `requirements.txt`.

---
# Project spec

## Pitch
A chat widget for an online store. It answers from the store's own policies (RAG)
and takes real actions with tools: checks order status, starts a return, finds products,
and hands the chat to a human when it should. The owner gets a small admin dashboard.

## Demo store
A **made-up** Pakistani clothing store called **"Lawn & Loom"** (fictional brand,
no real company names or logos). Seed data: about 30 products, about 40 orders with
different statuses (processing, shipped, delivered, returned), and policy docs in
markdown: shipping (cities, days, COD), returns (14 days, conditions), sizing, FAQ, contact.

## Stack
- **Next.js (App Router) + TypeScript + Tailwind**
- **Vercel AI SDK** with the Google Gemini provider (streaming + tool calling)
- **Supabase** Postgres + **pgvector** for document search; Gemini embedding model
  (check the current model name and vector size in the docs; keep it in env)
- Hosting: **Vercel** (free) + Supabase (free)

## Agent tools
- `searchPolicies(query)` — RAG over the policy docs, returns chunks + sources.
- `searchProducts(query, maxPrice?, size?)`
- `getOrderStatus(orderId, phoneLast4)` — must verify the last 4 digits of the phone first.
- `startReturn(orderId, reason)` — checks the return policy (e.g. within 14 days,
  delivered) and **asks the customer to confirm before doing it**.
- `escalateToHuman(summary)` — when the customer is angry, asks for a human, or the agent
  is unsure. Saves an escalation record with a short summary.
- Answers about policy must be based on retrieved text; if nothing is found, say so
  and offer a human. No made-up policies.

## UI
- `/` — a simple, nice-looking Lawn & Loom store page with the **floating chat widget**.
- In the chat, show each tool call as a small chip, e.g. "🔎 Checked order #1042",
  "↩️ Return started", "🧑 Sent to a human". This is the key "agentic" visual.
- Clickable demo prompts: "Where is my order #1042? Phone ends 4821",
  "I want to return order #1037", "Show me lawn suits under Rs 5,000",
  "What is your return policy?", "This is the third time I'm asking, I want a human".
  Make sure the seed data matches these prompts.
- `/admin` (simple password from env): upload a new policy doc (gets chunked + embedded),
  conversation logs with tool calls, escalations list, a few simple stats.
- Embeddable widget: a one-line `<script>` snippet shown on the admin page
  (nice to have; skip if time is short).

## Milestones (test, commit and push after each, then continue)
1. Next.js app, Supabase schema (SQL migration file), seed script, embeddings for the docs.
   Ask the user to create the Supabase project and give exact steps for where to find
   the URL and keys to put in `.env` (and where to run the SQL if needed).
2. Chat API with tools + streaming, and the chat widget with tool-call chips.
3. Store page + demo prompts (check every demo prompt works), rate limit, error handling.
4. Admin dashboard.
5. README + `docs/HOW_IT_WORKS.md`.
6. **Deploy to Vercel** (CLI via `npx vercel` or the dashboard, whichever is simpler;
   all env vars set). Ask the user for any login or clicks needed.
7. **Test the live site** with every demo prompt and the admin page, fix anything broken,
   put the live link in the README, push, and give the user the **live demo link**
   and the admin password location.
