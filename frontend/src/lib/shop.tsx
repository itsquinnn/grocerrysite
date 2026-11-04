import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";

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

  const loadRemote = useCallback(async (uid: string, initialUser?: User | null) => {
    try {
      // 1. Fetch Cart via Backend API (avoids 403 RLS and 404 cart_items errors)
      try {
        const cartRes = await api.get<{ items: { product_id: string; quantity: number }[] }>("/cart");
        if (cartRes?.items) {
          const lines: CartLine[] = cartRes.items.map((x) => ({
            product_id: x.product_id,
            size: "",
            color: "",
            quantity: x.quantity,
          }));
          setCart(lines.length ? lines : readLocal(CART_KEY, []));
        } else {
          setCart(readLocal(CART_KEY, []));
        }
      } catch {
        setCart(readLocal(CART_KEY, []));
      }

      // 2. Fetch Wishlist via Backend API
      try {
        const favRes = await api.get<{ favorites: { product_id: string }[] }>("/favorites");
        if (favRes?.favorites) {
          const pids = favRes.favorites.map((f) => f.product_id);
          setWishlist(pids.length ? pids : readLocal(WISH_KEY, []));
        } else {
          setWishlist(readLocal(WISH_KEY, []));
        }
      } catch {
        setWishlist(readLocal(WISH_KEY, []));
      }

      // 3. User Role via multiple reliable checks:
      // A) Immediate metadata check from Supabase Auth session
      // B) RPC has_role check (security definer)
      // C) Backend /profile API check
      let userIsAdmin = (initialUser?.user_metadata as any)?.role === "admin";

      if (!userIsAdmin) {
        try {
          const { data: hasRoleAdmin } = await supabase.rpc("has_role", {
            _user_id: uid,
            _role: "admin",
          });
          if (hasRoleAdmin) userIsAdmin = true;
        } catch {}
      }

      if (!userIsAdmin) {
        try {
          const profRes = await api.get<{ role?: string }>("/profile");
          if (profRes?.role === "admin") userIsAdmin = true;
        } catch {}
      }

      setIsAdmin(userIsAdmin);
    } catch {
      setCart(readLocal(CART_KEY, []));
      setWishlist(readLocal(WISH_KEY, []));
    }
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
          for (const l of localCart) {
            try {
              await api.post("/cart", { product_id: l.product_id, quantity: l.quantity });
            } catch {}
          }
          localStorage.removeItem(CART_KEY);
        }
        if (localWish.length) {
          for (const p of localWish) {
            try {
              await api.post("/favorites", { product_id: p });
            } catch {}
          }
          localStorage.removeItem(WISH_KEY);
        }
      }
      await loadRemote(u.id, u);
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
      try {
        await api.post("/cart", { product_id: line.product_id, quantity: line.quantity });
        await loadRemote(user.id);
      } catch {
        persistLocal(ex ? cart.map((c) => (same(c, line) ? { ...c, quantity: qty } : c)) : [...cart, line]);
      }
    } else {
      persistLocal(ex ? cart.map((c) => (same(c, line) ? { ...c, quantity: qty } : c)) : [...cart, line]);
    }
    return true;
  };

  const setQty = async (line: CartLine, qty: number) => {
    if (qty < 1) return removeFromCart(line);
    if (user) {
      try {
        await api.put("/cart", { product_id: line.product_id, quantity: qty });
        await loadRemote(user.id);
      } catch {
        persistLocal(cart.map((c) => (same(c, line) ? { ...c, quantity: qty } : c)));
      }
    } else persistLocal(cart.map((c) => (same(c, line) ? { ...c, quantity: qty } : c)));
  };

  const removeFromCart = async (line: CartLine) => {
    if (user) {
      try {
        await api.delete(`/cart?product_id=${line.product_id}`);
        await loadRemote(user.id);
      } catch {
        persistLocal(cart.filter((c) => !same(c, line)));
      }
    } else persistLocal(cart.filter((c) => !same(c, line)));
  };

  const toggleWishlist = async (pid: string) => {
    const has = wishlist.includes(pid);
    if (user) {
      try {
        if (has) {
          await api.delete(`/favorites?product_id=${pid}`);
        } else {
          await api.post("/favorites", { product_id: pid });
        }
        await loadRemote(user.id);
      } catch {
        const next = has ? wishlist.filter((x) => x !== pid) : [...wishlist, pid];
        setWishlist(next);
      }
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
