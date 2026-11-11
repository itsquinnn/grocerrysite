import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Fragment, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Heart, Truck, RotateCcw, MapPin, Bell, Star, Layers } from "lucide-react";
import { getCompareList, toggleCompareProduct } from "@/lib/compare";
import { saveRecentViewedProduct } from "@/lib/offline";
import { allProductsQuery, productQuery, reviewsQuery, type Product } from "@/lib/catalog";
import { deliveryEstimate, discountPct } from "@/lib/format";
import { getRecent, pushRecent, useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { ProductCard, FALLBACK_IMG } from "@/components/site/ProductCard";
import { QtyStepper } from "@/components/site/CartDrawer";
import { Stars } from "@/components/site/Stars";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ context, params }) => {
    const p = await context.queryClient.ensureQueryData(productQuery(params.slug));
    if (!p) throw notFound();
    try {
      await context.queryClient.ensureQueryData(allProductsQuery);
    } catch {}
    return { name: p.name || p.title || "Product", description: p.description || "", price: p.price };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
        { title: `${loaderData.name} : DOVAN` },
        { name: "description", content: (loaderData.description || "").slice(0, 155) },
        { property: "og:title", content: `${loaderData.name} : DOVAN` },
        { property: "og:description", content: (loaderData.description || "").slice(0, 155) },
        { property: "og:type", content: "product" },
      ]
      : [{ title: "Product unavailable : DOVAN" }, { name: "robots", content: "noindex" }],
  }),
  notFoundComponent: () => (
    <div className="container-page py-24 text-center">
      <h1 className="text-3xl">Product not found</h1>
      <Link to="/shop" className="mt-4 inline-block underline">
        Back to shop
      </Link>
    </div>
  ),
  pendingComponent: ProductPageSkeleton,
  component: ProductPage,
});

