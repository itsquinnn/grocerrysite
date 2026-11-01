import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { formatNPR, statusLabel } from "@/lib/format";
import { downloadInvoice, type InvoiceOrder } from "@/lib/invoice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/orders")({ component: AdminOrders });
type Status = Database["public"]["Enums"]["order_status"];
const STATUSES: Status[] = ["pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled", "returned", "refunded"];

function AdminOrders() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [sel, setSel] = useState<string | null>(null);
  const [next, setNext] = useState<Status>("processing");
  const [tracking, setTracking] = useState("");
  const { data: orders = [] } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => (await supabase.from("orders").select("*, order_items(*), return_requests(id,reason,status)").order("created_at", { ascending: false })).data ?? [],
  });
  const o = orders.find((x) => x.id === sel);
  const shown = orders.filter((x) => (filter === "all" || x.status === filter) && (!q || (x.order_number + x.customer_name + x.customer_phone + x.customer_email).toLowerCase().includes(q.toLowerCase())));

  const update = async () => {
    if (!o) return;
    const { error } = await supabase.rpc("admin_set_order_status", { _order_id: o.id, _status: next, _tracking: tracking, _note: `Status set to ${statusLabel(next)}` });
    if (error) return toast.error(error.message);
    toast.success("Order updated"); void qc.invalidateQueries({ queryKey: ["admin"] });
  };
  const returnStatus = async (id: string, status: string) => { await supabase.from("return_requests").update({ status }).eq("id", id); void qc.invalidateQueries({ queryKey: ["admin"] }); };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl">Orders</h2>
        <Input className="ml-auto w-60" placeholder="Search order, name, phone" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{STATUSES.map((s) => <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>)}</SelectContent></Select>
      </div>
      <div className="mt-4 overflow-x-auto rounded-md border bg-card">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground"><tr className="border-b"><th className="p-3">Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Payment</th><th>Status</th><th /></tr></thead>
          <tbody>
            {shown.map((x) => (
              <tr key={x.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{x.order_number}{x.return_requests.some((r) => r.status === "requested") && <span className="ml-2 rounded bg-sale px-1.5 text-[10px] text-accent-foreground">Return</span>}</td>
                <td>{x.customer_name}<span className="block text-xs text-muted-foreground">{x.customer_phone}</span></td>
                <td>{new Date(x.created_at).toLocaleDateString()}</td><td>{formatNPR(x.total)}</td>
                <td>{x.payment_method.toUpperCase()} · {statusLabel(x.payment_status)}</td><td>{statusLabel(x.status)}</td>
                <td className="pr-3 text-right"><Button size="sm" variant="outline" onClick={() => { setSel(x.id); setNext(x.status); setTracking(x.tracking_number ?? ""); }}>Manage</Button></td>
              </tr>
            ))}
            {shown.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No orders found.</td></tr>}
          </tbody>
        </table>
      </div>
      <Dialog open={!!o} onOpenChange={(v) => !v && setSel(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {o && (
            <>
              <DialogTitle>Order {o.order_number}</DialogTitle>
              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <div><p className="eyebrow">Customer</p>{o.customer_name}<br />{o.customer_email}<br />{o.customer_phone}</div>
                <div><p className="eyebrow">Ship to</p>{(() => { const a = o.shipping_address as Record<string, string>; return [a.street, a.city, a.district, a.province].filter(Boolean).join(", "); })()}</div>
              </div>
              <ul className="divide-y border-y text-sm">{o.order_items.map((i) => <li key={i.id} className="flex justify-between py-2"><span>{i.name} × {i.quantity}</span><span>{formatNPR(i.line_total)}</span></li>)}</ul>
              <p className="text-sm">Total <b>{formatNPR(o.total)}</b> · {o.payment_method.toUpperCase()} · payment {statusLabel(o.payment_status)}</p>
              {o.return_requests.map((r) => (
                <div key={r.id} className="rounded-md bg-secondary p-3 text-sm"><b>Return request ({statusLabel(r.status)}):</b> {r.reason}
                  {r.status === "requested" && <div className="mt-2 flex gap-2"><Button size="sm" onClick={() => returnStatus(r.id, "approved")}>Approve</Button><Button size="sm" variant="outline" onClick={() => returnStatus(r.id, "rejected")}>Reject</Button></div>}
                </div>
              ))}
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <Select value={next} onValueChange={(v) => setNext(v as Status)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>)}</SelectContent></Select>
                <Input placeholder="Tracking number" value={tracking} onChange={(e) => setTracking(e.target.value)} />
                <Button onClick={update}>Update</Button>
              </div>
              <p className="text-xs text-muted-foreground">Setting "Delivered" marks a cash-on-delivery order as paid; "Cancelled" returns items to stock; "Refunded" marks payment refunded.</p>
              <Button variant="outline" onClick={() => downloadInvoice(o as unknown as InvoiceOrder)}>Download invoice</Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
