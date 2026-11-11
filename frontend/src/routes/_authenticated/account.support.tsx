import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Paperclip, ExternalLink, LifeBuoy, ChevronDown, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { useShop } from "@/lib/shop";
import { statusLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/account/support")({ component: Tickets });

function Tickets() {
  const { user } = useShop();
  const [open, setOpen] = useState<string | null>(null);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["me", "tickets", user?.id],
    enabled: !!user,
    queryFn: async () => {
      try {
        const res = await api.get<{ tickets: any[] }>("/tickets");
        return res?.tickets ?? [];
      } catch (err: any) {
        console.warn("Notice fetching user tickets:", err?.message);
        return [];
      }
    },
  });

  const getStatusColor = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s.includes("resolved")) return "bg-emerald-500/10 text-emerald-700";
    if (s.includes("progress")) return "bg-blue-500/10 text-blue-700";
    if (s.includes("closed")) return "bg-muted text-muted-foreground";
    return "bg-amber-500/10 text-amber-700";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60 gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-foreground">
            Support Tickets
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            View inquiry status and replies from customer support.
          </p>
        </div>
        <Button size="sm" asChild className="h-8 px-3 text-xs font-medium">
          <Link to="/support">
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span>New Ticket</span>
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div className="rounded-xl border border-border/70 bg-card divide-y divide-border/60">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-3">
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-3.5 w-48 rounded" />
              </div>
              <Skeleton className="h-5 w-16 rounded" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && tickets.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/70 p-8 text-center bg-muted/10 space-y-3">
          <LifeBuoy className="h-7 w-7 text-muted-foreground/50 mx-auto" />
          <div>
            <p className="text-sm font-medium text-foreground">No support tickets</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Need assistance with an order or product? Submit a ticket anytime.
            </p>
          </div>
          <Button size="sm" asChild className="h-8 text-xs">
            <Link to="/support">Create a ticket</Link>
          </Button>
        </div>
      )}

      {!isLoading && tickets.length > 0 && (
        <div className="rounded-xl border border-border/70 bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
          {tickets.map((t: any) => {
            const refCode = (t.ticket_number || t.id.slice(0, 8)).toUpperCase();
            const isOpen = open === t.id;

            return (
              <div key={t.id} className="transition-colors">
                <button
                  type="button"
                  className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-muted/30 transition cursor-pointer"
                  onClick={() => setOpen(isOpen ? null : t.id)}
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-medium text-muted-foreground">
                        #{refCode}
                      </span>
                      <h3 className="text-xs sm:text-sm font-medium text-foreground truncate">
                        {t.subject}
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Submitted on {new Date(t.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 text-[11px] font-medium",
                        getStatusColor(t.status)
                      )}
                    >
                      {statusLabel(t.status)}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform duration-200",
                        isOpen && "rotate-180"
                      )}
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border/40 bg-muted/15 text-xs">
                    <div className="p-3 rounded-lg bg-background border border-border/60 text-foreground/90 whitespace-pre-wrap leading-relaxed">
                      {t.message}
                    </div>

                    {Array.isArray(t.attachments) && t.attachments.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="font-medium text-muted-foreground flex items-center gap-1">
                          <Paperclip className="h-3.5 w-3.5" />
                          <span>Attachments ({t.attachments.length})</span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {t.attachments.map((att: any, idx: number) => {
                            const url = typeof att === "string" ? att : (att.url || att.file_name);
                            return (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border/60 bg-background hover:bg-muted/50 text-foreground transition text-xs"
                              >
                                <span>File {idx + 1}</span>
                                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <p className="text-[11px] text-muted-foreground">
                      Our customer care team replies directly to your registered email address. You may also reply to the notification email to send updates.
                    </p>
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
