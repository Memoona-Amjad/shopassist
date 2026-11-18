"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/products", label: "Products & stock" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 rounded-full bg-stone-100 p-1 text-sm">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`rounded-full px-3 py-1 ${path === l.href ? "bg-white font-medium text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"}`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
