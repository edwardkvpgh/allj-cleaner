import type { InterferenceApp, LockingApp } from "../types";

const APP_DISPLAY_NAMES: Record<string, string> = {
  msedge: "Microsoft Edge",
  chrome: "Google Chrome",
  firefox: "Mozilla Firefox",
  brave: "Brave",
  onedrive: "OneDrive",
  winword: "Microsoft Word",
  excel: "Microsoft Excel",
  powerpnt: "Microsoft PowerPoint",
  outlook: "Microsoft Outlook",
  teams: "Microsoft Teams",
  "ms-teams": "Microsoft Teams",
  discord: "Discord",
  spotify: "Spotify",
  steam: "Steam",
  epicgameslauncher: "Epic Games Launcher",
  zoom: "Zoom",
  slack: "Slack",
  dropbox: "Dropbox",
  googledrivefs: "Google Drive",
  cursor: "Cursor",
  code: "Visual Studio Code",
  devenv: "Visual Studio",
  java: "Java",
  javaw: "Java",
  python: "Python",
  node: "Node.js",
  msedgewebview2: "Edge WebView",
  explorer: "File Explorer",
  searchhost: "Windows Search",
  searchindexer: "Search Indexer",
  runtimebroker: "Runtime Broker",
  dllhost: "COM Surrogate",
  taskhostw: "Task Host",
  applicationframehost: "Application Frame",
  widgetservice: "Windows Widgets",
  shellexperiencehost: "Shell Experience",
  startmenuexperiencehost: "Start Menu",
  notepad: "Notepad",
};

/** Windows shell / search processes — closing these can black out the desktop. */
const PROTECTED_PROCESS_NAMES = new Set([
  "system",
  "registry",
  "smss",
  "csrss",
  "wininit",
  "services",
  "lsass",
  "svchost",
  "explorer",
  "dwm",
  "winlogon",
  "runtimebroker",
  "searchhost",
  "searchindexer",
  "searchprotocolhost",
  "sihost",
  "taskhostw",
  "dllhost",
  "applicationframehost",
  "widgetservice",
  "shellexperiencehost",
  "startmenuexperiencehost",
  "phoneexperiencehost",
  "textinputhost",
  "systemsettings",
  "lockapp",
  "ctfmon",
  "msedgewebview2",
  "allj-cleaner",
  "cursor",
  "node",
]);

export function isProtectedAppName(name: string): boolean {
  const base = name.toLowerCase().trimEnd().replace(/\.exe$/i, "");
  return PROTECTED_PROCESS_NAMES.has(base);
}

export function filterCloseableLockingApps(apps: LockingApp[]): LockingApp[] {
  return apps.filter((app) => !isProtectedAppName(app.name));
}

export function displayAppName(name: string): string {
  return APP_DISPLAY_NAMES[name.toLowerCase()] ?? name;
}

export function appProcessLabel(app: { name: string; process_count?: number }): string | null {
  const count = app.process_count ?? 1;
  if (count <= 1) return null;
  return `${count} background processes`;
}

export function closeableInterferenceApps(apps: InterferenceApp[]): LockingApp[] {
  return filterCloseableLockingApps(
    apps
      .filter((app) => app.closeable)
      .map(({ pid, name, process_count, pids }) => ({
        pid,
        name,
        process_count,
        pids,
      })),
  );
}
