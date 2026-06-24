import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { invoke } from "@tauri-apps/api/core";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  File,
  Folder,
  FolderOpen,
  Search,
} from "lucide-react";
import type { DownloadEntry, ScanCategory } from "../types";
import { formatBytes, formatCount } from "../utils/format";

interface DownloadsConfirmModalProps {
  open: boolean;
  category: ScanCategory | null;
  alsoCleaningCategories?: ScanCategory[];
  onCancel: () => void;
  onConfirm: (excludedPaths: string[]) => void;
}

export function DownloadsConfirmModal({
  open,
  category,
  alsoCleaningCategories = [],
  onCancel,
  onConfirm,
}: DownloadsConfirmModalProps) {
  const [openingExplorer, setOpeningExplorer] = useState(false);
  const [browseError, setBrowseError] = useState<string | null>(null);
  const [excludeOpen, setExcludeOpen] = useState(false);
  const [entries, setEntries] = useState<DownloadEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [excludedPaths, setExcludedPaths] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!open) {
      setExcludeOpen(false);
      setExcludedPaths(new Set());
      setListError(null);
      setSearchQuery("");
      return;
    }

    setLoadingEntries(true);
    setListError(null);
    void invoke<DownloadEntry[]>("list_downloads_entries")
      .then((items) => {
        setEntries(items);
      })
      .catch(() => {
        setEntries([]);
        setListError("couldn't load downloads folder items");
      })
      .finally(() => {
        setLoadingEntries(false);
      });
  }, [open]);

  const folders = useMemo(
    () => entries.filter((entry) => entry.is_dir),
    [entries],
  );
  const files = useMemo(
    () => entries.filter((entry) => !entry.is_dir),
    [entries],
  );

  const filterEntries = (items: DownloadEntry[]) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return items;
    }
    return items.filter((entry) => entry.name.toLowerCase().includes(query));
  };

  const filteredFolders = useMemo(
    () => filterEntries(folders),
    [folders, searchQuery],
  );
  const filteredFiles = useMemo(
    () => filterEntries(files),
    [files, searchQuery],
  );

  const deleteStats = useMemo(() => {
    let sizeBytes = 0;
    let fileCount = 0;

    for (const entry of entries) {
      if (excludedPaths.has(entry.path)) {
        continue;
      }
      sizeBytes += Number(entry.size_bytes);
      fileCount += Number(entry.file_count);
    }

    return { sizeBytes, fileCount, itemCount: entries.length - excludedPaths.size };
  }, [entries, excludedPaths]);

  const allExcluded =
    entries.length > 0 && excludedPaths.size >= entries.length;
  const canConfirm = entries.length === 0 || !allExcluded;
  const hasFilteredResults =
    filteredFolders.length > 0 || filteredFiles.length > 0;

  if (typeof document === "undefined" || !open) {
    return null;
  }

  const scanFileCount = category?.file_count ?? 0;
  const scanSizeBytes = category?.size_bytes ?? 0;

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

  const toggleExcluded = (path: string) => {
    setExcludedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const clearExclusions = () => {
    setExcludedPaths(new Set());
  };

  const excludeAll = () => {
    setExcludedPaths(new Set(entries.map((entry) => entry.path)));
  };

  const openExcludePanel = () => {
    setExcludeOpen(true);
  };

  const renderEntry = (entry: DownloadEntry) => {
    const kept = excludedPaths.has(entry.path);

    return (
      <li key={entry.path}>
        <button
          type="button"
          onClick={() => toggleExcluded(entry.path)}
          className={`grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] ${
            kept
              ? "border-emerald-400/50 bg-emerald-500/10"
              : "border-white/15 bg-zinc-900/60 hover:border-white/25 hover:bg-zinc-900/90"
          }`}
        >
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${
              kept
                ? "border-emerald-400 bg-emerald-400 text-void"
                : "border-zinc-500 bg-zinc-800"
            }`}
            aria-hidden
          >
            {kept && <Check size={14} strokeWidth={3} />}
          </span>

          <span className="min-w-0">
            <span className="flex items-center gap-2">
              {entry.is_dir ? (
                <Folder size={16} className="shrink-0 text-amber-300" />
              ) : (
                <File size={16} className="shrink-0 text-zinc-300" />
              )}
              <span
                className="truncate text-[15px] font-medium leading-snug text-zinc-50"
                title={entry.name}
              >
                {entry.name}
              </span>
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed text-zinc-400 sm:hidden">
              <span className="font-size-num">{formatBytes(entry.size_bytes)}</span>
              {entry.is_dir ? ` · ${formatCount(entry.file_count)} items` : ""}
            </span>
          </span>

          <span className="hidden text-right text-xs leading-snug text-zinc-400 sm:block">
            <span className="font-size-num block text-zinc-300">
              {formatBytes(entry.size_bytes)}
            </span>
            {entry.is_dir && (
              <span className="font-size-num">{formatCount(entry.file_count)} items</span>
            )}
          </span>

          <span
            className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
              kept
                ? "bg-emerald-500/25 text-emerald-200"
                : "bg-rose-500/15 text-rose-200"
            }`}
          >
            {kept ? "keep" : "delete"}
          </span>
        </button>
      </li>
    );
  };

  const renderSection = (
    label: string,
    items: DownloadEntry[],
    totalCount: number,
  ) => {
    if (items.length === 0) {
      return null;
    }

    return (
      <div className="space-y-2">
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-md border border-white/10 bg-zinc-950/95 px-3 py-2 backdrop-blur-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            {label}
          </p>
          <p className="text-xs font-medium text-zinc-400">
            {items.length}
            {searchQuery.trim() && totalCount !== items.length
              ? ` of ${totalCount}`
              : ""}
          </p>
        </div>
        <ul className="space-y-1.5">{items.map(renderEntry)}</ul>
      </div>
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto bg-black/75 p-3 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="downloads-confirm-title"
    >
      <div className="flex min-h-full items-center justify-center py-2 sm:py-4">
      <div
        className={`glass-card flex w-full flex-col overflow-hidden border-amber-400/35 shadow-glow ${
          excludeOpen
            ? "max-h-[min(calc(100dvh-1.5rem),820px)] max-w-2xl p-4 sm:p-5"
            : "max-h-[min(calc(100dvh-1.5rem),640px)] max-w-lg p-5"
        }`}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="shrink-0">
          <div className="mb-3 flex items-start gap-3 sm:mb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/15">
              <Download className="text-amber-300" size={20} />
            </div>
            <div className="min-w-0">
              <h3
                id="downloads-confirm-title"
                className="font-display text-xl font-semibold text-white"
              >
                confirm downloads cleanup
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">
                {excludeOpen
                  ? "Check items you want to keep. Everything else in Downloads (top level only) will be permanently deleted."
                  : "Top-level files and folders will be permanently deleted unless you mark them to keep."}
              </p>
            </div>
          </div>

          <div
            className={`mb-3 rounded-xl border border-amber-400/40 bg-zinc-900/80 text-sm ${
              excludeOpen ? "grid gap-2.5 px-4 py-3 sm:grid-cols-2" : "px-4 py-3"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-400">Folder total</span>
              <span className="font-size-num font-semibold text-white">
                {formatCount(scanFileCount)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-400">Size</span>
              <span className="font-size-num font-semibold text-white">
                {formatBytes(scanSizeBytes)}
              </span>
            </div>
            {entries.length > 0 && (
              <>
                <div className="flex items-center justify-between gap-3 sm:col-span-2 sm:border-t sm:border-white/10 sm:pt-2.5">
                  <span className="text-zinc-400">Will remove</span>
                  <span className="font-size-num text-right font-semibold text-rose-200">
                    {formatCount(deleteStats.itemCount)} items ·{" "}
                    {formatBytes(deleteStats.sizeBytes)}
                  </span>
                </div>
                {excludedPaths.size > 0 && (
                  <div className="flex items-center justify-between gap-3 text-sm sm:col-span-2">
                    <span className="text-zinc-400">Keeping</span>
                    <span className="font-size-num font-semibold text-emerald-300">
                      {excludedPaths.size} item{excludedPaths.size === 1 ? "" : "s"}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {alsoCleaningCategories.length > 0 && (
            <div className="mb-3 rounded-xl border border-neon-cyan/35 bg-neon-cyan/10 px-4 py-3 text-sm">
              <p className="font-medium text-neon-cyan">
                Also cleaning with this yeet
              </p>
              <ul className="mt-2 space-y-1 text-zinc-200">
                {alsoCleaningCategories.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate">{item.name}</span>
                    <span className="font-size-num shrink-0 text-zinc-400">
                      {formatBytes(item.size_bytes)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                Deselect these under Disk junk or Privacy if you only want Downloads.
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => (excludeOpen ? setExcludeOpen(false) : openExcludePanel())}
          className="mb-3 flex w-full shrink-0 items-center justify-between rounded-xl border border-white/20 bg-zinc-900/50 px-4 py-3 text-sm font-medium text-zinc-100 transition-colors hover:border-white/30 hover:bg-zinc-900/80"
        >
          <span>
            Exclude files / folders
            {entries.length > 0 && (
              <span className="ml-2 font-normal text-zinc-400">
                ({entries.length} top-level)
              </span>
            )}
          </span>
          {excludeOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {excludeOpen && (
          <div className="mb-3 rounded-xl border border-white/15 bg-zinc-950/90">
            <div className="space-y-2.5 border-b border-white/10 p-3">
              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Filter by name…"
                  className="w-full rounded-lg border border-white/15 bg-zinc-900 py-2.5 pl-10 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/25"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-zinc-300">
                  <span className="font-semibold text-emerald-300">{excludedPaths.size}</span>{" "}
                  kept ·{" "}
                  <span className="font-semibold text-rose-300">{deleteStats.itemCount}</span> to
                  delete
                </p>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={clearExclusions}
                    className="text-sm text-zinc-400 underline-offset-2 hover:text-white hover:underline"
                  >
                    Clear keeps
                  </button>
                  <button
                    type="button"
                    onClick={excludeAll}
                    className="text-sm text-emerald-400 underline-offset-2 hover:text-emerald-300 hover:underline"
                  >
                    Keep all
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3">
              {loadingEntries ? (
                <p className="py-8 text-center text-sm text-zinc-400">
                  Loading downloads items…
                </p>
              ) : listError ? (
                <p className="py-8 text-center text-sm text-red-300">{listError}</p>
              ) : entries.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-400">
                  Downloads folder is empty.
                </p>
              ) : !hasFilteredResults ? (
                <p className="py-8 text-center text-sm text-zinc-400">
                  No items match &ldquo;{searchQuery.trim()}&rdquo;
                </p>
              ) : (
                <div className="space-y-4">
                  {renderSection("folders", filteredFolders, folders.length)}
                  {renderSection("files", filteredFiles, files.length)}
                </div>
              )}
            </div>
          </div>
        )}

        </div>

        <div className="shrink-0 border-t border-white/10 pt-4">
          <p className="mb-3 flex items-start gap-2 text-sm leading-relaxed text-zinc-300">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" />
            <span>
              Permanent delete — not Recycle Bin. Excluded folders keep everything inside them.
            </span>
          </p>

          <button
            type="button"
            onClick={() => void handleBrowseInExplorer()}
            disabled={openingExplorer}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-zinc-900/50 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:border-white/30 hover:bg-zinc-900 hover:text-white disabled:cursor-wait disabled:opacity-60"
          >
            <FolderOpen size={16} className="shrink-0 text-amber-400" />
            {openingExplorer ? "Opening…" : "Browse in Explorer"}
          </button>

          {browseError ? (
            <p className="mb-3 text-sm text-red-300">{browseError}</p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-zinc-500">
              One more confirmation before delete. Click Cancel to close.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canConfirm}
              onClick={() => onConfirm(Array.from(excludedPaths))}
              className="rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-2.5 font-display text-sm font-bold text-zinc-950 shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              {excludedPaths.size > 0
                ? `Yes, clean downloads (keep ${excludedPaths.size})`
                : "Yes, clean downloads"}
            </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>,
    document.body,
  );
}
