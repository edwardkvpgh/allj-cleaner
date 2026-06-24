import type { InterferenceApp, LockingApp } from "../types";
import {
  closeableInterferenceApps,
  filterCloseableLockingApps,
  mergeLockingApps,
} from "./apps";

const SCOPED_DEPENDENCY_CATEGORY_IDS = new Set([
  "user_temp",
  "chrome_cache",
  "edge_cache",
  "firefox_cache",
  "brave_cache",
  "chrome_cookies",
  "chrome_history",
  "chrome_site_storage",
  "edge_cookies",
  "edge_history",
  "edge_site_storage",
  "brave_cookies",
  "brave_history",
  "brave_site_storage",
  "firefox_cookies",
  "firefox_history",
  "firefox_site_storage",
  "teams_cache",
  "discord_cache",
  "spotify_cache",
]);

export function categoryMayHaveRunningDeps(categoryId: string): boolean {
  return SCOPED_DEPENDENCY_CATEGORY_IDS.has(categoryId);
}

/** Categories that skip yeet preflight — downloads has its own confirm modal; DNS is an action. */
const PREFLIGHT_SKIP_CATEGORY_IDS = new Set(["downloads_folder", "dns_cache"]);

export function categoryIdsForCleanPreflight(categoryIds: string[]): string[] {
  return categoryIds.filter((id) => !PREFLIGHT_SKIP_CATEGORY_IDS.has(id));
}

export type CleanPreflightResult =
  | { kind: "blocking"; apps: LockingApp[] }
  | { kind: "advisory"; apps: InterferenceApp[] }
  | { kind: "proceed" };

export async function resolveCleanPreflight(
  categoryIds: string[],
  fetchers: {
    getLockingApps: (ids: string[]) => Promise<LockingApp[]>;
    getInterferenceApps: (ids: string[]) => Promise<InterferenceApp[]>;
  },
): Promise<CleanPreflightResult> {
  const preflightIds = categoryIdsForCleanPreflight(categoryIds);
  if (preflightIds.length === 0) {
    return { kind: "proceed" };
  }

  const [interference, locking] = await Promise.all([
    fetchers.getInterferenceApps(preflightIds),
    fetchers.getLockingApps(preflightIds),
  ]);

  const merged = mergeLockingApps(
    filterCloseableLockingApps(locking),
    closeableInterferenceApps(interference),
  );

  if (merged.length > 0) {
    return { kind: "blocking", apps: merged };
  }

  if (interference.length > 0 || preflightIds.includes("user_temp")) {
    return { kind: "advisory", apps: interference };
  }

  return { kind: "proceed" };
}

export async function findCloseableBlockingApps(
  categoryIds: string[],
  fetchers: {
    getLockingApps: (ids: string[]) => Promise<LockingApp[]>;
    getInterferenceApps: (ids: string[]) => Promise<InterferenceApp[]>;
  },
): Promise<LockingApp[]> {
  const [interference, locking] = await Promise.all([
    fetchers.getInterferenceApps(categoryIds),
    fetchers.getLockingApps(categoryIds),
  ]);

  return mergeLockingApps(
    filterCloseableLockingApps(locking),
    closeableInterferenceApps(interference),
  );
}
