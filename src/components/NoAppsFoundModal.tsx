import { createPortal } from "react-dom";
import { ShieldAlert } from "lucide-react";
import { InterferenceAppList } from "./InterferenceAppList";
import type { InterferenceApp } from "../types";

interface NoAppsFoundModalProps {
  open: boolean;
  apps: InterferenceApp[];
  loadingApps: boolean;
  onCancel: () => void;
  onYeetAnyway?: () => void;
}

export function NoAppsFoundModal({
  open,
  apps,
  loadingApps,
  onCancel,
  onYeetAnyway,
}: NoAppsFoundModalProps) {
  if (typeof document === "undefined" || !open) {
    return null;
  }

  const closeableCount = apps.filter((app) => app.closeable).length;
  const protectedCount = apps.length - closeableCount;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="glass-card w-full max-w-lg border-white/15 p-5 shadow-glow"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <ShieldAlert className="text-white/70" size={20} />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-white">
              {apps.length === 0
                ? "no background apps detected"
                : "only protected apps remain"}
            </h3>
            <p className="mt-1 text-sm text-white/50">
              {apps.length === 0
                ? "nothing we can list is running right now — temp files may still be briefly locked by Windows."
                : closeableCount === 0
                  ? `${protectedCount} protected system ${protectedCount === 1 ? "process is" : "processes are"} running. we cannot force-close these.`
                  : "review the list below and follow the advice for each app."}
            </p>
          </div>
        </div>

        <InterferenceAppList
          apps={apps}
          loading={loadingApps}
          emptyMessage="No background processes detected. Temp files may still be briefly locked — yeet anyway cleans unlocked files only."
        />

        <p className="mb-4 text-xs leading-relaxed text-white/45">
          {apps.length === 0
            ? "Close Chrome, Edge, or Office manually if they are open, then yeet again."
            : "Follow the advice above for protected processes, then yeet again — or yeet anyway now for partial cleanup."}
        </p>

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60 transition-colors hover:border-white/20 hover:text-white"
          >
            got it
          </button>
          {onYeetAnyway && (
            <button
              type="button"
              onClick={onYeetAnyway}
              className="rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple px-4 py-2.5 font-display text-sm font-semibold text-white"
            >
              yeet anyway
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
