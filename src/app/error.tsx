"use client";
// Friendly page for unexpected errors (never shows a stack trace).
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="font-serif text-3xl text-[var(--brand)]">Something went wrong</h1>
      <p className="max-w-md text-sm text-stone-600">Sorry, this page hit a problem. Please try again in a moment.</p>
      <button onClick={reset} className="rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-semibold text-white">
        Try again
      </button>
    </main>
  );
}
