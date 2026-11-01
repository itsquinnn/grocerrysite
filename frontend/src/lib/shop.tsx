import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type CartLine = { product_id: string; size: string; color: string; quantity: number };

type ShopCtx = {
  user: User | null;
  isAdmin: boolean;
  authReady: boolean;
  cart: CartLine[];
  cartCount: number;
  addToCart: (line: CartLine, stock: number) => Promise<boolean>;
  setQty: (line: CartLine, qty: number) => Promise<void>;
  removeFromCart: (line: CartLine) => Promise<void>;
  clearLocalCart: () => void;
  wishlist: string[];
  toggleWishlist: (productId: string) => Promise<void>;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  reloadCart: () => Promise<void>;
};

const Ctx = createContext<ShopCtx | null>(null);
const CART_KEY = "dovan_cart";
const WISH_KEY = "dovan_wishlist";
const same = (a: CartLine, b: CartLine) => a.product_id === b.product_id && a.size === b.size && a.color === b.color;

function readLocal<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const mergedFor = useRef<string | null>(null);

  const loadRemote = useCallback(async (uid: string) => {
    const [{ data: c }, { data: w }, { data: r }] = await Promise.all([
      supabase.from("cart_items").select("product_id,size,color,quantity").eq("user_id", uid),
      supabase.from("wishlist_items").select("product_id").eq("user_id", uid),
      supabase.from("user_roles").select("role").eq("user_id", uid),
    ]);
    setCart((c ?? []) as CartLine[]);
    setWishlist((w ?? []).map((x) => x.product_id));
    setIsAdmin(!!r?.some((x) => x.role === "admin"));
  }, []);

  const syncUser = useCallback(
    async (u: User | null) => {
      setUser(u);
      if (!u) {
        mergedFor.current = null;
        setIsAdmin(false);
        setCart(readLocal(CART_KEY, []));
        setWishlist(readLocal(WISH_KEY, []));
        setAuthReady(true);
        return;
      }
      if (mergedFor.current !== u.id) {
        mergedFor.current = u.id;
        const localCart = readLocal<CartLine[]>(CART_KEY, []);
        const localWish = readLocal<string[]>(WISH_KEY, []);
        if (localCart.length) {
          const { data: existing } = await supabase.from("cart_items").select("product_id,size,color,quantity").eq("user_id", u.id);
          for (const l of localCart) {
            const ex = existing?.find((e) => same(e as CartLine, l));
            await supabase.from("cart_items").upsert(
              { user_id: u.id, product_id: l.product_id, size: l.size, color: l.color, quantity: Math.min(20, (ex?.quantity ?? 0) + l.quantity) },
              { onConflict: "user_id,product_id,size,color" },
            );
          }
          localStorage.removeItem(CART_KEY);
        }
        if (localWish.length) {
          await supabase.from("wishlist_items").upsert(localWish.map((p) => ({ user_id: u.id, product_id: p })), { onConflict: "user_id,product_id", ignoreDuplicates: true });
          localStorage.removeItem(WISH_KEY);
        }
      }
      await loadRemote(u.id);
      setAuthReady(true);
    },
    [loadRemote],
  );

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") return;
      setTimeout(() => void syncUser(session?.user ?? null), 0);
    });
    supabase.auth.getSession().then(({ data }) => syncUser(data.session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, [syncUser]);

  const persistLocal = (next: CartLine[]) => {
    setCart(next);
    localStorage.setItem(CART_KEY, JSON.stringify(next));
  };

  const addToCart = async (line: CartLine, stock: number) => {
    if (stock <= 0) {
      toast.error("This item is out of stock");
      return false;
    }
    const ex = cart.find((c) => same(c, line));
    const qty = (ex?.quantity ?? 0) + line.quantity;
    if (qty > stock) {
      toast.error(`Only ${stock} available`);
      return false;
    }
    if (qty > 20) {
      toast.error("Maximum 20 per item");
      return false;
    }
    if (user) {
      const { error } = await supabase.from("cart_items").upsert(
        { user_id: user.id, ...line, quantity: qty },
        { onConflict: "user_id,product_id,size,color" },
      );
      if (error) {
        toast.error("Could not add to cart");
        return false;
      }
      await loadRemote(user.id);
    } else {
      persistLocal(ex ? cart.map((c) => (same(c, line) ? { ...c, quantity: qty } : c)) : [...cart, line]);
    }
    return true;
  };

  const setQty = async (line: CartLine, qty: number) => {
    if (qty < 1) return removeFromCart(line);
    if (user) {
      await supabase.from("cart_items").update({ quantity: qty }).match({ user_id: user.id, product_id: line.product_id, size: line.size, color: line.color });
      await loadRemote(user.id);
    } else persistLocal(cart.map((c) => (same(c, line) ? { ...c, quantity: qty } : c)));
  };

  const removeFromCart = async (line: CartLine) => {
    if (user) {
      await supabase.from("cart_items").delete().match({ user_id: user.id, product_id: line.product_id, size: line.size, color: line.color });
      await loadRemote(user.id);
    } else persistLocal(cart.filter((c) => !same(c, line)));
  };

  const toggleWishlist = async (pid: string) => {
    const has = wishlist.includes(pid);
    if (user) {
      if (has) await supabase.from("wishlist_items").delete().match({ user_id: user.id, product_id: pid });
      else await supabase.from("wishlist_items").insert({ user_id: user.id, product_id: pid });
      await loadRemote(user.id);
    } else {
      const next = has ? wishlist.filter((x) => x !== pid) : [...wishlist, pid];
      setWishlist(next);
      localStorage.setItem(WISH_KEY, JSON.stringify(next));
    }
    toast.success(has ? "Removed from wishlist" : "Saved to wishlist");
  };

  const value = useMemo<ShopCtx>(
    () => ({
      user, isAdmin, authReady, cart,
      cartCount: cart.reduce((s, c) => s + c.quantity, 0),
      addToCart, setQty, removeFromCart,
      clearLocalCart: () => persistLocal([]),
      wishlist, toggleWishlist, cartOpen, setCartOpen,
      reloadCart: async () => { if (user) await loadRemote(user.id); },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, isAdmin, authReady, cart, wishlist, cartOpen],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useShop() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useShop outside ShopProvider");
  return c;
}

// Recently viewed / search history (device-local by design)
export function pushRecent(key: string, value: string, max = 10) {
  const list = readLocal<string[]>(key, []).filter((x) => x !== value);
  list.unshift(value);
  localStorage.setItem(key, JSON.stringify(list.slice(0, max)));
}
export function getRecent(key: string): string[] {
  if (typeof window === "undefined") return [];
  return readLocal<string[]>(key, []);
}
