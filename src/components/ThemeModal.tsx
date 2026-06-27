import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { ThemeColorWheelIcon } from "./icons/DetoxIcons";
import { ThemePicker } from "./ThemePicker";

interface ThemeModalProps {
  open: boolean;
  onClose: () => void;
}

export function ThemeModal({ open, onClose }: ThemeModalProps) {
  if (typeof document === "undefined" || !open) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-overlay/70 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="about-modal flex max-h-[min(92vh,760px)] w-full max-w-lg flex-col"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-labelledby="theme-modal-title"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-3 border-b border-fg/10 px-6 pb-4 pt-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-purple shadow-glow">
              <ThemeColorWheelIcon size={26} />
            </div>
            <div className="min-w-0">
              <h2
                id="theme-modal-title"
                className="font-display text-xl font-bold tracking-tight text-fg"
              >
                Color themes
              </h2>
              <p className="truncate text-sm text-fg-muted">
                Pick a palette — Detox Original stays the default
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close color themes"
            className="titlebar-no-drag flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-fg/10 text-fg-muted transition-colors hover:border-fg/20 hover:bg-fg/5 hover:text-fg"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <ThemePicker embedded />
        </div>

        <div className="shrink-0 border-t border-fg/10 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple px-4 py-2.5 font-display text-sm font-semibold text-on-accent transition-opacity hover:opacity-90"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
