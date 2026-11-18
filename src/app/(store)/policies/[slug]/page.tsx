// Customer-facing policy pages (/policies/shipping, /policies/returns, ...).
// They show the same markdown files the AI assistant searches, so the website
// and the assistant always say the same thing.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { readFile } from "node:fs/promises";
import path from "node:path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cacheLife } from "next/cache";
import { FooterChatButton } from "@/components/site/FooterChatButton";

const POLICIES = [
  { slug: "shipping", label: "Shipping & delivery" },
  { slug: "returns", label: "Returns & exchanges" },
  { slug: "sizing", label: "Size guide" },
  { slug: "faq", label: "FAQs" },
  { slug: "contact", label: "Contact us" },
];

export function generateStaticParams() {
  return POLICIES.map((p) => ({ slug: p.slug }));
}

async function loadPolicy(slug: string) {
  "use cache";
  cacheLife("days");
  if (!POLICIES.some((p) => p.slug === slug)) return null;
  const markdown = await readFile(path.join(process.cwd(), "data", "policies", `${slug}.md`), "utf8");
  const title = markdown.match(/^#\s+(.+)$/m)?.[1] ?? "Policy";
  return { title, markdown };
}

export async function generateMetadata({ params }: PageProps<"/policies/[slug]">): Promise<Metadata> {
  const policy = await loadPolicy((await params).slug);
  return { title: policy ? `${policy.title} · Lawn & Loom` : "Lawn & Loom" };
}

export default async function PolicyPage({ params }: PageProps<"/policies/[slug]">) {
  const { slug } = await params;
  const policy = await loadPolicy(slug);
  if (!policy) notFound();

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[220px_1fr]">
      <aside>
        <div className="text-xs font-semibold uppercase tracking-wide text-stone-400">Help centre</div>
        <nav className="mt-3 flex gap-1 overflow-x-auto lg:flex-col" aria-label="Policies">
          {POLICIES.map((p) => (
            <Link
              key={p.slug}
              href={`/policies/${p.slug}`}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm transition ${
                p.slug === slug ? "bg-[var(--brand)] font-medium text-white" : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </nav>
      </aside>

      <article className="min-w-0">
        <div className="policy max-w-3xl">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{policy.markdown}</ReactMarkdown>
        </div>
        <div className="mt-12 flex max-w-3xl flex-col items-start gap-3 rounded-2xl bg-[var(--cream)] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-semibold text-stone-900">Still have a question?</div>
            <div className="text-sm text-stone-600">Our AI assistant answers from this page instantly, or connects you to our team.</div>
          </div>
          <FooterChatButton
            label="💬 Ask ShopAssist"
            className="shrink-0 rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)]"
          />
        </div>
      </article>
    </div>
  );
}
