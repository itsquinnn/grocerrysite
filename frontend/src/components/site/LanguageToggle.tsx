import { Globe } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useI18n();

  return (
    <div
      role="group"
      aria-label="Language selection"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border bg-muted/50 p-0.5 text-xs font-medium shadow-2xs select-none",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        className={cn(
          "rounded-full px-2 py-1 transition-all duration-150",
          locale === "en"
            ? "bg-background text-foreground shadow-xs font-semibold"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale("ne")}
        aria-pressed={locale === "ne"}
        className={cn(
          "rounded-full px-2 py-1 transition-all duration-150",
          locale === "ne"
            ? "bg-background text-foreground shadow-xs font-semibold"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        नेपाली
      </button>
    </div>
  );
}

export function LanguageToggleCompact({ className }: { className?: string }) {
  const { locale, toggleLocale } = useI18n();

  return (
    <button
      type="button"
      onClick={toggleLocale}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-2.5 py-1 text-xs font-medium transition hover:bg-primary-foreground/20",
        className
      )}
      title={locale === "en" ? "नेपाली भाषामा बदल्नुहोस्" : "Switch to English"}
      aria-label="Switch language between English and Nepali"
    >
      <Globe className="h-3.5 w-3.5" />
      <span>{locale === "en" ? "नेपाली" : "English"}</span>
    </button>
  );
}

