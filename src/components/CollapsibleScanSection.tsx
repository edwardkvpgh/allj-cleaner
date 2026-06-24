import type { ReactNode } from "react";
import { Minus, Plus } from "lucide-react";
import { formatBytesCompact, formatBytesCompactParts } from "../utils/format";

function CompactSizeAmount({ bytes }: { bytes: number }) {
  const { value, unit } = formatBytesCompactParts(bytes);

  return (
    <span className="font-size-num inline-flex items-baseline">
      <span className="font-normal">{value}</span>
      <span className="text-[10px] font-semibold tracking-wide">{unit}</span>
    </span>
  );
}

interface CollapsibleScanSectionProps {
  title: string;
  subtitle?: string;
  titleClassName?: string;
  sizeSummary?: { selectedBytes: number; totalBytes: number };
  sizeAccentClassName?: string;
  subtitleClassName?: string;
  accent?: "cyan" | "pink" | "purple" | "amber";
  className?: string;
  open: boolean;
  onToggle: () => void;
  headerAction?: ReactNode;
  children: ReactNode;
}

export function CollapsibleScanSection({
  title,
  subtitle,
  titleClassName = "text-white/30",
  sizeSummary,
  sizeAccentClassName = "text-white/55",
  subtitleClassName = "text-white/35",
  accent = "cyan",
  className = "",
  open,
  onToggle,
  headerAction,
  children,
}: CollapsibleScanSectionProps) {
  const toggleOpenClass =
    accent === "pink"
      ? "border-neon-pink/50 bg-neon-pink/15 text-neon-pink"
      : accent === "purple"
        ? "border-neon-purple/50 bg-neon-purple/15 text-neon-purple"
        : accent === "amber"
          ? "border-amber-300/50 bg-amber-300/15 text-amber-300"
          : "border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan";

  return (
    <section className={`space-y-3 ${className}`.trim()}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-1">
        <button
          type="button"
          onClick={onToggle}
          className="group flex min-w-0 flex-1 items-start gap-2 text-left"
          aria-expanded={open}
        >
          <span
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
              open
                ? toggleOpenClass
                : "border-white/20 bg-white/5 text-white/50 group-hover:border-white/30"
            }`}
          >
            {open ? <Minus size={12} strokeWidth={2.5} /> : <Plus size={12} strokeWidth={2.5} />}
          </span>
          <span className="min-w-0">
            <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span
                className={`text-xs font-medium uppercase tracking-widest ${titleClassName}`}
              >
                {title}
              </span>
              {sizeSummary && (
                <span
                  className={`text-xs tabular-nums normal-case tracking-tight ${sizeAccentClassName}`}
                  aria-label={`${formatBytesCompact(sizeSummary.selectedBytes)} selected of ${formatBytesCompact(sizeSummary.totalBytes)} total in ${title}`}
                >
                  <span className="text-white/45">( </span>
                  <CompactSizeAmount bytes={sizeSummary.selectedBytes} />
                  <span className="px-0.5 text-white/70">/</span>
                  <CompactSizeAmount bytes={sizeSummary.totalBytes} />
                  <span className="text-white/45"> )</span>
                </span>
              )}
            </span>
            {subtitle && (
              <span
                className={`mt-1 block text-xs font-normal normal-case tracking-normal ${subtitleClassName}`}
              >
                {subtitle}
              </span>
            )}
          </span>
        </button>

        {headerAction}
      </div>
      <div className={`space-y-3 ${open ? "" : "hidden"}`} aria-hidden={!open}>
        {children}
      </div>
    </section>
  );
}
