import { createPortal } from "react-dom";
import { AlertTriangle, Trash2 } from "lucide-react";
import type { ScanCategory } from "../types";
import { formatBytes } from "../utils/format";

export type CleanConfirmVariant = "start" | "final";

interface CleanConfirmModalProps {
  open: boolean;
  variant: CleanConfirmVariant;
  categories: ScanCategory[];
  excludedDownloadPaths?: string[];
  onCancel: () => void;
  onConfirm: () => void;
}

const COPY = {
  start: {
    title: "confirm cleanup",
    subtitle: "Review what will be cleaned. You will get one more confirmation before anything is deleted.",
    confirm: "continue",
  },
  final: {
    title: "last chance — delete permanently?",
    subtitle: "This cannot be undone. Files are not sent to the Recycle Bin.",
    confirm: "yes, delete permanently",
  },
} as const;

export function CleanConfirmModal({
  open,
  variant,
  categories,
  excludedDownloadPaths = [],
  onCancel,
  onConfirm,
}: CleanConfirmModalProps) {
  if (typeof document === "undefined" || !open || categories.length === 0) {
    return null;
  }

  const copy = COPY[variant];
  const totalBytes = categories.reduce((sum, category) => sum + category.size_bytes, 0);
  const includesDownloads = categories.some((category) => category.id === "downloads_folder");
  const includesPrivacy = categories.some((category) =>
    /cookies|history|site_storage/.test(category.id),
  );
  const includesDns = categories.some((category) => category.id === "dns_cache");

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto bg-overlay/75 p-3 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="clean-confirm-title"
    >
      <div className="flex min-h-full items-center justify-center py-2 sm:py-4">
        <div className="glass-card flex w-full max-w-lg flex-col overflow-hidden border-rose-400/35 p-5 shadow-glow">
          <div className="mb-4 flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                variant === "final" ? "bg-rose-500/15" : "bg-warn-bg/15"
              }`}
            >
              {variant === "final" ? (
                <Trash2 className="text-rose-300" size={20} />
              ) : (
                <AlertTriangle className="text-warn" size={20} />
              )}
            </div>
            <div className="min-w-0">
              <h3
                id="clean-confirm-title"
                className="font-display text-lg font-semibold text-fg"
              >
                {copy.title}
              </h3>
              <p className="text-body-secondary mt-1">{copy.subtitle}</p>
            </div>
          </div>

          <div className="panel-inset-strong mb-4 px-4 py-3">
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="text-fg-muted">
                {categories.length} categor{categories.length === 1 ? "y" : "ies"}
              </span>
              <span className="font-size-num font-semibold text-fg">
                {formatBytes(totalBytes)}
              </span>
            </div>
            <ul className="max-h-40 space-y-1.5 overflow-y-auto pr-1 text-sm">
              {categories.map((category) => (
                <li
                  key={category.id}
                  className="flex items-center justify-between gap-3 text-fg"
                >
                  <span className="min-w-0 truncate">
                    {category.emoji} {category.name}
                  </span>
                  <span className="font-size-num shrink-0 text-fg-muted">
                    {formatBytes(category.size_bytes)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {includesDownloads && (
            <p className="notice-warn mb-3 text-sm">
              Downloads: top-level items will be permanently deleted
              {excludedDownloadPaths.length > 0
                ? ` (${excludedDownloadPaths.length} kept).`
                : "."}
            </p>
          )}
          {includesPrivacy && (
            <p className="mb-3 text-sm text-neon-pink/90">
              Privacy items selected — you may be signed out of websites.
            </p>
          )}
          {includesDns && (
            <p className="notice-warn mb-3 text-sm">DNS cache will be flushed.</p>
          )}

          <div className="flex flex-wrap justify-end gap-2 border-t border-fg/10 pt-4">
            <button type="button" onClick={onCancel} className="btn-secondary">
              cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`rounded-xl px-5 py-2.5 font-display text-sm font-bold shadow-md ${
                variant === "final"
                  ? "bg-gradient-to-r from-rose-500 to-rose-600 text-on-accent"
                  : "bg-gradient-to-r from-warn-bg to-warn text-on-accent"
              }`}
            >
              {copy.confirm}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
