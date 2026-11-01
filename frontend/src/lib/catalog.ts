import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  saveOfflineCatalog,
  getOfflineCatalog,
  saveOfflineProduct,
  getOfflineProduct,
  saveOfflineCategories,
  getOfflineCategories,
  saveOfflineBrands,
  getOfflineBrands,
} from "./offline";

export type Product = Database["public"]["Tables"]["products"]["Row"] & {
  categories?: { slug: string; name: string } | null;
  brands?: { slug: string; name: string } | null;
};

export const PRODUCT_SELECT = "*, categories(slug,name), brands(slug,name)";

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async () => {
    try {
      const { data, error } = await supabase.from("categories").select("*").order("sort");
      if (error) throw error;
      saveOfflineCategories(data ?? []);
      return data;
    } catch (err) {
      const cached = getOfflineCategories() as Database["public"]["Tables"]["categories"]["Row"][];
      if (cached && cached.length) return cached;
      throw err;
    }
  },
  staleTime: 60_000,
});

export const brandsQuery = queryOptions({
  queryKey: ["brands"],
  queryFn: async () => {
    try {
      const { data, error } = await supabase.from("brands").select("*").order("name");
      if (error) throw error;
      saveOfflineBrands(data ?? []);
      return data;
    } catch (err) {
      const cached = getOfflineBrands() as Database["public"]["Tables"]["brands"]["Row"][];
      if (cached && cached.length) return cached;
      throw err;
    }
  },
  staleTime: 60_000,
});

export const allProductsQuery = queryOptions({
  queryKey: ["products", "all"],
  queryFn: async () => {
    try {
      const { data, error } = await supabase.from("products").select(PRODUCT_SELECT).eq("is_active", true).order("created_at", { ascending: false });
      if (error) throw error;
      const list = (data ?? []) as unknown as Product[];
      saveOfflineCatalog(list);
      return list;
    } catch (err) {
      const cached = getOfflineCatalog();
      if (cached && cached.length) return cached;
      throw err;
    }
  },
  staleTime: 30_000,
});

export const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from("products").select(PRODUCT_SELECT).eq("slug", slug).maybeSingle();
        if (error) throw error;
        const prod = (data as unknown as Product | null);
        if (prod) saveOfflineProduct(prod);
        return prod;
      } catch (err) {
        const cached = getOfflineProduct(slug);
        if (cached) return cached;
        throw err;
      }
    },
  });

export const reviewsQuery = (productId: string) =>
  queryOptions({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const { data, error } = await supabase.from("reviews").select("*").eq("product_id", productId).eq("is_approved", true).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export type Quote = {
  tax_rate: number;
  lines: { product_id: string; name: string; sku: string; image: string; size: string; color: string; unit_price: number; quantity: number; line_total: number }[];
  subtotal: number; discount: number; coupon_code: string | null; coupon_error: string | null;
  shipping_fee: number; tax: number; total: number;
};

export async function fetchQuote(items: { product_id: string; size: string; color: string; quantity: number }[], coupon: string, shipping: string) {
  const { data, error } = await supabase.rpc("quote_order", { _items: items, _coupon: coupon || "", _shipping_method: shipping });
  if (error) throw new Error(error.message);
  return data as unknown as Quote;
}
