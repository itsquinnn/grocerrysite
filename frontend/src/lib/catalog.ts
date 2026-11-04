import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

export type Product = {
  id: string;
  name: string;
  title?: string;
  slug: string;
  sku: string;
  product_code?: string | null;
  description: string;
  unit?: string;
  category_id: string | null;
  subcategory?: string | null;
  subcategory_id?: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
  stock_quantity?: number;
  images: string[];
  image_url?: string | null;
  sizes: string[];
  colors: string[];
  specs: Record<string, string>;
  is_featured: boolean;
  is_active: boolean;
  sold_count: number;
  purchase_count?: number;
  rating_avg: number;
  avg_rating?: number | null;
  rating_count: number;
  review_count?: number;
  categories?: { id?: string; slug?: string; name: string } | null;
  subcategories?: { id?: string; slug?: string; name: string } | null;
  brands?: { id?: string; slug?: string; name: string } | null;
  created_at: string;
  updated_at?: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string | null;
  image_url: string | null;
  color_hex?: string | null;
  sort: number;
  sort_order?: number;
  is_active: boolean;
};

export type Brand = {
  id: string;
  name: string;
  slug: string;
};

export function slugify(str: string): string {
  return (str || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const FALLBACK_PRODUCT_IMG = "/assets/products/canvas-tote.jpg";

export function normalizeProduct(row: any): Product {
  if (!row) return row;
  const name = row.name ?? row.title ?? "Product";
  const slug = row.slug ?? (row.title ? slugify(row.title) : row.id);
  const price =
    typeof row.price === "number"
      ? row.price
      : row.price_paise != null
        ? row.price_paise / 100
        : 0;
  const compare_at_price =
    row.compare_at_price != null
      ? Number(row.compare_at_price)
      : row.original_price_paise != null
        ? row.original_price_paise / 100
        : null;
  const stock = typeof row.stock === "number" ? row.stock : (row.stock_quantity ?? 0);

  let images: string[] = [];
  if (Array.isArray(row.images) && row.images.length > 0) {
    images = row.images;
  } else if (row.image_url) {
    images = [row.image_url];
  } else {
    images = [FALLBACK_PRODUCT_IMG];
  }

  const sizes = Array.isArray(row.sizes) ? row.sizes : (row.unit ? [row.unit] : []);
  const colors = Array.isArray(row.colors) ? row.colors : [];
  const specs = row.specs && typeof row.specs === "object" ? row.specs : {};
  const sku = row.sku ?? row.product_code ?? "";
  const rating_avg = Number(row.rating_avg ?? row.avg_rating ?? 0);
  const rating_count = Number(row.rating_count ?? row.review_count ?? 0);
  const sold_count = Number(row.sold_count ?? row.purchase_count ?? 0);
  const is_featured = Boolean(
    row.is_featured ?? (row.is_special_deal || row.is_popular || row.is_todays_choice || false)
  );
  const subcategory = row.subcategory ?? row.subcategories?.name ?? row.subcategories?.slug ?? null;

  return {
    ...row,
    id: row.id,
    name,
    title: row.title ?? name,
    slug,
    price,
    compare_at_price,
    stock,
    stock_quantity: row.stock_quantity ?? stock,
    images,
    image_url: row.image_url ?? images[0],
    sizes,
    colors,
    specs,
    sku,
    product_code: row.product_code ?? sku,
    unit: row.unit ?? "1 kg",
    rating_avg,
    rating_count,
    sold_count,
    is_featured,
    subcategory,
    categories: row.categories ?? null,
    brands: row.brands ?? null,
    is_active: row.is_active ?? true,
    created_at: row.created_at ?? new Date().toISOString(),
  };
}

export const PRODUCT_SELECT = "*, categories(id, name, slug), subcategories(id, name, slug)";

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async (): Promise<Category[]> => {
    try {
      // Backend canonical schema uses sort_order
      let res = await supabase.from("categories").select("*").order("sort_order", { ascending: true });
      if (res.error) {
        // Fallback in case table schema varies
        res = await supabase.from("categories").select("*");
      }
      if (res.error) throw res.error;

      const list: Category[] = (res.data ?? []).map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug ?? slugify(c.name),
        image_url: c.image_url ?? null,
        color_hex: c.color_hex ?? null,
        sort: c.sort ?? c.sort_order ?? 0,
        sort_order: c.sort_order ?? c.sort ?? 0,
        is_active: c.is_active ?? true,
      }));
      saveOfflineCategories(list);
      return list;
    } catch (err) {
      const cached = getOfflineCategories() as Category[];
      if (cached && cached.length) return cached;
      console.error("Failed to load categories:", err);
      return [];
    }
  },
  staleTime: 5 * 60_000,
});

