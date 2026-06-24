import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { Check, Shield, Zap } from "lucide-react";
import type { ScanCategory } from "../types";
import { isCategorySelectable } from "../utils/categories";
import { SectionSelectionBar } from "./SectionSelectionBar";

interface QuickCleanModalProps {
  open: boolean;
  categories: ScanCategory[];
  initialSelectedIds: Set<string>;
  onCancel: () => void;
  onConfirm: (selectedIds: Set<string>) => void;
}

export function QuickCleanModal({
  open,
  categories,
  initialSelectedIds,
  onCancel,
  onConfirm,
}: QuickCleanModalProps) {
  const selectableCategories = useMemo(
    () => categories.filter((category) => isCategorySelectable(category)),
    [categories],
  );

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      setSelectedIds(new Set(initialSelectedIds));
    }
  }, [open, initialSelectedIds]);

  if (typeof document === "undefined" || !open) {
    return null;
  }

  const selectedCount = categories.filter((category) =>
    selectedIds.has(category.id),
  ).length;
  const allSelected =
    selectableCategories.length > 0 &&
    selectableCategories.every((category) => selectedIds.has(category.id));

  const toggleCategory = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds(
      allSelected ? new Set() : new Set(selectableCategories.map((c) => c.id)),
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="glass-card w-full max-w-md border-neon-cyan/35 p-5 shadow-glow"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neon-cyan/15">
            <Zap className="text-neon-cyan" size={20} />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-white">
              quick clean
            </h3>
            <p className="mt-1 text-sm text-white/50">
              disk junk mode - untick anything to skip, then apply to your
              selection.
            </p>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-neon-cyan/25 bg-neon-cyan/10 px-3 py-2.5 text-sm leading-relaxed text-neon-cyan/90">
          Select which disk junk actions to include. Privacy and sign-out items
          are not part of quick clean.
        </div>

        {categories.length > 0 ? (
          <>
            <div className="mb-2">
              <SectionSelectionBar
                accent="cyan"
                selectedCount={selectedCount}
                totalCount={categories.length}
                allSelected={allSelected}
                onToggle={toggleAll}
                disabled={selectableCategories.length === 0}
              />
            </div>

            <ul className="mb-4 max-h-48 space-y-1.5 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.03] p-2">
              {categories.map((category) => {
                const selectable = isCategorySelectable(category);
                const checked = selectedIds.has(category.id);
                return (
                  <li key={category.id}>
                    <button
                      type="button"
                      disabled={!selectable}
                      onClick={() => selectable && toggleCategory(category.id)}
                      className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm transition-colors ${
                        checked
                          ? "border-neon-cyan/35 bg-neon-cyan/10 text-white/90"
                          : selectable
                            ? "border-transparent bg-transparent text-white/50 hover:bg-white/[0.04]"
                            : "border-transparent bg-transparent text-white/25"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                          checked
                            ? "border-neon-cyan bg-neon-cyan text-void"
                            : selectable
                              ? "border-white/20 bg-transparent"
                              : "border-white/10 bg-transparent"
                        }`}
                      >
                        {checked && <Check size={12} strokeWidth={3} />}
                      </span>
                      <span className="text-base leading-none">{category.emoji}</span>
                      <span className="min-w-0 flex-1">{category.name}</span>
                      {!selectable && (
                        <span className="text-[10px] uppercase tracking-wide text-white/25">
                          0 B
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <p className="mb-4 text-sm text-white/45">
            No disk-junk categories are available right now. Run a scan first.
          </p>
        )}

        <p className="mb-4 flex items-start gap-1.5 text-xs text-white/40">
          <Shield size={12} className="mt-0.5 shrink-0" />
          <span>This preset only applies to Disk Junk categories.</span>
        </p>

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60 transition-colors hover:border-white/20 hover:text-white"
          >
            cancel
          </button>
          <button
            type="button"
            disabled={selectedCount === 0}
            onClick={() => onConfirm(new Set(selectedIds))}
            className="rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple px-4 py-2.5 font-display text-sm font-semibold text-white disabled:opacity-40"
          >
            apply {selectedCount} to selection
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
