import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/account/notifications")({ component: Notes });

function Notes() {
  const { user } = useShop();
  const { isNepali } = useI18n();
  const qc = useQueryClient();
  const { data: list = [] } = useQuery({
    queryKey: ["me", "notifications", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });
  const markAll = async () => {
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user!.id).eq("is_read", false);
    void qc.invalidateQueries({ queryKey: ["me", "notifications"] });
  };
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{isNepali ? "सूचनाहरू" : "Notifications"}</h2>
        {list.some((n) => !n.is_read) && (
          <Button variant="outline" size="sm" onClick={markAll}>
            {isNepali ? "सबै पढिएको चिन्ह लगाउनुहोस्" : "Mark all read"}
          </Button>
        )}
      </div>
      {list.length === 0 && (
        <p className="mt-6 text-muted-foreground">
          {isNepali ? "कुनै नयाँ सूचना छैन।" : "You're all caught up."}
        </p>
      )}
      <ul className="mt-6 divide-y rounded-md border bg-card">
        {list.map((n) => (
          <li key={n.id} className="flex gap-3 p-4 text-sm">
            {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />}
            <div className="flex-1"><p className="font-medium">{n.title}</p>{n.body && <p className="text-muted-foreground">{n.body}</p>}</div>
            {n.link && <Link to={n.link as "/account"} className="underline">{isNepali ? "हेर्नुहोस्" : "View"}</Link>}
          </li>
        ))}
      </ul>
    </div>
  );
}
