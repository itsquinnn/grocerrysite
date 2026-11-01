import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({ value, count, size = 14, className }: { value: number; count?: number; size?: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)} aria-label={`Rated ${value.toFixed(1)} out of 5`}>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} style={{ width: size, height: size }} className={i <= Math.round(value) ? "fill-accent text-accent" : "text-border"} />
        ))}
      </div>
      {count !== undefined && <span className="text-xs text-muted-foreground">({count})</span>}
    </div>
  );
}
