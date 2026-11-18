"use client";
import { openShopAssist } from "@/lib/demo-prompts";

export function FooterChatButton({ label = "💬 Chat with ShopAssist", className }: { label?: string; className?: string }) {
  return (
    <button
      onClick={() => openShopAssist()}
      className={className ?? "mt-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-900 transition hover:bg-emerald-50"}
    >
      {label}
    </button>
  );
}
