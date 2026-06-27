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
  titleClassName = "text-fg-muted",
  sizeSummary,
  sizeAccentClassName = "text-fg-muted",
  subtitleClassName = "text-fg-muted/90",
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
        ? "border-section-purple/45 bg-section-purple/12 text-section-purple"
        : accent === "amber"
          ? "border-section-amber/45 bg-section-amber/12 text-section-amber"
          : "border-section-cyan/40 bg-section-cyan/10 text-section-cyan";

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
                : "border-fg/20 bg-fg/5 text-fg-subtle group-hover:border-fg/30 group-hover:text-fg-muted"
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
                  <span className="text-fg-subtle">( </span>
                  <CompactSizeAmount bytes={sizeSummary.selectedBytes} />
                  <span className="px-0.5 text-fg-muted">/</span>
                  <CompactSizeAmount bytes={sizeSummary.totalBytes} />
                  <span className="text-fg-subtle"> )</span>
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
