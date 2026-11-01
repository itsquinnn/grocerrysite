import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { statusLabel } from "@/lib/format";
import { TicketThread } from "./account.support";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/tickets")({ component: Tickets });

function Tickets() {
  const qc = useQueryClient();
  const [open, setOpen] = useState<string | null>(null);
  const { data: list = [] } = useQuery({ queryKey: ["admin", "tickets"], queryFn: async () => (await supabase.from("support_tickets").select("*").order("created_at", { ascending: false })).data ?? [] });
  const setStatus = async (id: string, status: string) => { await supabase.from("support_tickets").update({ status, updated_at: new Date().toISOString() }).eq("id", id); void qc.invalidateQueries({ queryKey: ["admin", "tickets"] }); };
  return (
    <div>
      <h2 className="text-2xl">Support tickets</h2>
      <ul className="mt-4 space-y-3">
        {list.map((t) => (
          <li key={t.id} className="rounded-md border bg-card p-4 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              <button className="flex-1 text-left" onClick={() => setOpen(open === t.id ? null : t.id)}><b>{t.ticket_number}</b> · {t.subject}<span className="block text-xs text-muted-foreground">{t.name} · {t.email} · {statusLabel(t.category)}{t.order_number ? ` · ${t.order_number}` : ""} · {new Date(t.created_at).toLocaleString()}</span></button>
              <Select value={t.status} onValueChange={(v) => setStatus(t.id, v)}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent>{["open", "in_progress", "resolved", "closed"].map((s) => <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>)}</SelectContent></Select>
            </div>
            {open === t.id && (<><p className="mt-3 whitespace-pre-wrap">{t.message}</p>{t.user_id ? <TicketThread ticketId={t.id} staff /> : <p className="mt-3 text-xs text-muted-foreground">Guest ticket — reply by email to {t.email}.</p>}</>)}
          </li>
        ))}
        {list.length === 0 && <li className="text-muted-foreground">No tickets.</li>}
      </ul>
    </div>
  );
}
