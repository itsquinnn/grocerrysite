import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Stars } from "@/components/site/Stars";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Star,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  Trash2,
  ExternalLink,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/reviews")({
  component: Reviews,
  pendingComponent: ReviewsSkeleton,
});

export function ReviewsSkeleton() {
  return (
    <div className="space-y-6 pb-12">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48 rounded" />
          <Skeleton className="h-4 w-72 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-60 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
        </div>
      </div>

      {/* KPI pillars skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-border/70">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-7 w-16 rounded" />
            <Skeleton className="h-3 w-28 rounded" />
          </div>
        ))}
      </div>

      {/* Filter pills skeleton */}
      <div className="flex items-center gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-lg" />
        ))}
      </div>

      {/* List rows skeleton */}
      <div className="divide-y border-y border-border/70">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="py-4 px-2 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-4 w-40 rounded" />
              </div>
              <Skeleton className="h-7 w-20 rounded" />
            </div>
            <Skeleton className="h-4 w-full max-w-xl rounded" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-3 w-32 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Reviews() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  const {
    data: list = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["admin", "reviews"],
    queryFn: async () => {
      try {
        let { data, error } = await supabase
          .from("reviews")
          .select("*, products(id, title, slug, images, image_url), accounts(name, email)")
          .order("created_at", { ascending: false });

        if (error) {
          const res = await supabase
            .from("reviews")
            .select("*, products(title, slug)")
            .order("created_at", { ascending: false });
          data = res.data;
        }

        return (data ?? []).map((r: any) => {
          const prodTitle = r.products?.title ?? r.products?.name ?? "DOVAN Product";
          const prodSlug = r.products?.slug ?? r.product_id;
          const prodImg =
            Array.isArray(r.products?.images) && r.products?.images[0]
              ? r.products.images[0]
              : r.products?.image_url;

          return {
            ...r,
            rating: typeof r.rating === "number" ? r.rating : 5,
            is_approved: r.is_approved ?? r.is_published ?? true,
            body: r.review_text ?? r.comment ?? r.body ?? "",
            author_name: r.author_name ?? r.accounts?.name ?? "Customer",
            author_email: r.author_email ?? r.accounts?.email ?? "",
            product_title: prodTitle,
            product_slug: prodSlug,
            product_image: prodImg,
          };
        });
      } catch (e) {
        console.warn("Reviews load exception:", e);
        return [];
      }
    },
  });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
    void qc.invalidateQueries({ queryKey: ["reviews"] });
    void qc.invalidateQueries({ queryKey: ["admin"] });
  };

  const setApproved = async (id: string, v: boolean) => {
    try {
      let { error } = await supabase.from("reviews").update({ is_published: v } as any).eq("id", id);
      if (error) {
        await supabase.from("reviews").update({ is_approved: v } as any).eq("id", id);
      }
      toast.success(v ? "Review approved and published" : "Review hidden from storefront");
      refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update review status");
    }
  };

  const del = async (id: string) => {
    try {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
      toast.success("Review permanently deleted");
      refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete review");
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = list.length;
    const avg =
      total > 0 ? (list.reduce((acc, r) => acc + (r.rating || 5), 0) / total).toFixed(1) : "0.0";
    const pendingCount = list.filter((r) => !r.is_approved).length;
    const fiveStarCount = list.filter((r) => r.rating >= 5).length;
    const fourStarCount = list.filter((r) => r.rating === 4).length;
    const criticalCount = list.filter((r) => r.rating < 4).length;
    return { total, avg, pendingCount, fiveStarCount, fourStarCount, criticalCount };
  }, [list]);

  // Filters
  const filteredList = useMemo(() => {
    return list.filter((r) => {
      if (filter === "pending" && r.is_approved) return false;
      if (filter === "published" && !r.is_approved) return false;
      if (filter === "5_star" && r.rating < 5) return false;
      if (filter === "4_star" && r.rating !== 4) return false;
      if (filter === "critical" && r.rating >= 4) return false;

      if (!q.trim()) return true;
      const term = q.toLowerCase();
      const author = (r.author_name || "").toLowerCase();
      const email = (r.author_email || "").toLowerCase();
      const prod = (r.product_title || "").toLowerCase();
      const body = (r.body || "").toLowerCase();
      return author.includes(term) || email.includes(term) || prod.includes(term) || body.includes(term);
    });
  }, [list, filter, q]);

  const filterTabs = [
    { id: "all", label: "All Reviews", count: metrics.total },
    {
      id: "pending",
      label: "Pending / Hidden",
      count: metrics.pendingCount,
      accent: metrics.pendingCount > 0 ? "text-amber-800" : undefined,
    },
    { id: "published", label: "Published", count: metrics.total - metrics.pendingCount },
    { id: "5_star", label: "5 Stars", count: metrics.fiveStarCount },
    { id: "critical", label: "Critical (≤3★)", count: metrics.criticalCount, accent: "text-rose-800" },
  ];

  if (isLoading) {
    return <ReviewsSkeleton />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ── Header & Action Controls ─────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Review Moderation
            </h1>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground/80">
              {metrics.total}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-foreground/75">
            Audit customer feedback, maintain product reputation, and publish genuine reviews.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-foreground/60" />
            <Input
              className="h-9 pl-8 pr-3 text-xs bg-background"
              placeholder="Search reviewer, product, text..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isRefetching}
            className="h-9 gap-1.5 text-xs shrink-0 cursor-pointer text-foreground font-medium"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefetching && "animate-spin")} />
            <span className="hidden sm:inline">Sync</span>
          </Button>
        </div>
      </div>

      {/* ── Borderless Data Pillars (Non-vibe-coded Metrics) ─────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3 border-y border-border/80">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/70">Total Reviews</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{metrics.total}</p>
          <p className="text-[11px] text-foreground/65">Across all products</p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/70">Average Rating</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-foreground">{metrics.avg}</span>
            <span className="text-sm font-semibold text-amber-500">★</span>
            <span className="text-xs text-foreground/60">/ 5.0</span>
          </div>
          <p className="text-[11px] text-foreground/65">Store satisfaction score</p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
            Pending / Hidden
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-800">{metrics.pendingCount}</p>
          <p className="text-[11px] text-foreground/65">Awaiting moderation</p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">5-Star Reviews</p>
          <p className="mt-1 text-2xl font-bold text-emerald-800">{metrics.fiveStarCount}</p>
          <p className="text-[11px] text-foreground/65">Top customer sentiment</p>
        </div>
      </div>

      {/* ── Fast Segmented Filter Tabs ───────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {filterTabs.map((tab) => {
          const isActive = filter.toLowerCase() === tab.id.toLowerCase();
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition shrink-0 cursor-pointer border",
                isActive
                  ? "bg-foreground text-background border-foreground shadow-2xs font-bold"
                  : "bg-card text-foreground/75 border-border/80 hover:text-foreground hover:bg-muted/50"
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                  isActive ? "bg-background/20 text-background" : "bg-muted text-foreground/80"
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Flush Edge-to-Edge Reviews List (No boxy cards) ──────────────── */}
      {filteredList.length === 0 ? (
        <div className="border-y border-border/80 py-12 text-center">
          <MessageSquare className="mx-auto h-8 w-8 text-foreground/40 mb-2" />
          <p className="text-sm font-medium text-foreground">No customer reviews found</p>
          <p className="text-xs text-foreground/60 mt-0.5">
            {q ? "Try adjusting your search query." : "No reviews match the selected filter."}
          </p>
        </div>
      ) : (
        <div className="divide-y border-y border-border/80">
          {filteredList.map((r: any) => {
            const formattedDate = r.created_at
              ? new Date(r.created_at).toLocaleDateString([], {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "Recent";

            return (
              <div key={r.id} className="p-4 hover:bg-muted/20 transition-colors">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    {/* Header: Stars + Product Link + Status Badge */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded border border-border/60">
                        <Stars value={r.rating} size={13} />
                        <span className="text-xs font-bold text-foreground ml-1">
                          {Number(r.rating).toFixed(1)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-foreground/50">on</span>
                        <Link
                          to={`/product/${r.product_slug}` as any}
                          className="font-semibold text-foreground hover:underline inline-flex items-center gap-1"
                        >
                          {r.product_title}
                          <ExternalLink className="h-3 w-3 text-foreground/50" />
                        </Link>
                      </div>

                      <span
                        className={cn(
                          "inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                          r.is_approved
                            ? "bg-emerald-500/15 text-emerald-800 border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-800 border-amber-500/30"
                        )}
                      >
                        {r.is_approved ? "Published" : "Hidden"}
                      </span>
                    </div>

                    {/* Review Body */}
                    <p className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {r.body || <span className="italic text-foreground/50">No written comment provided.</span>}
                    </p>

                    {/* Reviewer signature */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground/70">
                      <span className="font-medium text-foreground">
                        {r.author_name}
                      </span>
                      {r.author_email && (
                        <span className="text-foreground/50">({r.author_email})</span>
                      )}
                      <span className="text-foreground/50">• {formattedDate}</span>
                    </div>
                  </div>

                  {/* Action Controls */}
                  <div className="flex items-center gap-2 self-start shrink-0 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setApproved(r.id, !r.is_approved)}
                      className={cn(
                        "h-8 text-xs font-semibold gap-1.5 cursor-pointer",
                        !r.is_approved && "bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white border-emerald-600"
                      )}
                    >
                      {r.is_approved ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5" />
                          Approve
                        </>
                      )}
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogTitle>Delete this customer review?</AlertDialogTitle>
                        <p className="text-xs text-foreground/70">
                          This action cannot be undone. The review and rating score will be permanently removed.
                        </p>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => del(r.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
