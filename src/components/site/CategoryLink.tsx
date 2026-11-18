"use client";
// A link that shows one product category: on the home page it filters the grid
// in place; on other pages it goes to the home page with that category selected.
import { usePathname, useRouter } from "next/navigation";
import { showCategory, type ShopCategory } from "@/lib/shop-events";

export function CategoryLink({ category, className, children }: { category: ShopCategory; className?: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      onClick={() => (pathname === "/" ? showCategory(category) : router.push(`/?c=${category}#shop`))}
    >
      {children}
    </button>
  );
}
