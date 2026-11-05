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
    await context.queryClient.ensureQueryData(allProductsQuery);
    return { name: p.name, description: p.description, price: p.price };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
        { title: `${loaderData.name} — DOVAN` },
        { name: "description", content: loaderData.description.slice(0, 155) },
        { property: "og:title", content: `${loaderData.name} — DOVAN` },
        { property: "og:description", content: loaderData.description.slice(0, 155) },
        { property: "og:type", content: "product" },
      ]
      : [{ title: "Product unavailable — DOVAN" }, { name: "robots", content: "noindex" }],
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
  const rectRef = useRef<DOMRect | null>(null);

  const handleMouseEnter = () => {
    if (containerRef.current) {
      rectRef.current = containerRef.current.getBoundingClientRect();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rectRef.current && containerRef.current) {
      rectRef.current = containerRef.current.getBoundingClientRect();
    }
    const r = rectRef.current;
    if (!r || !imgRef.current) return;
    const x = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100));
    imgRef.current.style.transformOrigin = `${x}% ${y}%`;
    imgRef.current.style.transform = "scale(1.8)";
  };

  const handleMouseLeave = () => {
    rectRef.current = null;
    if (imgRef.current) {
      imgRef.current.style.transform = "scale(1)";
      imgRef.current.style.transformOrigin = "center center";
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative flex-1 cursor-zoom-in overflow-hidden rounded-md bg-muted select-none"
    >
      <img
        ref={imgRef}
        src={src || FALLBACK_IMG}
        alt={alt}
        width={800}
        height={1000}
        loading="eager"
        decoding="async"
        onError={(e) => ((e.currentTarget as HTMLImageElement).src = FALLBACK_IMG)}
        className="aspect-[4/5] w-full object-cover transition-transform duration-100 ease-out will-change-transform"
      />
      {off > 0 && (
        <span className="pointer-events-none absolute left-3 top-3 rounded-sm bg-sale px-2 py-1 text-xs font-semibold text-accent-foreground shadow-xs">
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
  const displayName = translateProduct(product.name);
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
    <div className="container-page py-6 md:py-10">
      <nav className="mb-6 flex items-center gap-2 text-xs text-muted-foreground" aria-label="Breadcrumbs">
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

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          {product.images.length > 1 && (
            <div className="flex gap-2 sm:flex-col">
              {product.images.map((src, idx) => (
                <button
                  key={src}
                  onClick={() => setImg(idx)}
                  className={cn(
                    "relative h-20 w-16 overflow-hidden rounded border bg-muted transition",
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

        <div>
          <p className="eyebrow">{product.brands?.name}</p>
          <h1 className="mt-2 text-4xl md:text-5xl font-display">{displayName}</h1>
          <div className="mt-3 flex items-center gap-3">
            {product.rating_count > 0 && (
              <Stars value={Number(product.rating_avg)} count={product.rating_count} size={16} />
            )}
            <span className="text-xs text-muted-foreground font-mono">SKU: {product.sku}</span>
          </div>
          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-semibold">{formatPrice(product.price)}</span>
            {off > 0 && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.compare_at_price)}
                </span>
                <span className="text-sm font-semibold text-sale">
                  {`Save ${off}%`}
                </span>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {"VAT added at checkout"}
          </p>
          <p className="mt-5 leading-relaxed text-muted-foreground">{product.description}</p>

          {product.colors.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm">
                {"Colour"}: <b>{color}</b>
              </p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      "rounded-md border px-4 py-2 text-sm transition-colors",
                      c === color
                        ? "border-foreground bg-foreground text-background"
                        : "hover:border-foreground"
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
              <p className="mb-2 text-sm">
                {"Size"}: <b>{size}</b>
              </p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSize(sz)}
                    className={cn(
                      "min-w-12 rounded-md border px-3 py-2 text-sm transition-colors",
                      sz === size
                        ? "border-foreground bg-foreground text-background"
                        : "hover:border-foreground"
                    )}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="mt-6 text-sm">
            {out ? (
              <span className="font-medium text-destructive">{t("out_of_stock")}</span>
            ) : product.stock < 10 ? (
              <span className="font-medium text-sale">
                {`Only ${product.stock} left`}
              </span>
            ) : (
              <span className="text-success">
                {`In stock (${product.stock} available)`}
              </span>
            )}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {!out && (
              <QtyStepper
                value={qty}
                max={product.stock}
                onChange={(n) => setQty(Math.max(1, n))}
              />
            )}
            {out ? (
              <Button size="lg" variant="outline" className="flex-1" onClick={notifyMe}>
                <Bell className="h-4 w-4 mr-2" />
                {"Notify me when available"}
              </Button>
            ) : (
              <>
                <Button size="lg" className="flex-1" onClick={() => add()}>
                  {t("add_to_cart")}
                </Button>
                <Button size="lg" variant="secondary" className="flex-1" onClick={() => add(true)}>
                  {t("buy_now")}
                </Button>
              </>
            )}
            <Button
              size="lg"
              variant="outline"
              onClick={() => toggleWishlist(product.id)}
              aria-label="Toggle wishlist"
              title={"Save to wishlist"}
            >
              <Heart
                className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  wishlist.includes(product.id) && "fill-accent text-accent scale-110"
                )}
              />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleCompare}
              aria-label="Compare product"
              title={inCompare ? "Remove from comparison" : "Add to comparison"}
              className={cn(inCompare && "border-accent text-accent bg-accent/10")}
            >
              <Layers className="h-5 w-5" />
            </Button>
          </div>

          <form
            className="mt-6 rounded-md border bg-card p-4"
            onSubmit={(e) => {
              e.preventDefault();
              const r = deliveryEstimate(district);
              if (!r) toast.error("Enter your district");
              setEta(r);
            }}
          >
            <label htmlFor="district" className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4" />
              {"Check delivery"}
            </label>
            <div className="mt-2 flex gap-2">
              <Input
                id="district"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder={"Your district, e.g. Kaski"}
              />
              <Button type="submit" variant="outline">
                {"Check"}
              </Button>
            </div>
            {eta && (
              <p className="mt-2 text-sm text-success">
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

      <Reviews product={product} />

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 text-3xl font-display">
            {"You may also like"}
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {related.map((x) => (
              <ProductCard key={x.id} p={x} />
            ))}
          </div>
        </section>
      )}
      {recent.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 text-3xl font-display">{t("recently_viewed")}</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {recent.map((x) => (
              <ProductCard key={x.id} p={x} />
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
    <section className="mt-20 grid gap-10 md:grid-cols-[280px_1fr]" id="reviews">
      <div>
        <h2 className="text-3xl font-display">{"Reviews"}</h2>
        <div className="mt-4 flex items-center gap-3">
          <span className="font-display text-5xl">{Number(product.rating_avg).toFixed(1)}</span>
          <div>
            <Stars value={Number(product.rating_avg)} />
            <p className="text-xs text-muted-foreground">
              {product.rating_count} {"reviews"}
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-1">
          {dist.map((d) => (
            <div key={d.n} className="flex items-center gap-2 text-xs">
              <span className="w-3">{d.n}</span>
              <div className="h-1.5 flex-1 rounded bg-muted">
                <div
                  className="h-full rounded bg-accent"
                  style={{ width: `${reviews.length ? (d.c / reviews.length) * 100 : 0}%` }}
                />
              </div>
              <span className="w-4 text-right">{d.c}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        {user ? (
          <form onSubmit={submit} className="rounded-md border bg-card p-5">
            <p className="font-semibold">{"Write a review"}</p>
            <div className="mt-3 flex items-center gap-1">
              <span className="mr-1 text-sm text-muted-foreground">
                {"Rating:"}
              </span>
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} type="button" onClick={() => setRating(i)} className="p-0.5">
                  <Star
                    className={cn(
                      "h-5 w-5",
                      i <= rating ? "fill-accent text-accent" : "text-border"
                    )}
                  />
                </button>
              ))}
            </div>
            <Input
              className="mt-3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={"Title (optional)"}
              maxLength={120}
            />
            <Textarea
              className="mt-2"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={"What did you think?"}
              maxLength={2000}
            />
            <Button className="mt-3" disabled={busy}>
              {"Post review"}
            </Button>
          </form>
        ) : (
          <p className="rounded-md border bg-card p-5 text-sm">
            <Link to="/login" className="font-medium underline">
              {"Sign in"}
            </Link>{" "}
            {"to write a review."}
          </p>
        )}
        <ul className="mt-6 divide-y">
          {reviews.length === 0 && (
            <li className="py-6 text-sm text-muted-foreground">
              {"No reviews yet. Be the first!"}
            </li>
          )}
          {reviews.map((r) => (
            <li key={r.id} className="py-5">
              <div className="flex items-center justify-between">
                <Stars value={r.rating} />
                <span className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString("en-GB")}
                </span>
              </div>
              {r.title && <p className="mt-2 font-medium">{r.title}</p>}
              <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
              <p className="mt-2 text-xs text-muted-foreground">— {r.author_name}</p>
            </li>
          ))}
        </ul>
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
