import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Paperclip, ExternalLink, Mail, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { statusLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/account/support")({ component: Tickets });

function Tickets() {
  const { user } = useShop();
  const { isNepali } = useI18n();
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold">{isNepali ? "सहायता टिकटहरू" : "Support tickets"}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isNepali ? "तपाईंले दर्ता गर्नुभएका सबै सहायता अनुरोधहरू" : "Track all your support and inquiry requests"}
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link to="/support">{isNepali ? "+ नयाँ टिकट" : "+ New ticket"}</Link>
        </Button>
      </div>

      {isLoading && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          {isNepali ? "टिकटहरू लोड हुँदैछ..." : "Loading support tickets..."}
        </div>
      )}

      {!isLoading && tickets.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          {isNepali ? "तपाईंको कुनै पनि सहायता टिकट छैन।" : "No support tickets yet. Need help? Submit a new ticket above."}
        </div>
      )}

      <ul className="space-y-3">
        {tickets.map((t: any) => {
          const refCode = (t.ticket_number || t.id.slice(0, 8)).toUpperCase();
          const isOpen = open === t.id;

          let badgeColor = "bg-amber-500/10 text-amber-600";
          if (t.status === "In Progress") badgeColor = "bg-blue-500/10 text-blue-600";
          if (t.status === "Resolved") badgeColor = "bg-emerald-500/10 text-emerald-600";
          if (t.status === "Closed") badgeColor = "bg-muted text-muted-foreground";

          return (
            <li key={t.id} className="rounded-lg border bg-card p-4 transition shadow-sm hover:border-foreground/20">
              <button
                type="button"
                className="flex w-full flex-wrap items-center justify-between gap-3 text-left"
                onClick={() => setOpen(isOpen ? null : t.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-primary">#{refCode}</span>
                  <span className="text-sm font-medium text-foreground">{t.subject}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeColor}`}>
                    {statusLabel(t.status)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(t.created_at).toLocaleDateString()}
                  </span>
                </div>
              </button>

              {isOpen && (
                <div className="mt-4 border-t pt-4 space-y-3">
                  <div className="rounded-md bg-muted/40 p-3 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
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

                  <div className="rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground flex items-start gap-2">
                    <Mail className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">
                        {isNepali ? "सपोर्ट टोलीको जवाफ:" : "Support Team Updates:"}
                      </p>
                      <p className="mt-0.5">
                        {isNepali
                          ? "हाम्रो काठमाडौंस्थित ग्राहक सहायता टोलीले तपाईंको इमेलमा सिधै जवाफ दिनेछ। थप जानकारी दिनको लागि तपाईंले प्राप्त गर्नुभएको टिकट कन्फर्मेसन इमेलमा सिधै रिप्लाई गर्न सक्नुहुन्छ।"
                          : "Our customer care team in Kathmandu will respond directly to your email address. You can also reply directly to the confirmation email to provide additional photos or details."}
                      </p>
                    </div>
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
