import type { InterferenceApp } from "../types";
import { APP_NAME } from "../constants/brand";
import { appProcessLabel, displayAppName } from "../utils/apps";

const CLOSEABLE_ADVICE: Record<string, string> = {
  msedge:
    "Save your tabs, then fully quit Edge (File → Exit). Temp locks clear only after all msedge.exe processes stop.",
  chrome:
    "Save your work and close every Chrome window. Check the system tray for background Chrome helpers.",
  firefox: "Close all Firefox windows and quit from the menu — leftover renderer processes keep temp files locked.",
  brave: "Close all Brave windows completely before cleaning browser cache or temp files.",
  winword: "Save documents and close Word. Auto-save recovery files can hold temp copies open.",
  excel: "Save spreadsheets and close Excel before cleaning — formula caches write to temp folders.",
  powerpnt: "Save slides and close PowerPoint. Preview thumbnails can lock temp image files.",
  outlook: "Close Outlook and wait a few seconds — it syncs attachments into temp storage.",
  teams: "Quit Microsoft Teams from the tray icon, not just the window — it keeps temp call data open.",
  "ms-teams": "Quit Microsoft Teams from the tray icon, not just the window — it keeps temp call data open.",
  discord: "Fully exit Discord from the tray. Voice and cache processes continue in the background.",
  steam: "Close Steam or exit game downloads first — game installs heavily use your temp folder.",
  epicgameslauncher: "Close Epic Games Launcher and any active downloads before cleaning temp files.",
  onedrive: "Pause or quit OneDrive sync — it locks temp copies while uploading files.",
  dropbox: "Pause Dropbox sync before cleaning. Upload queues keep temp file handles open.",
  googledrivefs: "Quit Google Drive for desktop — it stages uploads in temp folders.",
  zoom: "Close Zoom completely from the system tray before cleaning.",
  slack: "Quit Slack from the tray — it caches messages and attachments in temp storage.",
  spotify: "Close Spotify if cleaning temp — offline cache writes to user temp directories.",
  cursor:
    "Cursor/VS Code may hold project temp files open. Save work and close the editor before a deep temp clean.",
  code: "VS Code extensions and terminals can lock temp files. Save work and fully quit the editor.",
  devenv: "Visual Studio builds write heavily to temp — stop debugging and close Visual Studio first.",
  java: "A Java app may be writing temp jars/logs. Stop the app or service before cleaning.",
  javaw: "A Java app may be writing temp jars/logs. Stop the app or service before cleaning.",
  python: "Python scripts or servers may hold temp files. Stop the script or virtualenv process first.",
  node: "A Node dev server or build tool may lock temp output. Stop npm/vite/rust dev processes first.",
  msedgewebview2:
    "Edge WebView host — often spawned by other apps. Close the parent app (Teams, Widgets, etc.) first.",
  notepad: "Save your notes and close Notepad — open files can leave temp swap files behind.",
};

const PROTECTED_ADVICE: Record<string, string> = {
  explorer:
    "File Explorer must stay running — never close it. Thumbnail cache uses delete-on-reboot for locked files.",
  runtimebroker:
    "Windows Runtime Broker — a system helper. We cannot close it; yeet anyway still removes unlocked files.",
  searchhost:
    "Windows Search indexes temp folders in the background. Yeet anyway cleans what is not indexed right now.",
  searchindexer:
    "Windows Search Indexer — a core background service. Do not force-close; wait or yeet anyway for partial temp cleanup.",
  dllhost:
    "COM surrogate process — hosts other apps. Restart the parent app if cleanup keeps failing.",
  svchost:
    "Core Windows service host — protected. Reboot if temp cleanup repeatedly skips the same files.",
  dwm: "Desktop Window Manager — required by Windows. Ignore unless cleanup fails repeatedly, then reboot.",
  taskhostw: "Windows background task host — protected system process. Partial cleanup still works.",
  applicationframehost:
    "Hosts UWP app windows — close the related Store/UWP app if temp cleanup keeps failing.",
  widgetservice:
    "Windows Widgets background service — usually safe to ignore; yeet anyway cleans unlocked files.",
  shellexperiencehost:
    `Windows shell UI (Start menu, notifications). Never force-close — it can black out your screen. ${APP_NAME} will not close this.`,
  msedgewebview2:
    "Embedded browser used by Teams, Widgets, and other apps. Close the parent app instead — we will not kill all WebView processes.",
  phoneexperiencehost:
    "Phone Link / Your Phone service — protected background process. Yeet anyway for partial cleanup.",
};

export function getAppAdvice(app: InterferenceApp): string {
  const key = app.name.toLowerCase().trimEnd();
  const base = key.endsWith(".exe") ? key.slice(0, -4) : key;

  const lockPrefix = app.holding_lock
    ? "Currently holding temp files open. "
    : "";

  if (app.closeable) {
    return (
      lockPrefix +
      (CLOSEABLE_ADVICE[base] ??
        "Save your work and fully close this app before cleaning for best results.")
    );
  }

  return (
    lockPrefix +
    (PROTECTED_ADVICE[base] ??
      "Protected Windows process — we cannot force-close it. Close related apps manually or yeet anyway for partial cleanup.")
  );
}

interface InterferenceAppListProps {
  apps: InterferenceApp[];
  loading?: boolean;
  emptyMessage?: string;
}

export function InterferenceAppList({
  apps,
  loading = false,
  emptyMessage = "No background apps detected right now. Temp files may still be locked briefly by Windows services.",
}: InterferenceAppListProps) {
  if (loading) {
    return (
      <p className="mb-4 text-xs text-white/40">scanning running processes...</p>
    );
  }

  if (apps.length === 0) {
    return (
      <p className="mb-4 text-xs leading-relaxed text-white/45">{emptyMessage}</p>
    );
  }

  const closeableCount = apps.filter((app) => app.closeable).length;

  return (
    <div className="mb-4">
      <p className="mb-2 text-xs text-white/40">
        {apps.length} background {apps.length === 1 ? "app" : "apps"} detected
        {closeableCount > 0
          ? ` · ${closeableCount} can be closed automatically`
          : " · none can be force-closed safely"}
      </p>
      <ul className="max-h-52 space-y-2 overflow-y-auto pr-1">
        {apps.map((app) => {
          const processLabel = appProcessLabel(app);
          return (
            <li
              key={`${app.name}-${app.pid}`}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
            >
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-white">
                  {displayAppName(app.name)}
                </span>
                {processLabel && (
                  <span className="text-xs text-white/35">{processLabel}</span>
                )}
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    app.closeable
                      ? "bg-neon-cyan/15 text-neon-cyan"
                      : "bg-amber-400/15 text-amber-300"
                  }`}
                >
                  {app.closeable ? "closeable" : "protected"}
                </span>
                {app.holding_lock && (
                  <span className="rounded-full bg-neon-pink/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neon-pink">
                    locking temp
                  </span>
                )}
              </div>
              <p className="text-xs leading-relaxed text-white/45">{getAppAdvice(app)}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
