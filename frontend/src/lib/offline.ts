import type { Product } from "./catalog";

const CATALOG_KEY = "dovan_offline_catalog";
const CATEGORIES_KEY = "dovan_offline_categories";
const BRANDS_KEY = "dovan_offline_brands";
const RECENT_KEY = "dovan_offline_recent_full";
const MAX_RECENT = 12;

// In-memory fallback cache available on both SSR (Node.js) and Browser runtime
const inMemoryStore = new Map<string, unknown>();

function safeGet<T>(key: string, fallback: T): T {
  if (inMemoryStore.has(key)) {
    const mem = inMemoryStore.get(key) as T;
    if (Array.isArray(mem) ? mem.length > 0 : Boolean(mem)) {
      return mem;
    }
  }
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as T;
      inMemoryStore.set(key, parsed);
      return parsed;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  inMemoryStore.set(key, value);
  if (typeof window === "undefined") return;
  const write = () => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Local storage full or private mode
    }
  };
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(write);
  } else {
    setTimeout(write, 0);
  }
}

export function saveOfflineCatalog(products: Product[]): void {
  if (!products || !Array.isArray(products)) return;
  safeSet(CATALOG_KEY, products);
}

export function getOfflineCatalog(): Product[] {
  return safeGet<Product[]>(CATALOG_KEY, []);
}

export function saveOfflineProduct(product: Product): void {
  if (!product?.id) return;
  const current = getOfflineCatalog();
  const existingIndex = current.findIndex((p) => p.id === product.id);
  if (existingIndex >= 0) {
    current[existingIndex] = product;
  } else {
    current.push(product);
  }
  safeSet(CATALOG_KEY, current);
}

export function getOfflineProduct(idOrSlug: string): Product | null {
  const catalog = getOfflineCatalog();
  return catalog.find((p) => p.id === idOrSlug || p.slug === idOrSlug) ?? null;
}

export function saveOfflineCategories(categories: unknown[]): void {
  safeSet(CATEGORIES_KEY, categories);
}

export function getOfflineCategories(): unknown[] {
  return safeGet<unknown[]>(CATEGORIES_KEY, []);
}

export function saveOfflineBrands(brands: unknown[]): void {
  safeSet(BRANDS_KEY, brands);
}

export function getOfflineBrands(): unknown[] {
  return safeGet<unknown[]>(BRANDS_KEY, []);
}

export function saveRecentViewedProduct(product: Product): void {
  if (!product?.id) return;
  const list = safeGet<Product[]>(RECENT_KEY, []).filter((p) => p.id !== product.id);
  list.unshift(product);
  safeSet(RECENT_KEY, list.slice(0, MAX_RECENT));
}

export function getRecentViewedProducts(): Product[] {
  return safeGet<Product[]>(RECENT_KEY, []);
}

