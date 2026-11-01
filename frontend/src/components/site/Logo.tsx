import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function LogoMark({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "white";
}) {
  return (
    <img
      src={variant === "white" ? "/logo-white.png" : "/logo.png"}
      alt="DOVAN"
      width={32}
      height={32}
      className={cn("h-7 w-7 sm:h-[30px] sm:w-[30px] object-contain shrink-0 select-none", className)}
      loading="eager"
    />
  );
}

export function Logo({
  className,
  variant,
  showText = true,
}: {
  className?: string;
  variant?: "default" | "white";
  showText?: boolean;
}) {
  const isDark = variant === "white" || className?.includes("text-primary-foreground");
  return (
    <Link to="/" className={cn("group flex items-center gap-2", className)} aria-label="DOVAN home">
      <LogoMark
        variant={isDark ? "white" : "default"}
        className="transition-transform duration-200 group-hover:scale-105"
      />
      {showText && <span className="font-display text-xl sm:text-[22px] font-semibold tracking-[0.1em]">DOVAN</span>}
    </Link>
  );
}