export const brandsQuery = queryOptions({
  queryKey: ["brands"],
  queryFn: async (): Promise<Brand[]> => {
    try {
      // The canonical database does not have a public.brands table.
      // Return cached offline brands or an empty list gracefully without throwing schema errors.
      const cached = getOfflineBrands() as Brand[];
      if (cached && cached.length) return cached;
      return [];
    } catch (err) {
      console.error("Failed to load brands:", err);
      return [];
    }
  },
  staleTime: 5 * 60_000,
});

export const allProductsQuery = queryOptions({
  queryKey: ["products", "all"],
  queryFn: async (): Promise<Product[]> => {
    try {
      let { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        // Fallback without subcategories join if relationship varies
        const res = await supabase
          .from("products")
          .select("*, categories(id, name, slug)")
          .eq("is_active", true)
          .order("created_at", { ascending: false });
        data = res.data;
        error = res.error;
      }

      if (error) {
        // Fallback to simple select
        const res = await supabase
          .from("products")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });
        data = res.data;
        error = res.error;
      }

      if (error) throw error;
      const list = (data ?? []).map((r) => normalizeProduct(r));
      saveOfflineCatalog(list);
      return list;
    } catch (err) {
      const cached = getOfflineCatalog() as Product[];
      if (cached && cached.length) return cached;
      console.error("Failed to load products:", err);
      return [];
    }
  },
  staleTime: 5 * 60_000,
});

export const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: async (): Promise<Product | null> => {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
        let data: any = null;
        let error: any = null;

        if (isUuid) {
          const res = await supabase
            .from("products")
            .select(PRODUCT_SELECT)
            .eq("id", slug)
            .maybeSingle();
          data = res.data;
          error = res.error;
        } else {
          // If slug is not a UUID, find by matching slug, id, or slugified title
          const res = await supabase
            .from("products")
            .select(PRODUCT_SELECT)
            .limit(100);
          if (res.data) {
            data = res.data.find(
              (p: any) =>
                p.slug === slug ||
                p.id === slug ||
                (p.title && slugify(p.title) === slug) ||
                (p.name && slugify(p.name) === slug)
            );
          } else {
            error = res.error;
          }
        }

        if (error) {
          // Fallback to simple query
          const res = await supabase.from("products").select("*").limit(100);
          if (res.data) {
            data = res.data.find(
              (p: any) =>
                p.slug === slug ||
                p.id === slug ||
                (p.title && slugify(p.title) === slug) ||
                (p.name && slugify(p.name) === slug)
            );
          }
        }

        const prod = data ? normalizeProduct(data) : null;
        if (prod) saveOfflineProduct(prod);
        return prod;
      } catch (err) {
        const cached = getOfflineProduct(slug);
        if (cached) return cached as Product;
        throw err;
      }
    },
    staleTime: 5 * 60_000,
  });

export const reviewsQuery = (productId: string) =>
  queryOptions({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      try {
        // In canonical schema, published reviews are joined with accounts
        let { data, error } = await supabase
          .from("reviews")
          .select("*, accounts(name, profile_image)")
          .eq("product_id", productId)
          .eq("is_published", true)
          .order("created_at", { ascending: false });

        if (error) {
          // Fallback query
          const res = await supabase
            .from("reviews")
            .select("*, accounts(name, profile_image)")
            .eq("product_id", productId)
            .order("created_at", { ascending: false });
          data = res.data;
        }

        return (data ?? []).map((r: any) => ({
          ...r,
          rating: r.rating ?? 5,
          title: r.title ?? "",
          body: r.review_text ?? r.body ?? "",
          author_name: r.accounts?.name || r.author_name || "Verified Customer",
          created_at: r.created_at ?? new Date().toISOString(),
        }));
      } catch (err) {
        console.error("Failed to load reviews:", err);
        return [];
      }
    },
  });

