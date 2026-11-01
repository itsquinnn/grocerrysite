import type { Product } from "./catalog";

const CATALOG_KEY = "dovan_offline_catalog";
const CATEGORIES_KEY = "dovan_offline_categories";
const BRANDS_KEY = "dovan_offline_brands";
const RECENT_KEY = "dovan_offline_recent_full";
const MAX_RECENT = 12;

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local storage full or private mode
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

