import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useShop } from "@/lib/shop";
import { AddressFields, parseLandmark } from "../checkout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MapPin, Plus, Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account/addresses")({ component: Addresses });

type A = {
  id?: string;
  full_name: string;
  phone: string;
  province: string;
  district: string;
  municipality?: string;
  city: string;
  street: string;
  landmark?: string | null;
  is_default?: boolean;
};

const blank: A = {
  full_name: "",
  phone: "",
  province: "Bagmati",
  district: "",
  municipality: "",
  city: "",
  street: "",
  landmark: "",
};

function Addresses() {
  const { user } = useShop();
  const [list, setList] = useState<A[]>([]);
  const [loading, setLoading] = useState(true);
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
        municipality: a.municipality ?? "",
        city: a.city ?? "",
        province: a.province ?? "Bagmati",
        landmark: parseLandmark(a.landmark, a.details),
      }));
      setList(mapped);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!edit || !user) return;
    if (
      !edit.full_name ||
      !/^(\+?977)?9\d{9}$/.test(edit.phone) ||
      !edit.district ||
      !edit.city ||
      !edit.street
    ) {
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
          municipality: edit.municipality,
          city: edit.city,
          district: edit.district,
          province: edit.province,
          landmark: edit.landmark,
          is_default: edit.is_default,
        });
      } else {
        await api.post("/addresses", {
          name: edit.full_name,
          phone: edit.phone,
          street: edit.street,
          details: edit.landmark ?? null,
          municipality: edit.municipality,
          city: edit.city,
          district: edit.district,
          province: edit.province,
          landmark: edit.landmark,
          is_default: edit.is_default || list.length === 0,
        });
      }
      setEdit(null);
      toast.success(edit.id ? "Address updated" : "Address saved");
      void load();
    } catch {
      toast.error("Could not save address");
    }
  };

  const makeDefault = async (id: string) => {
    if (!user) return;
    try {
      setList((prev) =>
        prev.map((a) => ({
          ...a,
          is_default: a.id === id,
        }))
      );
      await api.patch("/addresses", { id, is_default: true });
      toast.success("Default address updated");
      void load();
    } catch {
      toast.error("Could not set as default address");
      void load();
    }
  };

  const del = async (id: string) => {
    try {
      await api.delete(`/addresses?id=${id}`);
      toast.success("Address removed");
      void load();
    } catch {
      toast.error("Could not delete address");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60 gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-foreground">
            Saved Addresses
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Delivery destinations for fast and convenient checkout.
          </p>
        </div>
        <Button
          onClick={() => setEdit(blank)}
          size="sm"
          className="h-8 px-3 text-xs font-medium"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          <span>Add Address</span>
        </Button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border/70 bg-card divide-y divide-border/60">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-4 w-14 rounded" />
              </div>
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-3.5 w-64 rounded" />
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 p-8 text-center bg-muted/10 space-y-3">
          <MapPin className="h-7 w-7 text-muted-foreground/50 mx-auto" />
          <div>
            <p className="text-sm font-medium text-foreground">No saved addresses</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add a delivery address to speed up order checkouts.
            </p>
          </div>
          <Button onClick={() => setEdit(blank)} size="sm" className="h-8 text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span>Add an address</span>
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border/70 bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
          {list.map((a) => (
            <div
              key={a.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 transition-colors hover:bg-muted/15"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-semibold text-foreground truncate">
                    {a.full_name}
                  </h3>
                  {a.is_default && (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      <Check className="h-3 w-3" />
                      <span>Default</span>
                    </span>
                  )}
                </div>

                <p className="font-mono text-xs text-muted-foreground">
                  {a.phone}
                </p>

                <p className="text-xs text-foreground/85 leading-relaxed pt-0.5">
                  {a.street}, {a.city}
                  {a.municipality ? `, ${a.municipality}` : ""} • {a.district}, {a.province}
                </p>

                {a.landmark && !a.landmark.startsWith("{") && (
                  <p className="text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground/70">Landmark:</span> {a.landmark}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 sm:self-center shrink-0 pt-1 sm:pt-0">
                {!a.is_default && (
                  <button
                    type="button"
                    onClick={() => makeDefault(a.id!)}
                    className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted/50 transition cursor-pointer"
                  >
                    Set as default
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setEdit(a)}
                  className="text-xs font-medium text-foreground px-2 py-1 rounded border border-border/60 hover:bg-muted/50 transition cursor-pointer"
                >
                  Edit
                </button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-destructive px-2 py-1 rounded hover:bg-destructive/10 transition cursor-pointer"
                    >
                      Delete
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="w-[94vw] max-w-sm rounded-xl p-5">
                    <AlertDialogTitle className="text-sm font-semibold">
                      Delete this address?
                    </AlertDialogTitle>
                    <AlertDialogFooter className="gap-2 pt-2">
                      <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => del(a.id!)}
                        className="h-8 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / New Address Dialog */}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="w-[95vw] max-w-xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-xl">
          <DialogTitle className="text-base font-semibold">
            {edit?.id ? "Edit Delivery Address" : "New Delivery Address"}
          </DialogTitle>

          {edit && (
            <div className="space-y-4 pt-2">
              <AddressFields value={edit} onChange={(v) => setEdit({ ...edit, ...v })} />

              <label
                htmlFor="modal-is-default"
                className="flex items-center gap-2 cursor-pointer select-none pt-1"
              >
                <Checkbox
                  id="modal-is-default"
                  checked={!!edit.is_default}
                  onCheckedChange={(checked) => setEdit({ ...edit, is_default: !!checked })}
                />
                <span className="text-xs text-foreground">
                  Set as default delivery address
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEdit(null)}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button onClick={save} size="sm" className="h-8 text-xs font-medium">
                  Save Address
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
