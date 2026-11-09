import { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BS_MONTHS,
  getCurrentBsYear,
  getCurrentBsMonth,
  getCurrentBsDay,
  getNepaliDate,
  getDaysInBsMonth,
  bsToAd,
  formatBsDate,
  toDevanagariNumerals,
} from "@/lib/bikramSambat";
import { cn } from "@/lib/utils";

interface BsDatePickerProps {
  id?: string;
  label?: string;
  value: string | null | undefined; // ISO date string or null
  onChange: (isoString: string | null) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export function BsDatePicker({
  id = "bs-date-picker",
  label = "Expiry Deadline (Bikram Sambat B.S.)",
  value,
  onChange,
  placeholder = "No expiration (Runs indefinitely in BS)",
  disabled = false,
}: BsDatePickerProps) {
  const currentBsYear = getCurrentBsYear();
  const currentBsMonth = getCurrentBsMonth();
  const currentBsDay = getCurrentBsDay();

  const [isOpen, setIsOpen] = useState(false);

  // Parse existing value if present
  const initialBs = useMemo(() => {
    if (!value) return null;
    try {
      const nd = getNepaliDate(value);
      const bs = nd.getBS();
      return { year: bs.year, month: bs.month, day: bs.date };
    } catch {
      return null;
    }
  }, [value]);

  const [selectedYear, setSelectedYear] = useState<number>(
    initialBs?.year ?? currentBsYear
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    initialBs?.month ?? currentBsMonth
  );
  const [selectedDay, setSelectedDay] = useState<number>(
    initialBs?.day ?? currentBsDay
  );

  // Sync state if external value changes
  useEffect(() => {
    if (initialBs) {
      setSelectedYear(initialBs.year);
      setSelectedMonth(initialBs.month);
      setSelectedDay(initialBs.day);
    }
  }, [initialBs]);

  // Available BS years in picker (e.g. 2080 to 2092 BS)
  const availableYears = useMemo(() => {
    const list: number[] = [];
    const start = Math.min(2080, currentBsYear - 2);
    const end = Math.max(2092, currentBsYear + 8);
    for (let y = start; y <= end; y++) {
      list.push(y);
    }
    return list;
  }, [currentBsYear]);

  // Max days in the currently chosen BS month
  const daysInMonth = useMemo(() => {
    return getDaysInBsMonth(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  // Adjust selected day if it exceeds the new month's days
  useEffect(() => {
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
  }, [daysInMonth, selectedDay]);

  // Apply the selected BS date to ISO
  const applyBsDate = (y: number, m: number, d: number) => {
    const adDate = bsToAd(y, m, d);
    adDate.setHours(23, 59, 59, 999);
    onChange(adDate.toISOString());
  };

  const handleDaySelect = (d: number) => {
    setSelectedDay(d);
    applyBsDate(selectedYear, selectedMonth, d);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const goToPrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedYear((y) => y - 1);
      setSelectedMonth(11);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedYear((y) => y + 1);
      setSelectedMonth(0);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  // Quick preset shortcuts
  const setPresetToday = () => {
    setSelectedYear(currentBsYear);
    setSelectedMonth(currentBsMonth);
    setSelectedDay(currentBsDay);
    applyBsDate(currentBsYear, currentBsMonth, currentBsDay);
    setIsOpen(false);
  };

  const setPresetOneMonth = () => {
    let nextM = currentBsMonth + 1;
    let nextY = currentBsYear;
    if (nextM > 11) {
      nextM = 0;
      nextY += 1;
    }
    const maxD = getDaysInBsMonth(nextY, nextM);
    const targetD = Math.min(currentBsDay, maxD);
    setSelectedYear(nextY);
    setSelectedMonth(nextM);
    setSelectedDay(targetD);
    applyBsDate(nextY, nextM, targetD);
    setIsOpen(false);
  };

  const setPresetThreeMonths = () => {
    let nextM = currentBsMonth + 3;
    let nextY = currentBsYear;
    if (nextM > 11) {
      nextM = nextM - 12;
      nextY += 1;
    }
    const maxD = getDaysInBsMonth(nextY, nextM);
    const targetD = Math.min(currentBsDay, maxD);
    setSelectedYear(nextY);
    setSelectedMonth(nextM);
    setSelectedDay(targetD);
    applyBsDate(nextY, nextM, targetD);
    setIsOpen(false);
  };

  const setPresetEndOfMonth = () => {
    const endDay = getDaysInBsMonth(selectedYear, selectedMonth);
    setSelectedDay(endDay);
    applyBsDate(selectedYear, selectedMonth, endDay);
    setIsOpen(false);
  };

  const setPresetChaitraEnd = () => {
    const lastDay = getDaysInBsMonth(selectedYear, 11);
    setSelectedMonth(11);
    setSelectedDay(lastDay);
    applyBsDate(selectedYear, 11, lastDay);
    setIsOpen(false);
  };

  const isExpired = value ? new Date(value) < new Date() : false;

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <Label htmlFor={id} className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5 text-primary" />
            <span>{label}</span>
          </Label>
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.2 rounded">
            B.S. Calendar
          </span>
        </div>
      )}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            disabled={disabled}
            className={cn(
              "w-full flex items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-left text-xs font-medium shadow-2xs transition hover:bg-muted/40 focus:outline-none focus:ring-1 focus:ring-ring",
              value ? "text-foreground" : "text-foreground/60",
              disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <CalendarIcon className="h-4 w-4 shrink-0 text-primary" />
              {value ? (
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-semibold text-foreground">{formatBsDate(value, "medium")}</span>
                  <span className="text-foreground/50 text-[11px] font-normal">
                    ({formatBsDate(value, "devanagari")})
                  </span>
                  {isExpired && (
                    <span className="rounded bg-rose-500/15 text-rose-700 dark:text-rose-400 text-[10px] font-bold px-1.5 py-0.2">
                      Expired
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-foreground/55">{placeholder}</span>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {value && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={handleClear}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleClear(e as any);
                    }
                  }}
                  className="p-1 rounded text-foreground/50 hover:text-foreground hover:bg-muted transition"
                  title="Remove expiration deadline"
                  aria-label="Remove expiration deadline"
                >
                  <X className="h-3.5 w-3.5" />
                </span>
              )}
              <ChevronDown className="h-3.5 w-3.5 text-foreground/50" />
            </div>
          </button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[300px] p-3 bg-popover text-popover-foreground shadow-2xl rounded-xl border border-border z-[100] max-h-[min(380px,calc(100vh-40px))] overflow-y-auto"
          align="start"
          side="bottom"
          sideOffset={6}
          avoidCollisions={true}
          collisionPadding={16}
        >
          <div className="space-y-3">
            {/* Header: Month & Year Navigator */}
            <div className="flex items-center justify-between pb-2 border-b border-border/70">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={goToPrevMonth}
                className="h-7 w-7 p-0 cursor-pointer text-foreground/70 hover:text-foreground"
                title="Previous BS Month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1">
                <Select
                  value={String(selectedMonth)}
                  onValueChange={(val) => {
                    const m = Number(val);
                    setSelectedMonth(m);
                    if (value) applyBsDate(selectedYear, m, selectedDay);
                  }}
                >
                  <SelectTrigger className="h-7 text-xs font-bold px-2 border-0 bg-transparent hover:bg-muted shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-56 z-[110]">
                    {BS_MONTHS.map((mo) => (
                      <SelectItem key={mo.index} value={String(mo.index)} className="text-xs">
                        {mo.name} ({mo.nameNp})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={String(selectedYear)}
                  onValueChange={(val) => {
                    const y = Number(val);
                    setSelectedYear(y);
                    if (value) applyBsDate(y, selectedMonth, selectedDay);
                  }}
                >
                  <SelectTrigger className="h-7 text-xs font-bold px-2 border-0 bg-transparent hover:bg-muted shadow-none font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-56 z-[110]">
                    {availableYears.map((yr) => (
                      <SelectItem key={yr} value={String(yr)} className="text-xs font-mono">
                        {yr} BS
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={goToNextMonth}
                className="h-7 w-7 p-0 cursor-pointer text-foreground/70 hover:text-foreground"
                title="Next BS Month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Calendar Day Grid */}
            <div>
              <div className="grid grid-cols-7 gap-1 text-center py-1 text-[10px] font-semibold text-foreground/50 uppercase tracking-wider">
                <span>Su</span>
                <span>Mo</span>
                <span>Tu</span>
                <span>We</span>
                <span>Th</span>
                <span>Fr</span>
                <span>Sa</span>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center pt-1">
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const isCurrentToday =
                    selectedYear === currentBsYear &&
                    selectedMonth === currentBsMonth &&
                    dayNum === currentBsDay;
                  const isSelected =
                    initialBs?.year === selectedYear &&
                    initialBs?.month === selectedMonth &&
                    initialBs?.day === dayNum;

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() => handleDaySelect(dayNum)}
                      className={cn(
                        "h-7 w-7 mx-auto rounded text-xs font-medium transition cursor-pointer flex items-center justify-center relative select-none",
                        isSelected
                          ? "bg-primary text-primary-foreground font-bold shadow-xs"
                          : isCurrentToday
                          ? "bg-primary/15 text-primary border border-primary/30 font-bold"
                          : "hover:bg-muted text-foreground"
                      )}
                    >
                      <span>{dayNum}</span>
                      {isCurrentToday && !isSelected && (
                        <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Presets */}
            <div className="pt-2 border-t border-border/70 space-y-1">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
                Quick Presets:
              </span>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={setPresetToday}
                  className="h-6 text-[10.5px] px-2 rounded border border-border/70 hover:bg-muted font-medium transition cursor-pointer text-foreground/80"
                >
                  Today ({currentBsDay} {BS_MONTHS[currentBsMonth]?.short})
                </button>
                <button
                  type="button"
                  onClick={setPresetOneMonth}
                  className="h-6 text-[10.5px] px-2 rounded border border-border/70 hover:bg-muted font-medium transition cursor-pointer text-foreground/80"
                >
                  +1 Month
                </button>
                <button
                  type="button"
                  onClick={setPresetThreeMonths}
                  className="h-6 text-[10.5px] px-2 rounded border border-border/70 hover:bg-muted font-medium transition cursor-pointer text-foreground/80"
                >
                  +3 Months
                </button>
                <button
                  type="button"
                  onClick={setPresetEndOfMonth}
                  className="h-6 text-[10.5px] px-2 rounded border border-border/70 hover:bg-muted font-medium transition cursor-pointer text-foreground/80"
                >
                  Month End ({daysInMonth})
                </button>
                <button
                  type="button"
                  onClick={setPresetChaitraEnd}
                  className="h-6 text-[10.5px] px-2 rounded border border-border/70 hover:bg-muted font-medium transition cursor-pointer text-foreground/80"
                >
                  Fiscal End
                </button>
              </div>
            </div>

            {/* Footer Status & Clear */}
            <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[11px]">
              {value ? (
                <span className="text-foreground/75 flex items-center gap-1">
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span className="font-medium">{formatBsDate(value, "medium")}</span>
                </span>
              ) : (
                <span className="text-foreground/45 italic">No deadline set</span>
              )}

              {value && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-6 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 px-2 cursor-pointer"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
