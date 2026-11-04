import { Check, Clock, PackageCheck, Truck, ShoppingBag, CheckCircle2, Box } from "lucide-react";
import { statusLabel } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const ORDER_TRACK_STEPS = [
  { step: 1, key: "order_placed", label: "Order placed", labelNe: "अर्डर प्राप्त", icon: ShoppingBag },
  { step: 2, key: "confirmed", label: "Confirmed", labelNe: "पुष्टि भयो", icon: CheckCircle2 },
  { step: 3, key: "processing", label: "Processing", labelNe: "प्रशोधन हुँदैछ", icon: Clock },
  { step: 4, key: "shipped", label: "Shipped", labelNe: "सामान पठाइयो", icon: Box },
  { step: 5, key: "out_for_delivery", label: "Out for delivery", labelNe: "डेलिभरीमा छ", icon: Truck },
  { step: 6, key: "delivered", label: "Delivered", labelNe: "डेलिभर भयो", icon: PackageCheck },
] as const;

/**
 * Normalizes any order status variation (capitalization, spaces, underscores)
 * to a step index between 0 and 5.
 */
export function getStepIndex(rawStatus: string): number {
  const s = (rawStatus || "").toLowerCase().replace(/[\s_-]+/g, "");
  if (!s) return 0;
  if (s.includes("deliver")) return 5;
  if (s.includes("out")) return 4;
  if (s.includes("ship") || s.includes("pack") || s.includes("dispatch")) return 3;
  if (s.includes("process")) return 2;
  if (s.includes("confirm")) return 1;
  if (s.includes("place") || s.includes("pend")) return 0;
  return 0;
}

export function Timeline({
  status,
  events = [],
}: {
  status: string;
  events?: { status: string; created_at: string }[];
}) {
  const { isNepali, formatStatus } = useI18n();
  const lower = (status || "").toLowerCase();

  if (lower.includes("cancel") || lower.includes("return") || lower.includes("refund")) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive">
        {isNepali
          ? `यो अर्डर ${formatStatus(status)} भएको छ।`
          : `This order is currently ${statusLabel(status).toLowerCase()}.`}
      </div>
    );
  }

  const currentIdx = getStepIndex(status);

  return (
    <div className="w-full py-2">
      {/* Desktop / Tablet Stepper (Horizontal) */}
      <div className="hidden sm:block">
        <div className="relative flex items-start justify-between">
          {/* Background Connecting Track Line */}
          <div className="absolute left-[8%] right-[8%] top-5 -z-0 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-500 ease-out dark:bg-emerald-500"
              style={{
                width: `${(currentIdx / (ORDER_TRACK_STEPS.length - 1)) * 100}%`,
              }}
            />
          </div>

          {ORDER_TRACK_STEPS.map((s, i) => {
            const isCompleted = i < currentIdx;
            const isCurrent = i === currentIdx;
            const isReached = i <= currentIdx;
            const ev = events.find(
              (e) => (e.status || "").toLowerCase().replace(/[\s_-]+/g, "") === s.key.replace(/_/g, "")
            );

            return (
              <div key={s.key} className="relative z-10 flex flex-1 flex-col items-center text-center px-1">
                {/* Step Circle */}
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300",
                    isCurrent
                      ? "border-emerald-600 bg-emerald-600 text-white ring-4 ring-emerald-500/30 shadow-md shadow-emerald-500/20 scale-110 dark:border-emerald-500 dark:bg-emerald-500"
                      : isCompleted
                      ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500"
                      : "border-muted-foreground/30 bg-card text-muted-foreground"
                  )}
                  title={`${s.step}. ${isNepali ? s.labelNe : s.label}`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5 stroke-[2.5]" />
                  ) : (
                    <span>{s.step}</span>
                  )}
                </div>

                {/* Step Label */}
                <div className="mt-3 space-y-0.5">
                  <p
                    className={cn(
                      "text-xs leading-tight transition-colors",
                      isCurrent
                        ? "font-bold text-emerald-700 dark:text-emerald-400"
                        : isCompleted
                        ? "font-semibold text-foreground"
                        : "font-medium text-muted-foreground"
                    )}
                  >
                    {isNepali ? s.labelNe : s.label}
                  </p>

                  {isCurrent && (
                    <span className="inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 animate-pulse">
                      {isNepali ? "हालको स्थिति" : "Current stage"}
                    </span>
                  )}

                  {ev && (
                    <span className="block text-[10px] text-muted-foreground">
                      {new Date(ev.created_at).toLocaleDateString(isNepali ? "ne-NP" : "en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Stepper (Vertical) */}
      <ol className="space-y-4 sm:hidden">
        {ORDER_TRACK_STEPS.map((s, i) => {
          const isCompleted = i < currentIdx;
          const isCurrent = i === currentIdx;
          const isReached = i <= currentIdx;
          const isLast = i === ORDER_TRACK_STEPS.length - 1;
          const ev = events.find(
            (e) => (e.status || "").toLowerCase().replace(/[\s_-]+/g, "") === s.key.replace(/_/g, "")
          );

          return (
            <li key={s.key} className="relative flex items-start gap-3">
              {/* Vertical connecting line */}
              {!isLast && (
                <div
                  className={cn(
                    "absolute left-[17px] top-[34px] -bottom-[12px] w-0.5 transition-colors",
                    isCompleted ? "bg-emerald-600 dark:bg-emerald-500" : "bg-muted"
                  )}
                />
              )}

              {/* Number Circle */}
              <div
                className={cn(
                  "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all",
                  isCurrent
                    ? "border-emerald-600 bg-emerald-600 text-white ring-4 ring-emerald-500/30 shadow-md shadow-emerald-500/20 dark:border-emerald-500 dark:bg-emerald-500"
                    : isCompleted
                    ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500"
                    : "border-muted-foreground/30 bg-card text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="h-4 w-4 stroke-[2.5]" /> : <span>{s.step}</span>}
              </div>

              {/* Step info */}
              <div className="pt-1 flex-1">
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      "text-sm leading-none",
                      isCurrent
                        ? "font-bold text-emerald-700 dark:text-emerald-400"
                        : isCompleted
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {s.step}. {isNepali ? s.labelNe : s.label}
                  </p>

                  {isCurrent && (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 animate-pulse">
                      {isNepali ? "हालको स्थिति" : "Active"}
                    </span>
                  )}
                </div>

                {ev && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(ev.created_at).toLocaleDateString(isNepali ? "ne-NP" : "en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
