import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { AddressFields } from "../checkout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/account/addresses")({ component: Addresses });

type A = { id?: string; full_name: string; phone: string; province: string; district: string; city: string; street: string; landmark?: string | null; is_default?: boolean };
const blank: A = { full_name: "", phone: "", province: "Bagmati", district: "", city: "", street: "", landmark: "" };

function Addresses() {
  const { user } = useShop();
  const { isNepali } = useI18n();
  const [list, setList] = useState<A[]>([]);
  const [edit, setEdit] = useState<A | null>(null);
  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("addresses").select("*").eq("user_id", user.id).order("created_at");
    setList(data ?? []);
  }, [user]);
  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    if (!edit || !user) return;
    if (!edit.full_name || !/^(\+?977)?9\d{9}$/.test(edit.phone) || !edit.district || !edit.city || !edit.street) {
      return toast.error(isNepali ? "कृपया सही मोबाइल नम्बरसहित सबै विवरण भर्नुहोस्" : "Please complete all fields with a valid mobile number");
    }
    const row = { full_name: edit.full_name, phone: edit.phone, province: edit.province, district: edit.district, city: edit.city, street: edit.street, landmark: edit.landmark ?? null };
    const { error } = edit.id ? await supabase.from("addresses").update(row).eq("id", edit.id) : await supabase.from("addresses").insert({ ...row, user_id: user.id, is_default: list.length === 0 });
    if (error) return toast.error(isNepali ? "ठेगाना बचत गर्न सकिएन" : "Could not save address");
    setEdit(null); toast.success(isNepali ? "ठेगाना बचत भयो" : "Address saved"); void load();
  };
  const makeDefault = async (id: string) => {
    if (!user) return;
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    void load();
  };
  const del = async (id: string) => {
    await supabase.from("addresses").delete().eq("id", id);
    toast.success(isNepali ? "ठेगाना हटाइयो" : "Address removed");
    void load();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{isNepali ? "सुरक्षित गरिएका ठेगानाहरू" : "Saved addresses"}</h2>
        <Button onClick={() => setEdit(blank)}>{isNepali ? "नयाँ ठेगाना थप्नुहोस्" : "Add address"}</Button>
      </div>
      {list.length === 0 && (
        <p className="mt-6 text-muted-foreground">
          {isNepali ? "अहिलेसम्म कुनै ठेगाना सुरक्षित गरिएको छैन।" : "No addresses saved yet."}
        </p>
      )}
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {list.map((a) => (
          <li key={a.id} className="rounded-md border bg-card p-4 text-sm">
            <p className="font-medium">
              {a.full_name}{" "}
              {a.is_default && (
                <span className="ml-2 rounded bg-secondary px-2 py-0.5 text-xs">
                  {isNepali ? "पूर्वनिर्धारित" : "Default"}
                </span>
              )}
            </p>
            <p className="mt-1 text-muted-foreground">{a.phone}<br />{a.street}, {a.city}<br />{a.district}, {a.province}</p>
            <div className="mt-3 flex gap-3 text-xs font-semibold">
              <button className="underline hover:text-accent" onClick={() => setEdit(a)}>
                {isNepali ? "सम्पादन" : "Edit"}
              </button>
              {!a.is_default && (
                <button className="underline hover:text-accent" onClick={() => makeDefault(a.id!)}>
                  {isNepali ? "मुख्य बनाउनुहोस्" : "Set default"}
                </button>
              )}
              <AlertDialog>
                <AlertDialogTrigger className="text-destructive underline">
                  {isNepali ? "हटाउनुहोस्" : "Delete"}
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogTitle>
                    {isNepali ? "के तपाईं यो ठेगाना हटाउन चाहनुहुन्छ?" : "Delete this address?"}
                  </AlertDialogTitle>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{isNepali ? "रद्द गर्नुहोस्" : "Cancel"}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => del(a.id!)}>{isNepali ? "हटाउनुहोस्" : "Delete"}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </li>
        ))}
      </ul>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>
            {edit?.id
              ? (isNepali ? "ठेगाना सम्पादन गर्नुहोस्" : "Edit address")
              : (isNepali ? "नयाँ ठेगाना" : "New address")}
          </DialogTitle>
          {edit && <AddressFields value={edit} onChange={(v) => setEdit({ ...edit, ...v })} />}
          <Button onClick={save}>
            {isNepali ? "ठेगाना सुरक्षित गर्नुहोस्" : "Save address"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
