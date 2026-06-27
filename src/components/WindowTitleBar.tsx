import { useCallback } from "react";
import type { MouseEvent } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Sparkles, Square, X } from "lucide-react";
import { APP_NAME } from "../constants/brand";

function appWindow() {
  return getCurrentWindow();
}

export function WindowTitleBar() {
  const startDrag = useCallback((event: MouseEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest(".titlebar-no-drag")) return;
    void appWindow().startDragging();
  }, []);

  const minimize = useCallback(() => {
    void appWindow().minimize();
  }, []);

  const toggleMaximize = useCallback(() => {
    void appWindow().toggleMaximize();
  }, []);

  const close = useCallback(() => {
    void appWindow().close();
  }, []);

  return (
    <div className="titlebar-shell relative z-20 h-10 w-full shrink-0 overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="titlebar-orb left-[30%] top-1/2 h-10 w-52 -translate-x-1/2 -translate-y-1/2 animate-pulse_slow bg-neon-purple/35" />
        <div
          className="titlebar-orb left-1/2 top-1/2 h-9 w-44 -translate-x-1/2 -translate-y-1/2 animate-float bg-neon-cyan/30"
          style={{ animationDelay: "1.2s" }}
        />
        <div
          className="titlebar-orb right-28 top-1/2 h-10 w-40 -translate-y-1/2 animate-float bg-neon-pink/28"
          style={{ animationDelay: "2.4s" }}
        />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent" />
      </div>

      <div className="relative z-10 flex h-full items-stretch">
        <div
          data-tauri-drag-region
          onMouseDown={startDrag}
          onDoubleClick={toggleMaximize}
          className="titlebar-drag flex min-w-0 flex-1 items-center gap-2 px-3"
        >
          <div
            data-tauri-drag-region
            className="titlebar-drag flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-neon-purple/30 shadow-[0_0_12px_rgba(168,85,247,0.45)]"
          >
            <Sparkles size={13} className="pointer-events-none text-neon-cyan drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
          </div>
          <span
            data-tauri-drag-region
            className="titlebar-drag truncate font-display text-xs font-semibold tracking-wide text-fg/90"
          >
            {APP_NAME}
          </span>
        </div>

        <div className="titlebar-no-drag flex shrink-0 items-stretch">
          <button
            type="button"
            aria-label="Minimize window"
            onClick={minimize}
            className="titlebar-no-drag flex h-10 w-11 items-center justify-center text-fg/55 transition-colors hover:bg-fg/10 hover:text-fg"
          >
            <Minus size={14} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            aria-label="Maximize window"
            onClick={toggleMaximize}
            className="titlebar-no-drag flex h-10 w-11 items-center justify-center text-fg/55 transition-colors hover:bg-fg/10 hover:text-fg"
          >
            <Square size={12} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            aria-label="Close window"
            onClick={close}
            className="titlebar-no-drag flex h-10 w-11 items-center justify-center text-fg/70 transition-colors hover:bg-neon-pink hover:text-fg hover:shadow-[inset_0_0_16px_rgba(255,45,149,0.35)]"
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
