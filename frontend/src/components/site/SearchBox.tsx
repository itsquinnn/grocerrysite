import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Search, Clock, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { allProductsQuery } from "@/lib/catalog";
import { useI18n } from "@/lib/i18n";
import { getRecent, pushRecent } from "@/lib/shop";
import { cn } from "@/lib/utils";

export function SearchBox({
  className,
  onDone,
  autoFocus = false,
}: {
  className?: string;
  onDone?: () => void;
  autoFocus?: boolean;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const nav = useNavigate();
  const { t, formatPrice, isNepali, translateCategory, translateProduct } = useI18n();
  const { data: products = [] } = useQuery(allProductsQuery);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  useEffect(() => setHistory(getRecent("dovan_search")), [open]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const term = q.trim().toLowerCase();
  const matches = term
    ? products
        .filter((p) =>
          [p.name, p.brands?.name, p.categories?.name, p.subcategory].some((s) =>
            s?.toLowerCase().includes(term)
          )
        )
        .slice(0, 6)
    : [];

  const submit = (value: string) => {
    const v = value.trim();
    if (!v) return;
    pushRecent("dovan_search", v, 6);
    setOpen(false);
    onDone?.();
    void nav({ to: "/shop", search: { q: v } });
  };

  return (
    <div ref={ref} className={cn("relative", className)}>
      <form onSubmit={(e) => { e.preventDefault(); submit(q); }} role="search">
        <label htmlFor="site-search" className="sr-only">{t("search")}</label>
        <button
          type="submit"
          aria-label={t("search")}
          className="absolute left-3 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Search className="h-4 w-4" />
        </button>
        <input
          ref={inputRef}
          id="site-search"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={t("search_placeholder")}
          autoComplete="off"
          className="h-10 w-full rounded-md border bg-card pl-9 pr-9 text-sm outline-none focus:border-ring"
        />
        {q && (
          <button
            type="button"
            onClick={() => { setQ(""); inputRef.current?.focus(); }}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>
      {open && (matches.length > 0 || (!term && history.length > 0)) && (
        <div className="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-md border bg-popover shadow-card animate-in fade-in-0 duration-100">
          {!term && (
            <div className="p-2">
              <p className="eyebrow px-2 py-1">Recent searches</p>
              {history.map((h) => (
                <button
                  key={h}
                  onClick={() => submit(h)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted transition-colors"
                >
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {h}
                </button>
              ))}
            </div>
          )}
          {matches.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setOpen(false);
                onDone?.();
                pushRecent("dovan_search", p.name, 6);
                void nav({ to: "/product/$slug", params: { slug: p.slug } });
              }}
              className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted transition-colors"
            >
              <img
                src={p.images[0] || "/assets/products/canvas-tote.jpg"}
                alt=""
                onError={(e) => ((e.currentTarget as HTMLImageElement).src = "/assets/products/canvas-tote.jpg")}
                className="h-10 w-8 rounded object-cover bg-muted"
              />
              <span className="flex-1 text-sm">
                {translateProduct(p.name)}
                <span className="block text-xs text-muted-foreground">
                  {p.categories?.name ? translateCategory(p.categories.name) : ""}
                </span>
              </span>
              <span className="text-sm font-medium">{formatPrice(p.price)}</span>
            </button>
          ))}
          {term && (
            <button
              onClick={() => submit(q)}
              className="w-full border-t px-3 py-2 text-left text-sm font-medium hover:bg-muted transition-colors"
            >
              See all results for "{q}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}