function ProductMainImage({
  src,
  alt,
  off,
}: {
  src: string;
  alt: string;
  off: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    setZoomed(false);
    if (imgRef.current) {
      imgRef.current.style.transform = "scale(1)";
      imgRef.current.style.transformOrigin = "center center";
    }
  }, [src]);

  const updateZoomOrigin = (clientX: number, clientY: number) => {
    if (!containerRef.current || !imgRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const x = Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - r.top) / r.height) * 100));
    imgRef.current.style.transformOrigin = `${x}% ${y}%`;
    imgRef.current.style.transform = "scale(1.75)";
  };

  const handleToggleZoom = (e: React.MouseEvent<HTMLDivElement>) => {
    const next = !zoomed;
    setZoomed(next);
    if (next) {
      updateZoomOrigin(e.clientX, e.clientY);
    } else if (imgRef.current) {
      imgRef.current.style.transform = "scale(1)";
      imgRef.current.style.transformOrigin = "center center";
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomed) return;
    updateZoomOrigin(e.clientX, e.clientY);
  };

  const handleMouseLeave = () => {
    if (!zoomed) return;
    setZoomed(false);
    if (imgRef.current) {
      imgRef.current.style.transform = "scale(1)";
      imgRef.current.style.transformOrigin = "center center";
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleToggleZoom}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative w-full sm:flex-1 min-w-0 max-w-[540px] mx-auto sm:mx-0 overflow-hidden rounded-xl border border-border/60 bg-muted/20 select-none aspect-square",
        zoomed ? "cursor-zoom-out" : "cursor-zoom-in"
      )}
    >
      <img
        ref={imgRef}
        src={src || FALLBACK_IMG}
        alt={alt}
        width={800}
        height={800}
        loading="eager"
        decoding="async"
        onError={(e) => ((e.currentTarget as HTMLImageElement).src = FALLBACK_IMG)}
        className="h-full w-full object-cover transition-transform duration-200 ease-out"
      />
      {off > 0 && (
        <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-sale/90 px-2.5 py-0.5 text-xs font-semibold text-accent-foreground shadow-xs">
          -{off}%
        </span>
      )}
    </div>
  );
}

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: p } = useSuspenseQuery(productQuery(slug));
  const { data: all } = useSuspenseQuery(allProductsQuery);
  const product = p as Product;
  const { addToCart, wishlist, toggleWishlist, setCartOpen, user } = useShop();
  const { t, formatPrice, isNepali, translateProduct, translateCategory } = useI18n();
  const rawTitle = (product.name || "").replace(/[/\\_-]+/g, " ").trim();
  const fallbackTitle = product.categories?.name
    ? `${product.categories.name} Essential`
    : "Canvas Minimalist Tote";
  const validTitle = rawTitle.length > 0 ? product.name : fallbackTitle;
  const displayName = translateProduct(validTitle);
  const nav = useNavigate();
  const [img, setImg] = useState(0);
  const [size, setSize] = useState(product.sizes[0] ?? "");
  const [color, setColor] = useState(product.colors[0] ?? "");
  const [qty, setQty] = useState(1);
  const [district, setDistrict] = useState("");
  const [eta, setEta] = useState<ReturnType<typeof deliveryEstimate>>(null);
  const [recent, setRecent] = useState<Product[]>([]);
  const off = discountPct(Number(product.price), Number(product.compare_at_price));
  const out = product.stock <= 0;
  const [inCompare, setInCompare] = useState(false);

  useEffect(() => {
    setInCompare(getCompareList().includes(product.id));
    const onChange = () => setInCompare(getCompareList().includes(product.id));
    window.addEventListener("dovan_compare_change", onChange);
    return () => window.removeEventListener("dovan_compare_change", onChange);
  }, [product.id]);

  const handleCompare = () => {
    const { added } = toggleCompareProduct(product.id);
    setInCompare(added);
    if (added) {
      toast.success(
        `${product.name} added to comparison`,
        {
          action: {
            label: "View Compare",
            onClick: () => void nav({ to: "/compare" }),
          },
        }
      );
    } else {
      toast.info(
        `${product.name} removed from comparison`
      );
    }
  };

  useEffect(() => {
    setImg(0);
    setQty(1);
    setSize(product.sizes[0] ?? "");
    setColor(product.colors[0] ?? "");
    const ids = getRecent("dovan_viewed").filter((id) => id !== product.id);
    setRecent(
      ids
        .map((id) => all.find((x) => x.id === id))
        .filter(Boolean)
        .slice(0, 4) as Product[]
    );
    pushRecent("dovan_viewed", product.id);
    saveRecentViewedProduct(product);
  }, [product.id, all, product.sizes, product.colors]);

  const related = all
    .filter((x) => x.category_id === product.category_id && x.id !== product.id)
    .slice(0, 4);

  const add = async (buyNow = false) => {
    if ((product.sizes.length && !size) || (product.colors.length && !color)) {
      return toast.error("Please choose an option");
    }
    if (product.stock <= 0) {
      return toast.error("This product is out of stock");
    }
    if (qty > product.stock) {
      setQty(product.stock);
      return toast.error(`Cannot order more than available stock (${product.stock})`);
    }
    const ok = await addToCart({ product_id: product.id, size, color, quantity: qty }, product.stock);
    if (!ok) return;
    if (buyNow) void nav({ to: "/checkout" });
    else {
      toast.success("Added to cart");
      setCartOpen(true);
    }
  };

  const notifyMe = () => {
    toast.success(
      "We'll notify you as soon as this item is back in stock!"
    );
  };

  return (
    <div className="container-page py-4 sm:py-6 md:py-8">
      <nav className="mb-4 sm:mb-6 flex items-center gap-2 text-xs text-muted-foreground" aria-label="Breadcrumbs">
        <Link to="/" className="hover:underline">
          {t("home")}
        </Link>
        <span>/</span>
        <Link to="/shop" search={{ category: product.categories?.slug }} className="hover:underline">
          {product.categories?.name ? translateCategory(product.categories.name) : ""}
        </Link>
        <span>/</span>
        <span className="truncate text-foreground font-medium">{displayName}</span>
      </nav>

      <div className="grid gap-6 sm:gap-8 lg:gap-10 lg:grid-cols-[1.05fr_1fr] items-start">
        <div className="flex flex-col-reverse gap-3 sm:flex-row items-start lg:sticky lg:top-20 min-w-0">
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar sm:flex-col sm:overflow-y-auto sm:max-h-[540px] shrink-0 w-full sm:w-auto">
              {product.images.map((src, idx) => (
                <button
                  key={`${src}-${idx}`}
                  type="button"
                  onClick={() => setImg(idx)}
                  className={cn(
                    "relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-md border bg-muted transition",
                    img === idx && "ring-2 ring-foreground"
                  )}
                >
                  <img
                    src={src}
                    alt=""
                    onError={(e) => ((e.currentTarget as HTMLImageElement).src = FALLBACK_IMG)}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
          <ProductMainImage
            src={product.images[img] || FALLBACK_IMG}
            alt={displayName}
            off={off}
          />
        </div>

        <div className="lg:max-w-xl min-w-0">
          {product.brands?.name && <p className="eyebrow">{product.brands.name}</p>}
          <h1 className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-display font-medium text-foreground tracking-tight leading-tight">
            {displayName}
          </h1>
          <div className="mt-2.5 flex items-center gap-3">
            {product.rating_count > 0 && (
              <Stars value={Number(product.rating_avg)} count={product.rating_count} size={15} />
            )}
            {product.sku && !product.sku.includes("///") && (
              <span className="text-xs text-muted-foreground font-mono">SKU: {product.sku}</span>
            )}
          </div>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl sm:text-3xl font-semibold text-foreground">{formatPrice(product.price)}</span>
            {off > 0 && (
              <>
                <span className="text-base text-muted-foreground/70 line-through">
                  {formatPrice(product.compare_at_price)}
                </span>
                <span className="text-xs font-semibold text-sale bg-sale/10 px-2 py-0.5 rounded-full">
                  {`Save ${off}%`}
                </span>
              </>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {"VAT included / added at checkout"}
          </p>
          {product.description && !product.description.startsWith("///") && (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{product.description}</p>
          )}

          {product.colors.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {"Colour"}: <span className="font-semibold text-foreground normal-case tracking-normal">{color}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      "rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-all shadow-2xs",
                      c === color
                        ? "border-foreground bg-foreground text-background shadow-xs"
                        : "border-border/80 bg-card hover:border-foreground/50 text-foreground"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
          {product.sizes.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {"Size"}: <span className="font-semibold text-foreground normal-case tracking-normal">{size}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSize(sz)}
                    className={cn(
                      "min-w-10 rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-all shadow-2xs",
                      sz === size
                        ? "border-foreground bg-foreground text-background shadow-xs"
                        : "border-border/80 bg-card hover:border-foreground/50 text-foreground"
                    )}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 flex items-center gap-2 text-xs font-medium">
            <span
              className={cn(
                "h-2 w-2 rounded-full shrink-0",
                out ? "bg-destructive" : product.stock < 10 ? "bg-amber-500" : "bg-emerald-500"
              )}
            />
            {out ? (
              <span className="text-destructive font-semibold">{t("out_of_stock")}</span>
            ) : product.stock < 10 ? (
              <span className="text-amber-600 font-semibold">{`Only ${product.stock} left in stock`}</span>
            ) : (
              <span className="text-muted-foreground">{`In stock (${product.stock} available)`}</span>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {!out && (
              <QtyStepper
                value={qty}
                max={product.stock}
                onChange={(n) => setQty(Math.min(product.stock, Math.max(1, n)))}
              />
            )}
            {out ? (
              <Button size="default" variant="outline" className="flex-1 rounded-xl" onClick={notifyMe}>
                <Bell className="h-4 w-4 mr-2" />
                {"Notify me when available"}
              </Button>
            ) : (
              <>
                <Button size="default" className="flex-1 rounded-xl shadow-xs font-semibold" onClick={() => add()}>
                  {t("add_to_cart")}
                </Button>
                <Button size="default" variant="secondary" className="flex-1 rounded-xl font-semibold bg-muted/80 hover:bg-muted" onClick={() => add(true)}>
                  {t("buy_now")}
                </Button>
              </>
            )}
            <Button
              size="default"
              variant="outline"
              className="rounded-xl px-3"
              onClick={() => toggleWishlist(product.id)}
              aria-label="Toggle wishlist"
              title={"Save to wishlist"}
            >
              <Heart
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  wishlist.includes(product.id) && "fill-accent text-accent scale-110"
                )}
              />
            </Button>
            <Button
              size="default"
              variant="outline"
              className={cn("rounded-xl px-3", inCompare && "border-accent text-accent bg-accent/10")}
              onClick={handleCompare}
              aria-label="Compare product"
              title={inCompare ? "Remove from comparison" : "Add to comparison"}
            >
              <Layers className="h-4 w-4" />
            </Button>
          </div>

          <form
            className="mt-6 rounded-xl border border-border/70 bg-card/60 p-3.5 shadow-2xs"
            onSubmit={(e) => {
              e.preventDefault();
              const r = deliveryEstimate(district);
              if (!r) toast.error("Enter your district");
              setEta(r);
            }}
          >
            <label htmlFor="district" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-accent" />
              <span>Check Delivery</span>
            </label>
            <div className="mt-2 flex gap-2">
              <Input
                id="district"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder={"Your district, e.g. Kaski"}
                className="h-9 text-xs rounded-lg bg-background"
              />
              <Button type="submit" variant="outline" size="sm" className="h-9 px-3 rounded-lg text-xs font-medium">
                {"Check"}
              </Button>
            </div>
            {eta && (
              <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {`Delivers to ${district} in ${eta.days}${eta.express ? " · Express available" : ""}. Cash on delivery available.`}
              </p>
            )}
          </form>

          <Accordion type="multiple" className="mt-6" defaultValue={["specs"]}>
            <AccordionItem value="specs">
              <AccordionTrigger>{"Specifications"}</AccordionTrigger>
              <AccordionContent>
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                  {Object.entries(product.specs as Record<string, string>).map(([k, v]) => (
                    <Fragment key={k}>
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd>{v}</dd>
                    </Fragment>
                  ))}
                </dl>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="ship">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  {"Shipping"}
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {"Standard delivery Rs. 150 (free over Rs. 5,000), 3–6 days. Express Rs. 250, 1–2 days in major cities. "}
                <Link to="/policies/$page" params={{ page: "shipping" }} className="underline">
                  {"Shipping policy"}
                </Link>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="returns">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  {"Returns"}
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {"Return unused items within 7 days of delivery. "}
                <Link to="/policies/$page" params={{ page: "returns" }} className="underline">
                  {"Returns policy"}
                </Link>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* Customer reviews section */}
      <Reviews product={product} />

      {related.length > 0 && (
        <section className="mt-16 md:mt-24 pt-10 border-t">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Recommendations</p>
              <h2 className="mt-1 text-xl sm:text-2xl md:text-3xl font-display font-medium text-foreground">
                {"You may also like"}
              </h2>
            </div>
            <Link
              to="/shop"
              search={{ category: product.categories?.slug }}
              className="flex shrink-0 items-center gap-1 text-xs sm:text-sm font-medium hover:text-accent transition-colors"
            >
              {t("view_all")}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="flex gap-3 sm:gap-3.5 overflow-x-auto no-scrollbar scroll-smooth pb-2.5 pt-0.5">
            {related.map((x) => (
              <div key={x.id} className="w-[125px] xs:w-[135px] sm:w-[145px] md:w-[155px] shrink-0">
                <ProductCard p={x} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Reviews({ product }: { product: Product }) {
  const { user } = useShop();
  const { isNepali } = useI18n();
  const qc = useQueryClient();
  const { data: reviews = [] } = useQuery(reviewsQuery(product.id));
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const dist = [5, 4, 3, 2, 1].map((n) => ({
    n,
    c: reviews.filter((r) => r.rating === n).length,
  }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to write a review");
      return;
    }
    const cleanComment = body.trim();
    if (cleanComment.length < 10) {
      return toast.error("Please write at least 10 characters");
    }
    setBusy(true);

    try {
      // 1. Post via backend API (handles auth token, bypasses RLS, updates product rating)
      await api.post("/reviews", {
        product_id: product.id,
        rating,
        comment: cleanComment,
      });

      toast.success("Thanks for your review!");
      setBody("");
      setTitle("");
      void qc.invalidateQueries({ queryKey: ["reviews", product.id] });
      void qc.invalidateQueries({ queryKey: ["product"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
    } catch (apiErr: any) {
      console.warn("API /reviews error, attempting direct insertion fallback:", apiErr);
      // Fallback: direct Supabase insert if backend API is offline
      const { error: supaErr } = await supabase.from("reviews").insert({
        product_id: product.id,
        account_id: user.id,
        rating,
        review_text: cleanComment.slice(0, 2000),
        is_published: true,
      } as any);

      if (supaErr) {
        toast.error(apiErr?.message || supaErr?.message || "Could not post review");
      } else {
        toast.success("Thanks for your review!");
        setBody("");
        setTitle("");
        void qc.invalidateQueries({ queryKey: ["reviews", product.id] });
        void qc.invalidateQueries({ queryKey: ["product"] });
        void qc.invalidateQueries({ queryKey: ["products"] });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-14 md:mt-20 pt-8 border-t border-border/60" id="reviews">
      <div className="grid gap-8 lg:grid-cols-2 items-start">
        {/* Left sub-column: Aggregate rating summary & list of posted reviews */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg sm:text-xl font-display font-medium text-foreground">{"Customer Reviews"}</h2>
            <div className="mt-2.5 flex items-baseline gap-3">
              <span className="font-display text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
                {Number(product.rating_avg).toFixed(1)}
              </span>
              <div>
                <Stars value={Number(product.rating_avg)} size={15} />
                <p className="mt-0.5 text-xs text-muted-foreground font-medium">
                  {product.rating_count} {product.rating_count === 1 ? "review" : "reviews"}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {dist.map((d) => (
                <div key={d.n} className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                  <span className="w-3 text-right tabular-nums">{d.n}</span>
                  <div className="h-1.5 flex-1 rounded-full bg-muted/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-500"
                      style={{ width: `${reviews.length ? (d.c / reviews.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-4 text-right tabular-nums text-muted-foreground/70">{d.c}</span>
                </div>
              ))}
            </div>
          </div>

          {/* List of customer posted reviews */}
          <div className="border-t border-border/60 pt-4 divide-y divide-border/60">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-2">
              Reviews ({reviews.length})
            </h3>
            {reviews.length === 0 && (
              <p className="py-6 text-xs text-muted-foreground italic">
                {"No reviews yet. Be the first to share your thoughts!"}
              </p>
            )}
            {reviews.map((r) => (
              <div key={r.id} className="py-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Stars value={r.rating} size={13} />
                    <span className="text-xs font-semibold text-foreground">{r.author_name}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground/70">
                    {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                {r.title && <p className="text-xs font-semibold text-foreground pt-0.5">{r.title}</p>}
                <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">{r.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right sub-column: Write a review form */}
        <div className="lg:pl-6 lg:border-l lg:border-border/60">
          <h3 className="text-sm font-semibold text-foreground mb-3">Write a review</h3>
          {user ? (
            <form onSubmit={submit} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-muted border border-border/60 text-foreground font-semibold flex items-center justify-center text-[11px]">
                    {user.name ? user.name.slice(0, 1).toUpperCase() : "U"}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground leading-tight">{user.name || "You"}</p>
                    <p className="text-[11px] text-muted-foreground leading-tight">Reviews are public and show your profile</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRating(i)}
                      className="p-1 transition-transform hover:scale-110 focus:outline-hidden"
                      aria-label={`Rate ${i} star`}
                    >
                      <Star
                        className={cn(
                          "h-4 w-4 transition-colors",
                          i <= rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30 hover:text-amber-400"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Clean single-field review form without unnecessary title */}
              <div className="pt-1">
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Describe your experience with this item (quality, fit, delivery)..."
                  maxLength={2000}
                  rows={4}
                  className="w-full rounded-xl bg-muted/40 border border-border px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:bg-background focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-hidden resize-none transition-all leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                {(body || title) && (
                  <button
                    type="button"
                    onClick={() => {
                      setBody("");
                      setTitle("");
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground px-3 py-1 rounded-full transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <Button
                  size="sm"
                  disabled={busy || !body.trim()}
                  className="rounded-full px-5 text-xs font-medium shadow-none h-8"
                >
                  {busy ? "Posting…" : "Post"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="py-4 text-xs text-muted-foreground flex items-center gap-1.5 border-b border-border/60">
              <span>Have you purchased this item?</span>
              <Link to="/login" className="font-semibold text-foreground hover:underline">
                Sign in to leave a review
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ProductPageSkeleton() {
  return (
    <div className="container-page py-8 md:py-12">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-4">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-16 rounded-lg" />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="h-8 w-4/5 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>

          <div className="space-y-2 border-y py-4">
            <Skeleton className="h-8 w-36 rounded" />
            <Skeleton className="h-3.5 w-48 rounded" />
          </div>

          <div className="space-y-3">
            <Skeleton className="h-4 w-24 rounded" />
            <div className="flex gap-3">
              <Skeleton className="h-10 w-32 rounded-md" />
              <Skeleton className="h-10 flex-1 rounded-md" />
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 space-y-3">
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-3 w-52 rounded" />
          </div>

          <div className="space-y-3 pt-2">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
