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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-overlay/75 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="glass-card w-full max-w-lg border-fg/15 p-5 shadow-glow"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fg/10">
            <ShieldAlert className="text-fg-muted" size={20} />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-fg">
              {apps.length === 0
                ? "no background apps detected"
                : "only protected apps remain"}
            </h3>
            <p className="text-body-secondary mt-1">
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

        <p className="text-caption mb-4">
          {apps.length === 0
            ? "Close Chrome, Edge, or Office manually if they are open, then yeet again."
            : "Follow the advice above for protected processes, then yeet again — or yeet anyway now for partial cleanup."}
        </p>

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
          >
            got it
          </button>
          {onYeetAnyway && (
            <button
              type="button"
              onClick={onYeetAnyway}
              className="rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple px-4 py-2.5 font-display text-sm font-semibold text-on-accent"
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
