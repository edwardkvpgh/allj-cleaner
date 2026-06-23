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
    <div className="relative z-20 flex h-10 w-full shrink-0 items-stretch border-b border-neon-purple/35 bg-gradient-to-r from-[#1a0f2e] via-void to-[#0d1524] shadow-[0_1px_0_rgba(168,85,247,0.25)]">
      <div
        data-tauri-drag-region
        onMouseDown={startDrag}
        onDoubleClick={toggleMaximize}
        className="titlebar-drag flex min-w-0 flex-1 items-center gap-2 px-3"
      >
        <div
          data-tauri-drag-region
          className="titlebar-drag flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-neon-purple/25"
        >
          <Sparkles size={13} className="pointer-events-none text-neon-cyan" />
        </div>
        <span
          data-tauri-drag-region
          className="titlebar-drag truncate font-display text-xs font-semibold tracking-wide text-white/85"
        >
          {APP_NAME}
        </span>
      </div>

      <div className="titlebar-no-drag flex shrink-0 items-stretch">
        <button
          type="button"
          aria-label="Minimize window"
          onClick={minimize}
          className="titlebar-no-drag flex h-10 w-11 items-center justify-center text-white/55 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Minus size={14} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          aria-label="Maximize window"
          onClick={toggleMaximize}
          className="titlebar-no-drag flex h-10 w-11 items-center justify-center text-white/55 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Square size={12} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          aria-label="Close window"
          onClick={close}
          className="titlebar-no-drag flex h-10 w-11 items-center justify-center text-white/70 transition-colors hover:bg-neon-pink hover:text-white"
        >
          <X size={15} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
