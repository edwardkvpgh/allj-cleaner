import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";
import { APP_NAME } from "../constants/brand";
import { InterferenceAppList } from "./InterferenceAppList";
import type { InterferenceApp } from "../types";

interface TempCleanPromptProps {
  open: boolean;
  apps: InterferenceApp[];
  loadingApps: boolean;
  onCancel: () => void;
  onYeetAnyway: () => void;
  onFindApps: () => void;
}

export function TempCleanPrompt({
  open,
  apps,
  loadingApps,
  onCancel,
  onYeetAnyway,
  onFindApps,
}: TempCleanPromptProps) {
  if (typeof document === "undefined" || !open) {
    return null;
  }

  const hasCloseable = apps.some((app) => app.closeable);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="glass-card w-full max-w-lg border-neon-cyan/30 p-5 shadow-glow"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neon-cyan/15">
            <AlertTriangle className="text-neon-cyan" size={20} />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-white">
              temp files might be locked
            </h3>
            <p className="mt-1 text-sm text-white/50">
              these background processes can hold temp files open. close them first for a cleaner yeet.
            </p>
          </div>
        </div>

        <InterferenceAppList
          apps={apps}
          loading={loadingApps}
          emptyMessage="No known interference apps detected. Windows services may still lock some files — yeet anyway removes what is free."
        />

        <p className="mb-4 text-xs text-white/40">
          {hasCloseable
            ? `Use "find blocking apps" to close closeable apps automatically, or close protected ones manually.`
            : `Protected system apps cannot be force-closed — use the advice above, or let ${APP_NAME} try a partial clean.`}
        </p>

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
            onClick={onFindApps}
            disabled={loadingApps}
            className="rounded-xl border border-neon-cyan/30 bg-neon-cyan/10 px-4 py-2.5 text-sm font-medium text-neon-cyan transition-colors hover:bg-neon-cyan/20 disabled:opacity-40"
          >
            {hasCloseable ? "close closeable apps" : "find blocking apps"}
          </button>
          <button
            type="button"
            onClick={onYeetAnyway}
            className="rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple px-4 py-2.5 font-display text-sm font-semibold text-white"
          >
            yeet anyway
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
