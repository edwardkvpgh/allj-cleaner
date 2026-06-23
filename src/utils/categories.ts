import type { ScanCategory } from "../types";

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
