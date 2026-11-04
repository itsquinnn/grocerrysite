import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Stars } from "@/components/site/Stars";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/reviews")({ component: Reviews });

function Reviews() {
  const qc = useQueryClient();
  const { data: list = [] } = useQuery({
    queryKey: ["admin", "reviews"],
    queryFn: async () => {
      try {
        let { data, error } = await supabase
          .from("reviews")
          .select("*, products(title), accounts(name)")
          .order("created_at", { ascending: false });
        if (error) {
          const res = await supabase.from("reviews").select("*, products(title)").order("created_at", { ascending: false });
          data = res.data;
        }
        return (data ?? []).map((r: any) => ({
          ...r,
          is_approved: r.is_approved ?? r.is_published ?? true,
          body: r.review_text ?? r.comment ?? r.body ?? "",
          author_name: r.author_name ?? r.accounts?.name ?? "Customer",
          products: r.products ? { name: r.products.title ?? r.products.name ?? "Product" } : null,
        }));
      } catch {
        return [];
      }
    },
  });
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["admin", "reviews"] }); void qc.invalidateQueries({ queryKey: ["reviews"] }); };
  const setApproved = async (id: string, v: boolean) => {
    let { error } = await supabase.from("reviews").update({ is_published: v } as any).eq("id", id);
    if (error) {
      await supabase.from("reviews").update({ is_approved: v } as any).eq("id", id);
    }
    refresh();
  };
  const del = async (id: string) => { await supabase.from("reviews").delete().eq("id", id); refresh(); };
  return (
    <div>
      <h2 className="text-2xl">Review moderation</h2>
      <ul className="mt-4 divide-y rounded-md border bg-card">
        {list.map((r) => (
          <li key={r.id} className="flex flex-wrap gap-3 p-4 text-sm">
            <div className="flex-1"><div className="flex items-center gap-2"><Stars value={r.rating} /><span className="font-medium">{(r as { products?: { name: string } }).products?.name}</span>{!r.is_approved && <span className="rounded bg-muted px-1.5 text-xs">Hidden</span>}</div><p className="mt-1 text-muted-foreground">{r.body}</p><p className="text-xs">— {r.author_name}</p></div>
            <div className="flex gap-2 self-start">
              <Button size="sm" variant="outline" onClick={() => setApproved(r.id, !r.is_approved)}>{r.is_approved ? "Hide" : "Approve"}</Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => del(r.id)}>Delete</Button>
            </div>
          </li>
        ))}
        {list.length === 0 && (
          <li className="p-8 text-center text-sm text-muted-foreground">No customer reviews yet.</li>
        )}
      </ul>
    </div>
  );
}
