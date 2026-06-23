import { motion } from "framer-motion";
import { Check, AlertTriangle } from "lucide-react";
import type { ScanCategory } from "../types";
import { formatBytes, formatCount } from "../utils/format";

interface CategoryCardProps {
  category: ScanCategory;
  selected: boolean;
  onToggle: (id: string) => void;
  index: number;
}

export function CategoryCard({
  category,
  selected,
  onToggle,
  index,
}: CategoryCardProps) {
  const disabled = !category.available || category.size_bytes === 0;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      onClick={() => !disabled && onToggle(category.id)}
      disabled={disabled}
      className={`group w-full text-left glass-card p-4 transition-all duration-300 ${
        disabled
          ? "cursor-not-allowed opacity-40"
          : selected
            ? "border-neon-purple/50 shadow-glow scale-[1.01]"
            : "hover:border-white/20 hover:bg-white/[0.06]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl transition-colors ${
            selected ? "bg-neon-purple/20" : "bg-white/5"
          }`}
        >
          {category.emoji}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-base font-semibold tracking-tight">
              {category.name}
            </h3>
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all ${
                selected
                  ? "border-neon-cyan bg-neon-cyan text-void"
                  : "border-white/20 bg-transparent"
              }`}
            >
              {selected && <Check size={14} strokeWidth={3} />}
            </div>
          </div>

          <p className="mt-1 text-sm leading-snug text-white/50">
            {category.description}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-neon-purple/15 px-2.5 py-0.5 text-xs font-medium text-neon-purple">
              {formatBytes(category.size_bytes)}
            </span>
            <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-white/40">
              {formatCount(category.file_count)} items
            </span>
            {!category.available && (
              <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-white/30">
                not found
              </span>
            )}
          </div>

          {category.warning && category.available && category.size_bytes > 0 && (
            <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-400/80">
              <AlertTriangle size={12} className="mt-0.5 shrink-0" />
              <span>{category.warning}</span>
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}
