import type { ScanCategory } from "../types";

export const PRIVACY_CATEGORY_IDS = new Set([
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
]);

export const MISC_CATEGORY_IDS = new Set(["downloads_folder", "dns_cache"]);

const SIGN_OUT_CATEGORY_IDS = new Set([
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
]);

export function isPrivacyCategory(id: string): boolean {
  return PRIVACY_CATEGORY_IDS.has(id);
}

export function isMiscCategory(id: string): boolean {
  return MISC_CATEGORY_IDS.has(id);
}

export function isActionCategory(id: string): boolean {
  return id === "dns_cache";
}

export function isSecureExitCategory(id: string): boolean {
  return isPrivacyCategory(id);
}

export function getSecureExitPresetCategories(
  categories: ScanCategory[],
): ScanCategory[] {
  return sortCategoriesBySize(
    categories.filter((category) => isSecureExitCategory(category.id)),
  );
}

export function resolveSecureExitSelection(categories: ScanCategory[]): Set<string> {
  return new Set(
    getSecureExitPresetCategories(categories)
      .filter(isCategorySelectable)
      .map((category) => category.id),
  );
}

export function secureExitAvailable(categories: ScanCategory[]): boolean {
  return resolveSecureExitSelection(categories).size > 0;
}

export function sortCategoriesBySize(categories: ScanCategory[]): ScanCategory[] {
  return [...categories].sort((a, b) => {
    const sizeDiff = Number(b.size_bytes) - Number(a.size_bytes);
    if (sizeDiff !== 0) {
      return sizeDiff;
    }
    if (a.available !== b.available) {
      return a.available ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

export type SectionSortMode = "size-desc" | "name-asc" | "name-desc";

export function sortCategoriesByName(
  categories: ScanCategory[],
  direction: "asc" | "desc",
): ScanCategory[] {
  return [...categories].sort((a, b) => {
    if (a.available !== b.available) {
      return a.available ? -1 : 1;
    }
    const cmp = a.name.localeCompare(b.name);
    return direction === "asc" ? cmp : -cmp;
  });
}

export function sortCategoriesForSection(
  categories: ScanCategory[],
  mode: SectionSortMode,
): ScanCategory[] {
  if (mode === "size-desc") {
    return sortCategoriesBySize(categories);
  }
  if (mode === "name-asc") {
    return sortCategoriesByName(categories, "asc");
  }
  return sortCategoriesByName(categories, "desc");
}

export function partitionCategories(categories: ScanCategory[]) {
  const disk: ScanCategory[] = [];
  const privacy: ScanCategory[] = [];
  const misc: ScanCategory[] = [];

  for (const category of categories) {
    if (isPrivacyCategory(category.id)) {
      privacy.push(category);
    } else if (isMiscCategory(category.id)) {
      misc.push(category);
    } else {
      disk.push(category);
    }
  }

  return {
    disk: sortCategoriesBySize(disk),
    privacy: sortCategoriesBySize(privacy),
    misc: sortCategoriesBySize(misc),
  };
}

export function isDiskCategory(id: string): boolean {
  return !isPrivacyCategory(id) && !isMiscCategory(id);
}

export function defaultSelectedCategoryIds(_categories: ScanCategory[]): Set<string> {
  return new Set();
}

export function isCategorySelectable(category: ScanCategory): boolean {
  if (!category.available) {
    return false;
  }
  if (isMiscCategory(category.id)) {
    return true;
  }
  return category.size_bytes > 0;
}

export function selectedIncludesPrivacy(selected: Set<string>): boolean {
  return Array.from(selected).some((id) => SIGN_OUT_CATEGORY_IDS.has(id));
}

export function selectedIncludesDns(selected: Set<string>): boolean {
  return selected.has("dns_cache");
}

export function selectedIncludesDownloads(selected: Set<string>): boolean {
  return selected.has("downloads_folder");
}

export function selectedIncludesThumbnail(selected: Set<string>): boolean {
  return selected.has("thumbnail_cache");
}

export function sectionSelectableCategories(
  sectionCategories: ScanCategory[],
): ScanCategory[] {
  return sectionCategories.filter(isCategorySelectable);
}

export function sectionAllSelected(
  selected: Set<string>,
  sectionCategories: ScanCategory[],
): boolean {
  const selectable = sectionSelectableCategories(sectionCategories);
  return (
    selectable.length > 0 && selectable.every((category) => selected.has(category.id))
  );
}

export function sectionSelectionCounts(
  selected: Set<string>,
  sectionCategories: ScanCategory[],
): { selectedCount: number; totalCount: number } {
  const selectedCount = sectionCategories.filter((category) =>
    selected.has(category.id),
  ).length;
  return { selectedCount, totalCount: sectionCategories.length };
}

export function sectionSizeTotals(
  selected: Set<string>,
  sectionCategories: ScanCategory[],
): { selectedBytes: number; totalBytes: number } {
  let selectedBytes = 0;
  let totalBytes = 0;

  for (const category of sectionCategories) {
    totalBytes += Number(category.size_bytes);
    if (selected.has(category.id)) {
      selectedBytes += Number(category.size_bytes);
    }
  }

  return { selectedBytes, totalBytes };
}

export function sectionAnySelected(
  selected: Set<string>,
  sectionCategories: ScanCategory[],
): boolean {
  return sectionCategories.some((category) => selected.has(category.id));
}

export function sectionSelectedIds(
  selected: Set<string>,
  sectionCategories: ScanCategory[],
): Set<string> {
  const sectionIds = new Set(sectionCategories.map((category) => category.id));
  return new Set([...selected].filter((id) => sectionIds.has(id)));
}
