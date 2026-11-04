import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PasswordRule {
  labelEn: string;
  labelNe: string;
  met: boolean;
}

export interface PasswordStrength {
  score: number; // 0 to 4
  levelEn: string;
  levelNe: string;
  color: string;
  textColor: string;
  rules: PasswordRule[];
}

export function getPasswordStrength(pwd: string): PasswordStrength {
  const rules: PasswordRule[] = [
    {
      labelEn: "At least 8 characters",
      labelNe: "कम्तीमा ८ अक्षरहरू",
      met: pwd.length >= 8,
    },
    {
      labelEn: "Uppercase & lowercase letters",
      labelNe: "ठूलो (A-Z) र सानो (a-z) अक्षर",
      met: /[a-z]/.test(pwd) && /[A-Z]/.test(pwd),
    },
    {
      labelEn: "At least one number (0-9)",
      labelNe: "कम्तीमा एउटा अंक (0-9)",
      met: /\d/.test(pwd),
    },
    {
      labelEn: "At least one symbol (!@#$...)",
      labelNe: "कम्तीमा एउटा विशेष चिह्न (!@#$)",
      met: /[^A-Za-z0-9]/.test(pwd),
    },
  ];

  if (pwd.length === 0) {
    return {
      score: 0,
      levelEn: "",
      levelNe: "",
      color: "bg-muted",
      textColor: "text-muted-foreground",
      rules,
    };
  }

  const metCount = rules.filter((r) => r.met).length;

  if (pwd.length < 8 || metCount <= 1) {
    return {
      score: 1,
      levelEn: "Weak",
      levelNe: "कमजोर",
      color: "bg-red-500",
      textColor: "text-red-500",
      rules,
    };
  }
  if (metCount === 2) {
    return {
      score: 2,
      levelEn: "Fair",
      levelNe: "साधारण",
      color: "bg-amber-500",
      textColor: "text-amber-500",
      rules,
    };
  }
  if (metCount === 3) {
    return {
      score: 3,
      levelEn: "Good",
      levelNe: "राम्रो",
      color: "bg-blue-500",
      textColor: "text-blue-500",
      rules,
    };
  }
  return {
    score: 4,
    levelEn: "Strong",
    levelNe: "धेरै बलियो",
    color: "bg-emerald-500",
    textColor: "text-emerald-500",
    rules,
  };
}

export function PasswordStrengthIndicator({
  password,
  isNepali = false,
  showRules = true,
}: {
  password: string;
  isNepali?: boolean;
  showRules?: boolean;
}) {
  if (!password) return null;
  const strength = getPasswordStrength(password);

  return (
    <div className="space-y-2 pt-1 animate-in fade-in duration-200">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {isNepali ? "पासवर्ड स्तर:" : "Password strength:"}
        </span>
        <span className={cn("font-semibold", strength.textColor)}>
          {isNepali ? strength.levelNe : strength.levelEn}
        </span>
      </div>

      {/* 4-level progress bar */}
      <div className="grid grid-cols-4 gap-1.5 h-1.5">
        {[1, 2, 3, 4].map((lvl) => (
          <div
            key={lvl}
            className={cn(
              "h-full rounded-full transition-all duration-300",
              strength.score >= lvl ? strength.color : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* Criteria checklist */}
      {showRules && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-xs">
          {strength.rules.map((rule, idx) => (
            <div
              key={idx}
              className={cn(
                "flex items-center gap-1.5 transition-colors",
                rule.met
                  ? "text-emerald-600 dark:text-emerald-400 font-medium"
                  : "text-muted-foreground"
              )}
            >
              {rule.met ? (
                <Check className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 mx-1 shrink-0" />
              )}
              <span>{isNepali ? rule.labelNe : rule.labelEn}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

