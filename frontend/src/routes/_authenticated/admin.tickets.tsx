import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Mail,
  Phone,
  ExternalLink,
  Paperclip,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Inbox,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { api } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/tickets")({
  component: Tickets,
  pendingComponent: TicketsSkeleton,
});

const STATUS_OPTIONS = [
  { value: "Open", label: "Open", color: "text-amber-800 bg-amber-500/15 border-amber-500/30" },
  { value: "In Progress", label: "In Progress", color: "text-blue-800 bg-blue-500/15 border-blue-500/30" },
  { value: "Resolved", label: "Resolved", color: "text-emerald-800 bg-emerald-500/15 border-emerald-500/30" },
  { value: "Closed", label: "Closed", color: "text-foreground/70 bg-muted/80 border-border" },
];

function getStatusBadge(status: string) {
  const s = (status || "").toLowerCase();
  if (s.includes("resolve")) return "bg-emerald-500/15 text-emerald-800 border-emerald-500/30";
  if (s.includes("progress")) return "bg-blue-500/15 text-blue-800 border-blue-500/30";
  if (s.includes("closed")) return "bg-muted text-foreground/70 border-border";
  return "bg-amber-500/15 text-amber-800 border-amber-500/30";
}

export function TicketsSkeleton() {
  return (
    <div className="space-y-6 pb-12">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48 rounded" />
          <Skeleton className="h-4 w-72 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-64 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
        </div>
      </div>

      {/* KPI pillars skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-border/70">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-20 rounded" />
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
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="py-4 px-2 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-5 w-20 rounded" />
                <Skeleton className="h-5 w-48 rounded" />
              </div>
              <Skeleton className="h-8 w-32 rounded-md" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-3.5 w-32 rounded" />
              <Skeleton className="h-3.5 w-44 rounded" />
              <Skeleton className="h-3.5 w-28 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Tickets() {
  const qc = useQueryClient();
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: list = [], isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["admin", "tickets"],
    queryFn: async () => {
      let tickets: any[] = [];
      try {
        const res = await api.get<{ tickets: any[] }>("/tickets");
        if (res?.tickets && res.tickets.length > 0) {
          tickets = res.tickets;
        }
      } catch (err: any) {
        console.warn("API /tickets endpoint note:", err?.message);
      }

      // Supabase direct fallback if API returns empty
      if (tickets.length === 0) {
        try {
          const { data } = await supabase
            .from("ticket")
            .select("*")
            .order("created_at", { ascending: false });
          if (data && data.length > 0) {
            tickets = data;
          }
        } catch {}
      }

      return tickets.map((t: any) => {
        const isCallback =
          t.message?.toLowerCase().includes("callback") || t.subject?.toLowerCase().includes("callback");
        const phoneMatch = t.message?.match(/(\+?\d[\d -]{7,15}\d)/)?.[0];
        return {
          ...t,
          customer_name:
            t.customer_name ||
            (isCallback ? "Callback Request" : t.account_id ? "Customer" : "Guest Visitor"),
          customer_email: t.customer_email || t.email || "",
          customer_phone: t.customer_phone || (isCallback && phoneMatch ? phoneMatch : t.phone || ""),
          status: t.status || "Open",
        };
      });
    },
  });

  const setStatus = async (id: string, status: string) => {
    try {
      await api.patch("/tickets", { id, status });
      toast.success(`Ticket status updated to ${status}`);
      void qc.invalidateQueries({ queryKey: ["admin", "tickets"] });
    } catch {
      try {
        await supabase.from("ticket").update({ status } as any).eq("id", id);
        toast.success(`Ticket status updated to ${status}`);
        void qc.invalidateQueries({ queryKey: ["admin", "tickets"] });
      } catch (err: any) {
        toast.error(err?.message || "Failed to update ticket status");
      }
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Reference copied to clipboard");
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = list.length;
    const openCount = list.filter((t) => (t.status || "open").toLowerCase() === "open").length;
    const inProgressCount = list.filter((t) => (t.status || "").toLowerCase() === "in progress").length;
    const resolvedCount = list.filter((t) => ["resolved", "closed"].includes((t.status || "").toLowerCase())).length;
    return { total, openCount, inProgressCount, resolvedCount };
  }, [list]);

  // Filters
  const filteredList = useMemo(() => {
    return list.filter((t) => {
      // Status filter
      if (filter !== "all") {
        if (filter === "resolved_closed") {
          if (!["resolved", "closed"].includes((t.status || "").toLowerCase())) return false;
        } else if ((t.status || "").toLowerCase() !== filter.toLowerCase()) {
          return false;
        }
      }

      // Search query
      if (query.trim()) {
        const q = query.toLowerCase();
        const refCode = (t.ticket_number || t.id || "").toLowerCase();
        const subject = (t.subject || "").toLowerCase();
        const name = (t.customer_name || "").toLowerCase();
        const email = (t.customer_email || "").toLowerCase();
        const phone = (t.customer_phone || "").toLowerCase();
        const msg = (t.message || "").toLowerCase();
        return (
          refCode.includes(q) ||
          subject.includes(q) ||
          name.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          msg.includes(q)
        );
      }
      return true;
    });
  }, [list, filter, query]);

  const filterTabs = [
    { id: "all", label: "All Tickets", count: metrics.total },
    { id: "Open", label: "Open", count: metrics.openCount, accent: "text-amber-800" },
    { id: "In Progress", label: "In Progress", count: metrics.inProgressCount, accent: "text-blue-800" },
    { id: "Resolved", label: "Resolved", count: list.filter((t) => (t.status || "").toLowerCase() === "resolved").length },
    { id: "Closed", label: "Closed", count: list.filter((t) => (t.status || "").toLowerCase() === "closed").length },
  ];

  if (isLoading) {
    return <TicketsSkeleton />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ── Header & Search ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Support Tickets</h1>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground/80">
              {metrics.total}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-foreground/75">
            Resolve customer inquiries, returns, and callback requests across all 77 districts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-foreground/60" />
            <Input
              placeholder="Search tickets, IDs, names..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 pl-8 pr-3 text-xs bg-background"
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
          <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/70">Total Tickets</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{metrics.total}</p>
          <p className="text-[11px] text-foreground/65">All received cases</p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
            Open (Action Needed)
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-800">{metrics.openCount}</p>
          <p className="text-[11px] text-foreground/65">Requires agent triage</p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-800">In Progress</p>
          <p className="mt-1 text-2xl font-bold text-blue-800">{metrics.inProgressCount}</p>
          <p className="text-[11px] text-foreground/65">Under active investigation</p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">Resolved / Closed</p>
          <p className="mt-1 text-2xl font-bold text-emerald-800">{metrics.resolvedCount}</p>
          <p className="text-[11px] text-foreground/65">Completed support cases</p>
        </div>
      </div>

      {/* ── Fast Segmented Status Filter Tabs ────────────────────────────── */}
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

      {/* ── Flush Edge-to-Edge List (Zero Box Cards) ─────────────────────── */}
      {filteredList.length === 0 ? (
        <div className="border-y border-border/80 py-12 text-center">
          <Inbox className="mx-auto h-8 w-8 text-foreground/40 mb-2" />
          <p className="text-sm font-medium text-foreground">No support tickets found</p>
          <p className="text-xs text-foreground/60 mt-0.5">
            {query ? "Try adjusting your search query." : "All customer inquiries have been addressed."}
          </p>
        </div>
      ) : (
        <div className="divide-y border-y border-border/80">
          {filteredList.map((t: any) => {
            const rawRef = t.ticket_number || t.id.slice(0, 8);
            const refCode = rawRef.toUpperCase();
            const email = t.customer_email || t.email;
            const phone = t.customer_phone || t.phone;
            const name = t.customer_name || t.name || (t.account_id ? "Customer" : "Guest Visitor");
            const isOpen = open === t.id;

            return (
              <div
                key={t.id}
                className={cn(
                  "transition-colors",
                  isOpen ? "bg-muted/30" : "hover:bg-muted/20"
                )}
              >
                {/* Main ticket summary strip */}
                <div className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div
                    className="flex-1 cursor-pointer select-none"
                    onClick={() => setOpen(isOpen ? null : t.id)}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(refCode, t.id);
                        }}
                        className="inline-flex items-center gap-1 font-mono text-xs font-bold text-foreground hover:text-primary transition"
                        title="Click to copy ticket code"
                      >
                        <span>#{refCode}</span>
                        {copiedId === t.id ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-3 w-3 text-foreground/40 hover:text-foreground" />
                        )}
                      </button>

                      <span
                        className={cn(
                          "inline-flex items-center rounded-sm border px-1.5 py-0.2 text-[10px] font-semibold uppercase tracking-wider",
                          getStatusBadge(t.status)
                        )}
                      >
                        {t.status || "Open"}
                      </span>

                      <h3 className="font-semibold text-sm text-foreground hover:underline">
                        {t.subject || "No Subject"}
                      </h3>
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground/70">
                      <span className="font-medium text-foreground">{name}</span>
                      {email && (
                        <span className="inline-flex items-center gap-1 text-foreground/75">
                          <Mail className="h-3 w-3 text-foreground/50" />
                          {email}
                        </span>
                      )}
                      {phone && (
                        <span className="inline-flex items-center gap-1 text-foreground/75">
                          <Phone className="h-3 w-3 text-foreground/50" />
                          {phone}
                        </span>
                      )}
                      <span className="text-foreground/50">
                        {new Date(t.created_at).toLocaleString([], {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Actions & Status Control */}
                  <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                    <Select
                      value={t.status || "Open"}
                      onValueChange={(val) => setStatus(t.id, val)}
                    >
                      <SelectTrigger className="w-32 h-8 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setOpen(isOpen ? null : t.id)}
                      className="h-8 w-8 p-0 cursor-pointer text-foreground/70 hover:text-foreground"
                      title={isOpen ? "Collapse" : "Expand details"}
                    >
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Collapsible Inquiry Details Drawer */}
                {isOpen && (
                  <div className="px-3.5 sm:px-4 pb-4 pt-1 space-y-3.5 border-t border-border/50">
                    <div className="rounded-md bg-muted/40 p-3.5 text-xs sm:text-sm text-foreground whitespace-pre-wrap leading-relaxed border border-border/50">
                      {t.message || <span className="italic text-foreground/50">No message body provided.</span>}
                    </div>

                    {/* Attachments */}
                    {Array.isArray(t.attachments) && t.attachments.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-foreground/80 flex items-center gap-1">
                          <Paperclip className="h-3.5 w-3.5" /> Attachments ({t.attachments.length}):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {t.attachments.map((att: any, idx: number) => {
                            const url = typeof att === "string" ? att : att.url || att.file_name;
                            return (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition"
                              >
                                <Paperclip className="h-3 w-3 text-foreground/60" />
                                Attachment {idx + 1}
                                <ExternalLink className="h-3 w-3 text-foreground/50" />
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Quick Contact Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {email && (
                        <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                          <a href={`mailto:${email}?subject=Re: [DOVAN Support] #${refCode} - ${encodeURIComponent(t.subject || "")}`}>
                            <Mail className="h-3.5 w-3.5" /> Reply to {email}
                          </a>
                        </Button>
                      )}
                      {phone && (
                        <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                          <a href={`tel:${phone.replace(/\s+/g, "")}`}>
                            <Phone className="h-3.5 w-3.5" /> Call {phone}
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
