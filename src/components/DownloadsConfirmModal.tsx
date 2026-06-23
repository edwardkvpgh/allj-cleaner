import { useState } from "react";
import { createPortal } from "react-dom";
import { invoke } from "@tauri-apps/api/core";
import { AlertTriangle, Download, FolderOpen } from "lucide-react";
import type { ScanCategory } from "../types";
import { formatBytes, formatCount } from "../utils/format";

interface DownloadsConfirmModalProps {
  open: boolean;
  category: ScanCategory | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DownloadsConfirmModal({
  open,
  category,
  onCancel,
  onConfirm,
}: DownloadsConfirmModalProps) {
  const [openingExplorer, setOpeningExplorer] = useState(false);
  const [browseError, setBrowseError] = useState<string | null>(null);

  if (typeof document === "undefined" || !open) {
    return null;
  }

  const fileCount = category?.file_count ?? 0;
  const sizeBytes = category?.size_bytes ?? 0;

  const handleBrowseInExplorer = async () => {
    setBrowseError(null);
    setOpeningExplorer(true);
    try {
      await invoke("open_downloads_in_explorer");
    } catch {
      setBrowseError("couldn't open your downloads folder");
    } finally {
      setOpeningExplorer(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="glass-card w-full max-w-md border-amber-400/35 p-5 shadow-glow"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/15">
            <Download className="text-amber-300" size={20} />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-white">
              confirm downloads cleanup
            </h3>
            <p className="mt-1 text-sm text-white/50">
              this deletes files from your Downloads folder.
            </p>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2.5 text-sm leading-relaxed text-amber-100">
          <div className="flex items-center justify-between">
            <span className="text-white/75">items</span>
            <span className="font-semibold text-white">{formatCount(fileCount)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-white/75">size</span>
            <span className="font-semibold text-white">{formatBytes(sizeBytes)}</span>
          </div>
        </div>

        <p className="mb-4 flex items-start gap-1.5 text-xs text-white/45">
          <AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber-300" />
          <span>
            downloads is never part of secure exit. only continue if you reviewed these files.
          </span>
        </p>

        <button
          type="button"
          onClick={() => void handleBrowseInExplorer()}
          disabled={openingExplorer}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white/80 transition-colors hover:border-white/25 hover:bg-white/10 hover:text-white disabled:cursor-wait disabled:opacity-60"
        >
          <FolderOpen size={16} className="shrink-0 text-amber-300" />
          {openingExplorer ? "opening…" : "browse in explorer"}
        </button>

        {browseError ? (
          <p className="mb-4 text-xs text-red-300">{browseError}</p>
        ) : null}

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
            onClick={onConfirm}
            className="rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2.5 font-display text-sm font-semibold text-void"
          >
            yes, clean downloads
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
