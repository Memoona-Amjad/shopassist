import Link from "next/link";
import { AdminNav } from "./nav";

// Shared header for all owner pages. The pages themselves check the login.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex flex-1 flex-col bg-stone-50">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-5">
            <Link href="/" className="font-serif text-xl text-[var(--brand)]">Lawn &amp; Loom</Link>
            <AdminNav />
          </div>
          <Link href="/" className="text-sm text-stone-600 hover:text-stone-900">← Back to store</Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
