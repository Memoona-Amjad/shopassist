"use client";
// Small interactive forms used on the admin page (they show success/error messages).
import { useActionState } from "react";
import { login, resetDemo, uploadPolicy, type ActionState } from "./actions";

function Message({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return <p className={`text-sm ${state.ok ? "text-emerald-700" : "text-red-600"}`}>{state.message}</p>;
}

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="mx-auto mt-16 w-full max-w-sm space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="font-serif text-2xl text-stone-900">Owner login</h2>
        <p className="text-sm text-stone-500">Enter the admin password to see conversations, escalations and policies.</p>
      </div>
      <input
        type="password"
        name="password"
        required
        autoFocus
        placeholder="Admin password"
        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
      />
      <button disabled={pending} className="w-full rounded-lg bg-[var(--brand)] py-2 text-sm font-semibold text-white disabled:opacity-50">
        {pending ? "Checking…" : "Log in"}
      </button>
      <Message state={state} />
    </form>
  );
}

export function UploadForm() {
  const [state, action, pending] = useActionState(uploadPolicy, {});
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-medium text-stone-600">
          Markdown or text file
          <input type="file" name="file" accept=".md,.txt,text/markdown,text/plain" className="mt-1 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-[var(--brand)]" />
        </label>
        <label className="block text-xs font-medium text-stone-600">
          Document name (optional)
          <input name="name" placeholder="e.g. Gift cards" className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-1.5 text-sm" />
        </label>
      </div>
      <label className="block text-xs font-medium text-stone-600">
        …or paste the policy text
        <textarea
          name="text"
          rows={4}
          placeholder={"# Gift Cards\n\n## Buying gift cards\nGift cards are available from Rs 2,000 to Rs 20,000..."}
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-mono text-xs"
        />
      </label>
      <div className="flex items-center gap-3">
        <button disabled={pending} className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {pending ? "Chunking and embedding…" : "Upload and index"}
        </button>
        <Message state={state} />
      </div>
    </form>
  );
}

export function ResetDemoButton() {
  const [state, action, pending] = useActionState(resetDemo, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <button disabled={pending} className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50">
        {pending ? "Resetting…" : "↺ Reset demo orders"}
      </button>
      <Message state={state} />
    </form>
  );
}
