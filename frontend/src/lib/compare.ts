export const COMPARE_KEY = "dovan_compare";

export function getCompareList(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(COMPARE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveCompareList(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COMPARE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event("dovan_compare_change"));
  } catch {
    // Ignore storage errors
  }
}

export function toggleCompareProduct(id: string): { list: string[]; added: boolean } {
  const current = getCompareList();
  const exists = current.includes(id);
  let next: string[];
  if (exists) {
    next = current.filter((x) => x !== id);
  } else {
    if (current.length >= 4) {
      // Keep max 4 products for clean side-by-side comparison
      next = [...current.slice(1), id];
    } else {
      next = [...current, id];
    }
  }
  saveCompareList(next);
  return { list: next, added: !exists };
}

