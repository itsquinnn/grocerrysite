import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, Phone, ExternalLink, Paperclip } from "lucide-react";
import { api } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { statusLabel } from "@/lib/format";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/tickets")({ component: Tickets });

const STATUS_OPTIONS = [
  { value: "Open", label: "Open", color: "text-amber-600 bg-amber-500/10" },
  { value: "In Progress", label: "In Progress", color: "text-blue-600 bg-blue-500/10" },
  { value: "Resolved", label: "Resolved", color: "text-emerald-600 bg-emerald-500/10" },
  { value: "Closed", label: "Closed", color: "text-muted-foreground bg-muted" },
];

function Tickets() {
  const qc = useQueryClient();
  const [open, setOpen] = useState<string | null>(null);

  const { data: list = [], isLoading } = useQuery({
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
        const isCallback = t.message?.toLowerCase().includes("callback") || t.subject?.toLowerCase().includes("callback");
        const phoneMatch = t.message?.match(/(\+?\d[\d -]{7,15}\d)/)?.[0];
        return {
          ...t,
          customer_name: t.customer_name || (isCallback ? "Callback Request" : (t.account_id ? "Customer" : "Guest Visitor")),
          customer_email: t.customer_email || t.email || "",
          customer_phone: t.customer_phone || (isCallback && phoneMatch ? phoneMatch : (t.phone || "")),
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Support tickets</h2>
        <p className="text-sm text-muted-foreground">Manage and resolve customer inquiries from all 77 districts</p>
      </div>

      {isLoading && (
        <div className="py-8 text-center text-sm text-muted-foreground">Loading support tickets...</div>
      )}

      {!isLoading && list.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          No support tickets found.
        </div>
      )}

      <ul className="space-y-3">
        {list.map((t: any) => {
          const refCode = (t.ticket_number || t.id.slice(0, 8)).toUpperCase();
          const email = t.customer_email || t.email;
          const phone = t.customer_phone || t.phone;
          const name = t.customer_name || t.name || (t.account_id ? "Customer" : "Guest Visitor");

          return (
            <li key={t.id} className="rounded-lg border bg-card p-4 text-sm shadow-sm transition hover:border-foreground/20">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  className="flex-1 text-left"
                  onClick={() => setOpen(open === t.id ? null : t.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-primary">#{refCode}</span>
                    <span className="font-medium text-foreground">{t.subject}</span>
                  </div>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {name} {email ? `• ${email}` : ""} {phone ? `• ${phone}` : ""} • {new Date(t.created_at).toLocaleString()}
                  </span>
                </button>

                <div className="flex items-center gap-2">
                  <Select
                    value={t.status || "Open"}
                    onValueChange={(val) => setStatus(t.id, val)}
                  >
                    <SelectTrigger className="w-36 h-9 text-xs">
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
                </div>
              </div>

              {open === t.id && (
                <div className="mt-4 border-t pt-4 space-y-3">
                  <div className="rounded-md bg-muted/50 p-3 text-sm text-foreground whitespace-pre-wrap leading-relaxed font-sans">
                    {t.message}
                  </div>

                  {Array.isArray(t.attachments) && t.attachments.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Paperclip className="h-3.5 w-3.5" /> Attachments:
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
                              className="inline-flex items-center gap-1 text-xs text-primary underline hover:text-primary/80"
                            >
                              Attachment {idx + 1} <ExternalLink className="h-3 w-3" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {email && (
                      <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs">
                        <a href={`mailto:${email}?subject=Re: [DOVAN Support] ${encodeURIComponent(t.subject)}`}>
                          <Mail className="h-3.5 w-3.5" /> Reply to {email}
                        </a>
                      </Button>
                    )}
                    {phone && (
                      <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs">
                        <a href={`tel:${phone.replace(/\s+/g, "")}`}>
                          <Phone className="h-3.5 w-3.5" /> Call {phone}
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
