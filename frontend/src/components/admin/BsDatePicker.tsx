import { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  X,
  Sparkles,
  Clock,
  ChevronDown,
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
  placeholder = "No expiration (Runs indefinitely)",
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
    // Set to end of day (23:59:59) so coupon is valid throughout that BS day
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
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
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
            className={`w-full flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-left text-xs sm:text-sm font-medium shadow-2xs transition hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
              value ? "text-foreground" : "text-muted-foreground"
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <CalendarIcon className="h-4 w-4 shrink-0 text-primary" />
              {value ? (
                <div className="flex items-center gap-2 truncate">
                  <span className="font-semibold">{formatBsDate(value, "medium")}</span>
                  <span className="hidden sm:inline text-xs text-muted-foreground font-normal">
                    ({formatBsDate(value, "devanagari")})
                  </span>
                  {isExpired && (
                    <span className="rounded bg-rose-500/15 text-rose-700 dark:text-rose-400 text-[10px] font-bold px-1.5 py-0.2">
                      Expired
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
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
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition"
                  title="Remove expiration deadline"
                  aria-label="Remove expiration deadline"
                >
                  <X className="h-3.5 w-3.5" />
                </span>
              )}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </button>
        </PopoverTrigger>

        <PopoverContent className="w-80 sm:w-96 p-4 bg-popover shadow-lg rounded-xl border" align="start">
          <div className="space-y-4">
            {/* Header: BS Year and Month Selectors */}
            <div className="flex items-center justify-between gap-2 border-b pb-3">
              {/* Year Select */}
              <div className="flex-1">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  BS Year
                </span>
                <Select
                  value={String(selectedYear)}
                  onValueChange={(val) => {
                    const y = Number(val);
                    setSelectedYear(y);
                    if (value) applyBsDate(y, selectedMonth, selectedDay);
                  }}
                >
                  <SelectTrigger className="h-8 text-xs font-bold">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {availableYears.map((yr) => (
                      <SelectItem key={yr} value={String(yr)} className="text-xs">
                        {yr} BS
                        {yr === currentBsYear ? " ★ Current" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Month Select */}
              <div className="flex-1">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  BS Month
                </span>
                <Select
                  value={String(selectedMonth)}
                  onValueChange={(val) => {
                    const m = Number(val);
                    setSelectedMonth(m);
                    if (value) applyBsDate(selectedYear, m, selectedDay);
                  }}
                >
                  <SelectTrigger className="h-8 text-xs font-bold">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {BS_MONTHS.map((mo) => (
                      <SelectItem key={mo.index} value={String(mo.index)} className="text-xs">
                        {mo.name}
                        {selectedYear === currentBsYear && mo.index === currentBsMonth ? " • Now" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Calendar Day Grid (1 to daysInMonth) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  Select BS Day ({daysInMonth} days in {BS_MONTHS[selectedMonth]?.name}):
                </span>
                <span className="text-[10px] text-primary font-bold">
                  {BS_MONTHS[selectedMonth]?.nameNp} {toDevanagariNumerals(selectedYear)}
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
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
                      className={`h-7 w-full rounded text-xs font-semibold transition flex flex-col items-center justify-center relative ${
                        isSelected
                          ? "bg-primary text-primary-foreground font-black shadow-2xs"
                          : isCurrentToday
                          ? "bg-primary/15 text-primary border border-primary/30"
                          : "hover:bg-muted text-foreground"
                      }`}
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
            <div className="pt-2 border-t space-y-1.5">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Quick BS Presets
              </span>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={setPresetToday}
                  className="h-6 text-[10px] px-2"
                >
                  Today ({currentBsDay} {BS_MONTHS[currentBsMonth]?.short})
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={setPresetOneMonth}
                  className="h-6 text-[10px] px-2"
                >
                  +1 Month BS
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={setPresetThreeMonths}
                  className="h-6 text-[10px] px-2"
                >
                  +3 Months BS
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={setPresetEndOfMonth}
                  className="h-6 text-[10px] px-2"
                >
                  Month End ({daysInMonth})
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={setPresetChaitraEnd}
                  className="h-6 text-[10px] px-2"
                >
                  Fiscal Year End (Chaitra)
                </Button>
              </div>
            </div>

            {/* Footer Status & Clear */}
            <div className="pt-2 border-t flex items-center justify-between text-[11px]">
              {value ? (
                <span className="text-muted-foreground flex items-center gap-1">
                  <Check className="h-3 w-3 text-emerald-500" />
                  <span>{formatBsDate(value, "medium")}</span>
                </span>
              ) : (
                <span className="text-muted-foreground italic">No deadline set</span>
              )}

              {value && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-6 text-[11px] text-destructive hover:bg-destructive/10 px-2"
                >
                  Clear Deadline
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

