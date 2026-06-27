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
      ? "border-section-purple/45 bg-section-purple/12 text-section-purple"
      : "border-section-cyan/45 bg-section-cyan/12 text-section-cyan";

  const idleClass =
    "border-fg/15 bg-fg/5 text-fg-subtle hover:border-fg/25 hover:text-fg-muted";

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
