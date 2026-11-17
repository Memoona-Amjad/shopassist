"use client";
// A small pill that shows one tool call. Click it to see exactly what the
// agent sent to the tool and what came back (useful for engineers).
import { chipLabel, type ToolPartLike, type ChipTone } from "@/lib/agent/chip-labels";

const toneClass: Record<ChipTone, string> = {
  running: "bg-amber-50 text-amber-800 border-amber-200",
  ok: "bg-emerald-50 text-emerald-800 border-emerald-200",
  warn: "bg-orange-50 text-orange-800 border-orange-200",
  error: "bg-red-50 text-red-700 border-red-200",
};

export function ToolChip({ part }: { part: ToolPartLike }) {
  const { icon, text, tone } = chipLabel(part);
  return (
    <details className="group max-w-full">
      <summary
        className={`inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${toneClass[tone]}`}
      >
        <span aria-hidden>{icon}</span>
        <span>{text}</span>
        {tone === "running" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />}
        <span className="text-[10px] opacity-50 group-open:rotate-90 transition-transform">▶</span>
      </summary>
      <div className="mt-1 max-h-56 overflow-auto rounded-lg bg-stone-900 p-2 font-mono text-[10.5px] leading-snug text-stone-100">
        <div className="text-stone-400">tool: {part.type.replace(/^tool-/, "")}</div>
        <div className="text-stone-400">input:</div>
        <pre className="whitespace-pre-wrap break-words">{JSON.stringify(part.input ?? {}, null, 2)}</pre>
        {part.output !== undefined && (
          <>
            <div className="text-stone-400">output:</div>
            <pre className="whitespace-pre-wrap break-words">{JSON.stringify(part.output, null, 2)}</pre>
          </>
        )}
        {part.errorText && <div className="text-red-300">error: {part.errorText}</div>}
      </div>
    </details>
  );
}
