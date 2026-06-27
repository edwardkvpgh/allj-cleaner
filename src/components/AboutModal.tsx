import { createPortal } from "react-dom";
import { Sparkles, X } from "lucide-react";
import {
  APP_NAME,
  APP_VERSION,
  COMPANY_NAME,
} from "../constants/brand";

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

export function AboutModal({ open, onClose }: AboutModalProps) {
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
        aria-labelledby="about-title"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-3 border-b border-fg/10 px-6 pb-4 pt-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-purple to-neon-pink shadow-glow">
              <Sparkles size={24} className="text-on-accent" />
            </div>
            <div className="min-w-0">
              <h2
                id="about-title"
                className="font-display text-xl font-bold tracking-tight text-fg"
              >
                {APP_NAME}
              </h2>
              <p className="truncate text-sm text-fg-muted">{COMPANY_NAME}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close About"
            className="titlebar-no-drag flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-fg/10 text-fg-muted transition-colors hover:border-fg/20 hover:bg-fg/5 hover:text-fg"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-neon-lime/25 bg-neon-lime/10 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-neon-lime shadow-[0_0_8px_rgba(163,230,53,0.8)]" />
            <span className="font-display text-xs font-semibold tracking-wide text-fg">
              {APP_VERSION}
            </span>
          </div>

          <dl className="about-panel space-y-4 px-4 py-4 text-sm">
            <div>
              <dt className="font-display text-xs font-semibold uppercase tracking-wider text-fg-subtle">
                Summary
              </dt>
              <dd className="mt-1.5 space-y-2 leading-relaxed text-fg">
                <p>
                  Detox scans your PC for junk — temp files, browser caches, Recycle Bin,
                  and more — and shows exactly what can be removed before anything is deleted.
                </p>
                <p className="text-fg-muted">
                  You choose what to clean: disk junk, optional browser privacy data, and
                  misc items like Downloads or DNS cache. Nothing is removed until you confirm.
                </p>
              </dd>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-fg/8 pt-3">
              <div>
                <dt className="font-display text-xs font-semibold uppercase tracking-wider text-fg-subtle">
                  Platform
                </dt>
                <dd className="mt-1 font-medium text-fg">Windows 10 / 11</dd>
              </div>
              <div>
                <dt className="font-display text-xs font-semibold uppercase tracking-wider text-fg-subtle">
                  License
                </dt>
                <dd className="mt-1 font-medium text-fg">MIT</dd>
              </div>
            </div>
          </dl>
        </div>

        <div className="shrink-0 border-t border-fg/10 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink px-4 py-2.5 font-display text-sm font-semibold text-on-accent transition-opacity hover:opacity-90"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
