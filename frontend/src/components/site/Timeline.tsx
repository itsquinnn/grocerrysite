import { Check } from "lucide-react";
import { TRACK_STEPS, statusLabel } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function Timeline({ status, events = [] }: { status: string; events?: { status: string; created_at: string }[] }) {
  const { isNepali, formatStatus } = useI18n();

  if (["cancelled", "returned", "refunded"].includes(status))
    return (
      <p className="rounded-md bg-secondary p-4 text-sm font-medium">
        {isNepali
          ? `यो अर्डर ${formatStatus(status)} भएको छ।`
          : `This order is ${statusLabel(status).toLowerCase()}.`}
      </p>
    );

  const idx = TRACK_STEPS.indexOf(status as (typeof TRACK_STEPS)[number]);
  const labels = isNepali
    ? ["अर्डर प्राप्त", "पुष्टि भयो", "प्रशोधन", "पठाइयो", "डेलिभरीमा छ", "डेलिभर भयो"]
    : ["Order placed", "Confirmed", "Processing", "Shipped", "Out for delivery", "Delivered"];

  return (
    <ol className="grid gap-4 sm:grid-cols-6 sm:gap-0">
      {TRACK_STEPS.map((s, i) => {
        const done = i <= idx;
        const ev = events.find((e) => e.status === s);
        return (
          <li key={s} className="relative flex items-center gap-3 sm:flex-col sm:text-center">
            {i > 0 && (
              <span
                className={cn("absolute hidden h-0.5 sm:block", done ? "bg-success" : "bg-border")}
                style={{ left: "-50%", right: "50%", top: 14 }}
              />
            )}
            <span
              className={cn(
                "relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 text-xs",
                done ? "border-success bg-success text-accent-foreground" : "border-border bg-card"
              )}
            >
              {done ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span className="text-xs sm:mt-2">
              <span className={cn("block font-medium", !done && "text-muted-foreground")}>{labels[i]}</span>
              {ev && (
                <span className="text-muted-foreground">
                  {new Date(ev.created_at).toLocaleDateString(isNepali ? "ne-NP" : "en-US")}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
