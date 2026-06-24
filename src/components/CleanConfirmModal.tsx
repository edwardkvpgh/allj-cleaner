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
      className="fixed inset-0 z-[9999] overflow-y-auto bg-black/75 p-3 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="clean-confirm-title"
    >
      <div className="flex min-h-full items-center justify-center py-2 sm:py-4">
        <div className="glass-card flex w-full max-w-lg flex-col overflow-hidden border-rose-400/35 p-5 shadow-glow">
          <div className="mb-4 flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                variant === "final" ? "bg-rose-500/15" : "bg-amber-400/15"
              }`}
            >
              {variant === "final" ? (
                <Trash2 className="text-rose-300" size={20} />
              ) : (
                <AlertTriangle className="text-amber-300" size={20} />
              )}
            </div>
            <div className="min-w-0">
              <h3
                id="clean-confirm-title"
                className="font-display text-lg font-semibold text-white"
              >
                {copy.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-zinc-300">{copy.subtitle}</p>
            </div>
          </div>

          <div className="mb-4 rounded-xl border border-white/15 bg-zinc-900/70 px-4 py-3">
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="text-zinc-400">
                {categories.length} categor{categories.length === 1 ? "y" : "ies"}
              </span>
              <span className="font-size-num font-semibold text-white">
                {formatBytes(totalBytes)}
              </span>
            </div>
            <ul className="max-h-40 space-y-1.5 overflow-y-auto pr-1 text-sm">
              {categories.map((category) => (
                <li
                  key={category.id}
                  className="flex items-center justify-between gap-3 text-zinc-200"
                >
                  <span className="min-w-0 truncate">
                    {category.emoji} {category.name}
                  </span>
                  <span className="font-size-num shrink-0 text-zinc-400">
                    {formatBytes(category.size_bytes)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {includesDownloads && (
            <p className="mb-3 text-sm leading-relaxed text-amber-200">
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
            <p className="mb-3 text-sm text-amber-200/90">DNS cache will be flushed.</p>
          )}

          <div className="flex flex-wrap justify-end gap-2 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
            >
              cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`rounded-xl px-5 py-2.5 font-display text-sm font-bold shadow-md ${
                variant === "final"
                  ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white"
                  : "bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950"
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