export type Quote = {
  tax_rate: number;
  lines: {
    product_id: string;
    name: string;
    sku: string;
    image: string;
    size: string;
    color: string;
    unit_price: number;
    quantity: number;
    line_total: number;
  }[];
  subtotal: number;
  discount: number;
  coupon_code: string | null;
  coupon_error: string | null;
  shipping_fee: number;
  tax: number;
  total: number;
};

export async function fetchQuote(
  items: { product_id: string; size: string; color: string; quantity: number }[],
  coupon: string,
  shipping: string
): Promise<Quote> {
  try {
    const pids = items.map((i) => i.product_id);
    let prodMap = new Map<string, any>();
    if (pids.length > 0) {
      const { data: prods } = await supabase
        .from("products")
        .select("id, title, price_paise, image_url, unit, product_code")
        .in("id", pids);

      if (prods) {
        prodMap = new Map(prods.map((p) => [p.id, p]));
      }
    }

    const lines = items.map((item) => {
      const p = prodMap.get(item.product_id);
      const unit_price = p ? (p.price_paise ? p.price_paise / 100 : (p.price ?? 50)) : 50;
      const name = p ? (p.title ?? p.name ?? "Grocery Item") : "Grocery Item";
      const image = p?.image_url || FALLBACK_PRODUCT_IMG;
      const sku = p?.product_code || "ITEM";
      return {
        product_id: item.product_id,
        name,
        sku,
        image,
        size: item.size,
        color: item.color,
        unit_price,
        quantity: item.quantity,
        line_total: unit_price * item.quantity,
      };
    });

    const subtotal = lines.reduce((acc, l) => acc + l.line_total, 0);
    const shipping_fee = shipping === "express" ? 150 : 100;
    let discount = 0;
    let coupon_error: string | null = null;

    if (coupon && coupon.trim()) {
      const codeClean = coupon.trim().toUpperCase();
      try {
        const { data: c } = await supabase
          .from("coupons")
          .select("*")
          .ilike("code", codeClean)
          .eq("is_active", true)
          .maybeSingle();

        if (c) {
          const now = new Date();
          const isExpired = c.expires_at ? new Date(c.expires_at) < now : false;
          const isLimitReached = c.usage_limit ? (c.used_count || 0) >= c.usage_limit : false;

          if (isExpired) {
            coupon_error = "This coupon code has expired.";
          } else if (isLimitReached) {
            coupon_error = "This coupon has reached its usage limit.";
          } else if (subtotal < (Number(c.min_order) || 0)) {
            coupon_error = `Minimum order of Rs. ${c.min_order} required for code ${codeClean}.`;
          } else {
            if (c.discount_type === "percent") {
              const rawDisc = Math.round(subtotal * (Number(c.value) / 100));
              discount = c.max_discount ? Math.min(rawDisc, Number(c.max_discount)) : rawDisc;
            } else {
              discount = Math.min(Number(c.value), subtotal);
            }
          }
        } else if (codeClean === "WELCOME10" || codeClean === "DOVAN10") {
          discount = Math.round(subtotal * 0.1);
        } else {
          coupon_error = `Coupon code "${coupon}" not found or inactive.`;
        }
      } catch {
        if (codeClean === "WELCOME10" || codeClean === "DOVAN10") {
          discount = Math.round(subtotal * 0.1);
        }
      }
    }

    const tax = Math.round((subtotal - discount) * 0.13 * 100) / 100;
    const total = Math.max(0, subtotal - discount + shipping_fee + tax);

    return {
      tax_rate: 0.13,
      lines,
      subtotal,
      discount,
      coupon_code: discount > 0 ? coupon : null,
      coupon_error,
      shipping_fee,
      tax,
      total,
    } as unknown as Quote;
  } catch (err) {
    return {
      tax_rate: 0.13,
      lines: items.map((i) => ({
        product_id: i.product_id,
        name: "Item",
        sku: "ITEM",
        image: FALLBACK_PRODUCT_IMG,
        size: i.size,
        color: i.color,
        unit_price: 50,
        quantity: i.quantity,
        line_total: 50 * i.quantity,
      })),
      subtotal: 50 * items.reduce((acc, i) => acc + i.quantity, 0),
      discount: 0,
      coupon_code: coupon || null,
      coupon_error: null,
      shipping_fee: 100,
      tax: 0,
      total: 50 * items.reduce((acc, i) => acc + i.quantity, 0) + 100,
    } as unknown as Quote;
  }
}
