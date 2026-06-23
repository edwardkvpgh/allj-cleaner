import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import type { LockingApp } from "../types";
import { appProcessLabel, displayAppName } from "../utils/apps";
import { SectionSelectionBar } from "./SectionSelectionBar";

export type BlockingModalMode = "scan" | "clean";

interface BlockingAppsModalProps {
  apps: LockingApp[];
  open: boolean;
  busy: boolean;
  mode: BlockingModalMode;
  onCancel: () => void;
  onSkip?: () => void;
  onConfirm: (selectedApps: LockingApp[]) => void;
}

export function BlockingAppsModal({
  apps,
  open,
  busy,
  mode,
  onCancel,
  onSkip,
  onConfirm,
}: BlockingAppsModalProps) {
  const [selectedPids, setSelectedPids] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (open) {
      setSelectedPids(new Set(apps.map((app) => app.pid)));
    }
  }, [open, apps]);

  if (typeof document === "undefined" || !open || apps.length === 0) {
    return null;
  }

  const selectedApps = apps.filter((app) => selectedPids.has(app.pid));
  const allSelected = selectedApps.length === apps.length;
  const isScanMode = mode === "scan";

  const toggleApp = (pid: number) => {
    setSelectedPids((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid);
      else next.add(pid);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedPids(allSelected ? new Set() : new Set(apps.map((app) => app.pid)));
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={() => {
        if (!busy) onCancel();
      }}
    >
      <div
        className="glass-card w-full max-w-md border-neon-pink/30 p-5 shadow-glow"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neon-pink/15">
            <AlertTriangle className="text-neon-pink" size={20} />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-white">
              {isScanMode ? "apps still running" : "apps blocking cleanup"}
            </h3>
            <p className="mt-1 text-sm text-white/50">
              {isScanMode
                ? "browsers and other apps can skew your scan. close them first for best results."
                : "pick which apps to close, then yeet again."}
            </p>
          </div>
        </div>

        <div className="mb-2">
          <SectionSelectionBar
            selectedCount={selectedApps.length}
            totalCount={apps.length}
            allSelected={allSelected}
            onToggle={toggleAll}
            disabled={busy}
          />
        </div>

        <ul className="mb-4 max-h-48 space-y-2 overflow-y-auto">
          {apps.map((app) => {
            const checked = selectedPids.has(app.pid);
            const processLabel = appProcessLabel(app);
            return (
              <li key={app.pid}>
                <button
                  type="button"
                  onClick={() => toggleApp(app.pid)}
                  disabled={busy}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm transition-colors ${
                    checked
                      ? "border-neon-pink/40 bg-neon-pink/10"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                        checked
                          ? "border-neon-pink bg-neon-pink text-void"
                          : "border-white/20 bg-transparent"
                      }`}
                    >
                      {checked && <Check size={12} strokeWidth={3} />}
                    </span>
                    <span className="min-w-0 text-left">
                      <span className="block font-medium text-white">
                        {displayAppName(app.name)}
                      </span>
                      {processLabel && (
                        <span className="block text-xs text-white/40">{processLabel}</span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <p className="mb-4 text-xs text-amber-400/80">
          unsaved work in closed apps will be lost. File Explorer, shell, search, and other system apps are never closed.
        </p>

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60 transition-colors hover:border-white/20 hover:text-white disabled:opacity-40"
          >
            {isScanMode ? "I'll close manually" : "cancel"}
          </button>
          {isScanMode && onSkip && (
            <button
              type="button"
              onClick={onSkip}
              disabled={busy}
              className="rounded-xl border border-neon-cyan/30 bg-neon-cyan/10 px-4 py-2.5 text-sm font-medium text-neon-cyan transition-colors hover:bg-neon-cyan/20 disabled:opacity-40"
            >
              scan anyway
            </button>
          )}
          <button
            type="button"
            onClick={() => onConfirm(selectedApps)}
            disabled={busy || selectedApps.length === 0}
            className="rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple px-4 py-2.5 font-display text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy
              ? "closing..."
              : isScanMode
                ? `close ${selectedApps.length} app${selectedApps.length === 1 ? "" : "s"} & scan`
                : `close ${selectedApps.length} app${selectedApps.length === 1 ? "" : "s"} & yeet`}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
