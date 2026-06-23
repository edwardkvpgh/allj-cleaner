import type { CleanResult, ScanCategory } from "../types";
import { formatBytes } from "./format";

export function enrichCleanResult(
  result: CleanResult,
  before: ScanCategory[],
  after: ScanCategory[] = [],
): CleanResult {
  let enriched = result;

  if (
    enriched.files_removed === 0 &&
    enriched.freed_bytes === 0 &&
    enriched.categories_cleaned.length > 0
  ) {
    const cleanedBefore = before.filter((category) =>
      enriched.categories_cleaned.includes(category.id),
    );
    const freed = cleanedBefore.reduce((sum, category) => sum + category.size_bytes, 0);
    const items = cleanedBefore.reduce((sum, category) => sum + category.file_count, 0);

    if (freed > 0 || items > 0) {
      enriched = {
        ...enriched,
        freed_bytes: freed,
        files_removed: items,
      };
    }
  }

  if (enriched.files_removed > 0 || enriched.freed_bytes > 0 || after.length === 0) {
    return enriched;
  }

  const cleanedIds = before
    .filter((category) => {
      const next = after.find((item) => item.id === category.id);
      const hadJunk = category.size_bytes > 0 || category.file_count > 0;
      const isNowClean =
        !next || (next.size_bytes === 0 && next.file_count === 0);
      return hadJunk && isNowClean;
    })
    .map((category) => category.id);

  if (cleanedIds.length === 0) {
    return enriched;
  }

  const cleanedBefore = before.filter((category) => cleanedIds.includes(category.id));
  const freed = cleanedBefore.reduce((sum, category) => sum + category.size_bytes, 0);
  const items = cleanedBefore.reduce((sum, category) => sum + category.file_count, 0);

  return {
    ...enriched,
    freed_bytes: Math.max(enriched.freed_bytes, freed),
    files_removed: Math.max(enriched.files_removed, items),
    categories_cleaned: Array.from(
      new Set([...enriched.categories_cleaned, ...cleanedIds]),
    ),
  };
}

function formatCleanedCategories(before: ScanCategory[], cleanedIds: string[]): string {
  const names = before
    .filter((category) => cleanedIds.includes(category.id))
    .map((category) => category.name);

  if (names.length === 0) {
    return cleanedIds.join(", ");
  }

  return names.join(", ");
}

function formatCleanSummary(result: CleanResult, before: ScanCategory[]): string {
  const cleanedNames = formatCleanedCategories(before, result.categories_cleaned);
  const parts: string[] = [];

  if (result.freed_bytes > 0) {
    parts.push(`freed ${formatBytes(result.freed_bytes)}`);
  }

  if (result.files_removed > 0) {
    parts.push(`${result.files_removed.toLocaleString()} items yeeted`);
  }

  if (result.categories_cleaned.includes("dns_cache")) {
    parts.push("DNS cache flushed");
  }

  if (parts.length === 0 && cleanedNames) {
    return `cleared ${cleanedNames}`;
  }

  if (cleanedNames) {
    return `${parts.join(" · ")} from ${cleanedNames}`;
  }

  return parts.join(" · ");
}

function hasLockIssues(result: CleanResult) {
  return (
    result.files_skipped_locked > 0 ||
    result.errors.some(
      (error) =>
        error.toLowerCase().includes("error 32") ||
        error.toLowerCase().includes("being used by another process") ||
        error.toLowerCase().includes("in use"),
    )
  );
}

function hasThumbnailReboot(result: CleanResult, before: ScanCategory[]): boolean {
  return (
    result.files_scheduled_reboot > 0 &&
    result.categories_cleaned.includes("thumbnail_cache") &&
    before.some((category) => category.id === "thumbnail_cache")
  );
}

export function getCleanBanner(result: CleanResult, before: ScanCategory[] = []) {
  const hasRemoved = result.files_removed > 0 || result.freed_bytes > 0;
  const hasCleanedCategories = result.categories_cleaned.length > 0;
  const hasSkipped = result.files_skipped_locked > 0;
  const hasScheduled = result.files_scheduled_reboot > 0;
  const lockIssues = hasLockIssues(result);
  const isPartial = lockIssues || hasScheduled;
  const summary = formatCleanSummary(result, before);
  const thumbnailReboot = hasThumbnailReboot(result, before);
  const explorerTip = thumbnailReboot
    ? "restart File Explorer or reboot to finish thumbnail cleanup"
    : null;

  if ((hasRemoved || hasCleanedCategories) && !isPartial) {
    return {
      tone: "success" as const,
      border: "border-neon-lime/30 bg-neon-lime/5",
      text: "text-neon-lime",
      title: "she's clean ✨",
      subtitle: summary || "cleanup complete",
      tip: null,
      showCloseApps: false,
    };
  }

  if ((hasRemoved || hasCleanedCategories) && isPartial) {
    return {
      tone: "partial" as const,
      border: "border-neon-cyan/30 bg-neon-cyan/5",
      text: "text-neon-cyan",
      title: "partially yeeted 🧹",
      subtitle: [
        summary,
        hasSkipped
          ? `${result.files_skipped_locked.toLocaleString()} skipped (in use)`
          : lockIssues
            ? "some files still locked"
            : null,
        hasScheduled
          ? `${result.files_scheduled_reboot.toLocaleString()} queued for restart`
          : null,
      ]
        .filter(Boolean)
        .join(" · "),
      tip: explorerTip ?? "close blocking apps below, then yeet again",
      showCloseApps: true,
    };
  }

  return {
    tone: "warn" as const,
    border: "border-amber-400/30 bg-amber-400/5",
    text: "text-amber-400",
    title: lockIssues ? "files are locked 🔒" : "couldn't yeet anything ⚠️",
    subtitle: lockIssues
      ? [
          hasSkipped
            ? `${result.files_skipped_locked.toLocaleString()} files in use`
            : "temp files are held open by other apps",
          hasScheduled
            ? `${result.files_scheduled_reboot.toLocaleString()} queued for restart`
            : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : result.errors[0] ?? "no files could be removed",
    tip: lockIssues
      ? explorerTip ?? "tap find blocking apps to pick what to close"
      : explorerTip ?? "close other apps using temp files, then rescan & yeet again",
    showCloseApps: lockIssues,
  };
}

export function hasCleanLockIssues(result: CleanResult) {
  return hasLockIssues(result);
}
