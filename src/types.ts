export interface ScanCategory {
  id: string;
  name: string;
  description: string;
  emoji: string;
  size_bytes: number;
  file_count: number;
  paths: string[];
  available: boolean;
  warning: string | null;
}

export interface DownloadEntry {
  path: string;
  name: string;
  is_dir: boolean;
  size_bytes: number;
  file_count: number;
}

export interface CleanResult {
  freed_bytes: number;
  files_removed: number;
  files_skipped_locked: number;
  files_scheduled_reboot: number;
  errors: string[];
  categories_cleaned: string[];
}

export interface LockingApp {
  pid: number;
  name: string;
  process_count?: number;
  pids?: number[];
}

export interface InterferenceApp extends LockingApp {
  closeable: boolean;
  holding_lock?: boolean;
}

export interface CloseAppsResult {
  closed: LockingApp[];
  failed: string[];
}

export type AppPhase = "idle" | "scanning" | "results" | "cleaning" | "done";
