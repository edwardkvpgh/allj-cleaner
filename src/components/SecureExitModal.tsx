import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { Check, LogOut, Shield } from "lucide-react";
import type { ScanCategory } from "../types";
import { isCategorySelectable } from "../utils/categories";
import { SectionSelectionBar } from "./SectionSelectionBar";

interface SecureExitModalProps {
  open: boolean;
  categories: ScanCategory[];
  initialSelectedIds: Set<string>;
  onCancel: () => void;
  onConfirm: (selectedIds: Set<string>) => void;
}

export function SecureExitModal({
  open,
  categories,
  initialSelectedIds,
  onCancel,
  onConfirm,
}: SecureExitModalProps) {
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
      selectedCount > 0
        ? new Set()
        : new Set(selectableCategories.map((category) => category.id)),
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-overlay/75 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="glass-card w-full max-w-md border-neon-purple/35 p-5 shadow-glow"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neon-purple/15">
            <LogOut className="text-neon-purple" size={20} />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-fg">
              secure exit
            </h3>
            <p className="text-body-secondary mt-1">
              shared PC mode — untick anything to skip, then apply to your
              selection.
            </p>
          </div>
        </div>

        <div className="notice-warn mb-4 text-sm">
          You will be signed out of websites. Saved passwords, bookmarks, and
          extensions are not removed.
        </div>

        {categories.length > 0 ? (
          <>
            <div className="mb-2">
              <SectionSelectionBar
                accent="purple"
                selectedCount={selectedCount}
                totalCount={categories.length}
                onToggle={toggleAll}
                disabled={selectableCategories.length === 0}
              />
            </div>

            <ul className="panel-inset mb-4 max-h-48 space-y-1.5 overflow-y-auto p-2">
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
                          ? "border-neon-purple/35 bg-neon-purple/10 text-fg"
                          : selectable
                            ? "border-transparent bg-transparent text-fg-muted hover:bg-fg/[0.04]"
                            : "border-transparent bg-transparent text-fg-subtle/70"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                          checked
                            ? "border-neon-purple bg-neon-purple text-void"
                            : selectable
                              ? "border-fg/20 bg-transparent"
                              : "border-fg/10 bg-transparent"
                        }`}
                      >
                        {checked && <Check size={12} strokeWidth={3} />}
                      </span>
                      <span className="text-base leading-none">{category.emoji}</span>
                      <span className="min-w-0 flex-1">{category.name}</span>
                      {!selectable && (
                        <span className="text-[10px] uppercase tracking-wide text-fg-subtle">
                          {!category.available ? "not installed" : "0 B"}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <p className="text-body-secondary mb-4">
            No secure-exit categories are available right now. Install Chrome,
            Edge, Brave, or Firefox, then run a scan.
          </p>
        )}

        <p className="text-caption mb-4 flex items-start gap-1.5">
          <Shield size={12} className="mt-0.5 shrink-0" />
          <span>Downloads folder is never included. Close browsers when prompted.</span>
        </p>

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
          >
            cancel
          </button>
          <button
            type="button"
            disabled={selectedCount === 0}
            onClick={() => onConfirm(new Set(selectedIds))}
            className="rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink px-4 py-2.5 font-display text-sm font-semibold text-on-accent disabled:opacity-40"
          >
            apply {selectedCount} to selection
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
