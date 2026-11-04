import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
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
    try {
      const res = await api.get<{ addresses: any[] }>("/addresses");
      const mapped = (res?.addresses ?? []).map((a: any) => ({
        ...a,
        full_name: a.full_name ?? a.name ?? "",
        phone: a.phone ?? "",
        street: a.street ?? "",
        district: a.district ?? "",
        city: a.city ?? "",
        province: a.province ?? "Bagmati",
        landmark: a.landmark ?? a.details ?? null,
      }));
      setList(mapped);
    } catch {
      setList([]);
    }
  }, [user]);
  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    if (!edit || !user) return;
    if (!edit.full_name || !/^(\+?977)?9\d{9}$/.test(edit.phone) || !edit.district || !edit.city || !edit.street) {
      return toast.error("Please complete all fields with a valid mobile number");
    }
    try {
      if (edit.id) {
        await api.patch("/addresses", {
          id: edit.id,
          name: edit.full_name,
          phone: edit.phone,
          street: edit.street,
          details: edit.landmark ?? null,
          city: edit.city,
          district: edit.district,
          province: edit.province,
          landmark: edit.landmark,
        });
      } else {
        await api.post("/addresses", {
          name: edit.full_name,
          phone: edit.phone,
          street: edit.street,
          details: edit.landmark ?? null,
          city: edit.city,
          district: edit.district,
          province: edit.province,
          landmark: edit.landmark,
          is_default: list.length === 0,
        });
      }
      setEdit(null);
      toast.success("Address saved");
      void load();
    } catch {
      toast.error("Could not save address");
    }
  };
  const makeDefault = async (id: string) => {
    if (!user) return;
    try {
      await api.patch("/addresses", { id, is_default: true });
      void load();
    } catch {}
  };
  const del = async (id: string) => {
    try {
      await api.delete(`/addresses?id=${id}`);
      toast.success("Address removed");
      void load();
    } catch {}
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold">Saved Addresses</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Delivery locations saved for fast 1-click checkout
          </p>
        </div>
        <Button onClick={() => setEdit(blank)} className="w-full sm:w-auto font-medium">
          + Add Address
        </Button>
      </div>
      {list.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed bg-card/60 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No addresses saved yet.
          </p>
        </div>
      )}
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {list.map((a) => (
          <li key={a.id} className="rounded-xl border bg-card p-4 text-sm shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-foreground">{a.full_name}</p>
                {a.is_default && (
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent shrink-0">
                    Default
                  </span>
                )}
              </div>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{a.phone}</p>
              <p className="mt-1.5 text-xs text-foreground/80 leading-relaxed">
                {a.street}, {a.city}<br />{a.district}, {a.province}
              </p>
              {a.landmark && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground/70">Landmark:</span> {a.landmark}
                </p>
              )}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t pt-3 text-xs font-medium">
              <button className="underline hover:text-accent cursor-pointer" onClick={() => setEdit(a)}>
                Edit
              </button>
              {!a.is_default && (
                <button className="underline hover:text-accent cursor-pointer" onClick={() => makeDefault(a.id!)}>
                  Set default
                </button>
              )}
              <AlertDialog>
                <AlertDialogTrigger className="text-destructive underline hover:text-destructive/80 cursor-pointer ml-auto">
                  Delete
                </AlertDialogTrigger>
                <AlertDialogContent className="w-[94vw] max-w-md">
                  <AlertDialogTitle>
                    Delete this address?
                  </AlertDialogTitle>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => del(a.id!)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </li>
        ))}
      </ul>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogTitle>
            {edit?.id ? "Edit address" : "New address"}
          </DialogTitle>
          {edit && <AddressFields value={edit} onChange={(v) => setEdit({ ...edit, ...v })} />}
          <Button onClick={save} className="mt-2 w-full sm:w-auto">
            Save address
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
