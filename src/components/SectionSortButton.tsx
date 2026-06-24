import { ArrowDown, ArrowDownWideNarrow, ArrowUp } from "lucide-react";
import type { SectionSortMode } from "../utils/categories";

interface SectionSortButtonProps {
  mode: SectionSortMode;
  onChange: (mode: SectionSortMode) => void;
  accent?: "cyan" | "purple";
}

export function SectionSortButton({
  mode,
  onChange,
  accent = "cyan",
}: SectionSortButtonProps) {
  const activeSize = mode === "size-desc";
  const activeUp = mode === "name-asc";
  const activeDown = mode === "name-desc";

  const activeClass =
    accent === "purple"
      ? "border-neon-purple/50 bg-neon-purple/15 text-neon-purple"
      : "border-neon-cyan/50 bg-neon-cyan/15 text-neon-cyan";

  const idleClass =
    "border-white/15 bg-white/5 text-white/45 hover:border-white/25 hover:text-white/70";

  const buttonClass = (active: boolean) =>
    `flex flex-col items-center justify-center rounded-lg border px-1.5 py-0.5 transition-colors ${
      active ? activeClass : idleClass
    }`;

  return (
    <div
      className="flex shrink-0 items-center gap-1"
      role="group"
      aria-label="Sort categories"
    >
      <button
        type="button"
        title="Sort by size, largest first (default)"
        aria-label="Sort by size, largest first"
        aria-pressed={activeSize}
        onClick={() => onChange("size-desc")}
        className={buttonClass(activeSize)}
      >
        <ArrowDownWideNarrow size={13} strokeWidth={2.5} aria-hidden />
        <span className="text-[9px] font-medium leading-none tracking-tight">size</span>
      </button>
      <button
        type="button"
        title="Sort by name A–Z (ascending)"
        aria-label="Sort by name A–Z ascending"
        aria-pressed={activeUp}
        onClick={() => onChange("name-asc")}
        className={buttonClass(activeUp)}
      >
        <ArrowUp size={13} strokeWidth={2.5} aria-hidden />
        <span className="text-[9px] font-medium leading-none tracking-tight">A–Z</span>
      </button>
      <button
        type="button"
        title="Sort by name Z–A (descending)"
        aria-label="Sort by name Z–A descending"
        aria-pressed={activeDown}
        onClick={() => onChange("name-desc")}
        className={buttonClass(activeDown)}
      >
        <ArrowDown size={13} strokeWidth={2.5} aria-hidden />
        <span className="text-[9px] font-medium leading-none tracking-tight">Z–A</span>
      </button>
    </div>
  );
}
