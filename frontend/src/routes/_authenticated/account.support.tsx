import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { statusLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/account/support")({ component: Tickets });

export function TicketThread({ ticketId, staff = false }: { ticketId: string; staff?: boolean }) {
  const { user } = useShop();
  const { isNepali } = useI18n();
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const { data: msgs = [] } = useQuery({
    queryKey: ["me", "ticket-msgs", ticketId],
    queryFn: async () => (await supabase.from("ticket_messages").select("*").eq("ticket_id", ticketId).order("created_at")).data ?? [],
  });
  const send = async () => {
    if (!user || body.trim().length < 2) return;
    const { error } = await supabase.from("ticket_messages").insert({ ticket_id: ticketId, author_id: user.id, is_staff: staff, body: body.trim().slice(0, 4000) });
    if (error) return toast.error(isNepali ? "पठाउन सकिएन" : "Could not send");
    setBody("");
    void qc.invalidateQueries({ queryKey: ["me", "ticket-msgs", ticketId] });
  };
  return (
    <div className="mt-3 space-y-2 border-t pt-3">
      {msgs.map((m) => (
        <p key={m.id} className={`rounded-md p-3 text-sm ${m.is_staff ? "bg-secondary" : "bg-muted"}`}>
          <b>{m.is_staff ? (isNepali ? "दोभान सपोर्ट" : "DOVAN Support") : (isNepali ? "तपाईं" : "You")}:</b> {m.body}
        </p>
      ))}
      <div className="flex gap-2">
        <Textarea rows={2} value={body} onChange={(e) => setBody(e.target.value)} placeholder={isNepali ? "जवाफ लेख्नुहोस्..." : "Write a reply…"} />
        <Button onClick={send}>{isNepali ? "पठाउनुहोस्" : "Send"}</Button>
      </div>
    </div>
  );
}

function Tickets() {
  const { user } = useShop();
  const { isNepali } = useI18n();
  const [open, setOpen] = useState<string | null>(null);
  const { data: tickets = [] } = useQuery({
    queryKey: ["me", "tickets", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("support_tickets").select("*").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{isNepali ? "सहायता टिकटहरू" : "Support tickets"}</h2>
        <Button asChild>
          <Link to="/support">{isNepali ? "नयाँ टिकट" : "New ticket"}</Link>
        </Button>
      </div>
      {tickets.length === 0 && (
        <p className="mt-6 text-muted-foreground">
          {isNepali ? "कुनै टिकट छैन।" : "No tickets yet."}
        </p>
      )}
      <ul className="mt-6 space-y-3">
        {tickets.map((t) => (
          <li key={t.id} className="rounded-md border bg-card p-4">
            <button className="flex w-full flex-wrap items-center gap-3 text-left" onClick={() => setOpen(open === t.id ? null : t.id)}>
              <span className="font-medium font-mono">{t.ticket_number}</span>
              <span className="flex-1 text-sm font-medium">{t.subject}</span>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs">{statusLabel(t.status)}</span>
              <span className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</span>
            </button>
            {open === t.id && (
              <>
                <p className="mt-3 text-sm text-muted-foreground">{t.message}</p>
                <TicketThread ticketId={t.id} />
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
