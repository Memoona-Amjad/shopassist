import Link from "next/link";

// Friendly 404 page.
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-[var(--cream)] p-8 text-center">
      <div className="font-serif text-6xl text-[var(--brand)]">404</div>
      <h1 className="font-serif text-2xl text-stone-900">We couldn&apos;t find that page</h1>
      <p className="max-w-sm text-sm text-stone-600">It may have moved, or the link may be wrong. Let&apos;s get you back to the collection.</p>
      <Link href="/" className="rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white">
        Back to the store
      </Link>
    </main>
  );
}
