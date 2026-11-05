import NepaliDate from "nepali-date-converter";

export interface BsMonthInfo {
  index: number; // 0 to 11
  name: string; // e.g. "Baisakh"
  short: string; // e.g. "Bai"
  quarter: number; // 1, 2, 3, or 4
}

export const BS_MONTHS: BsMonthInfo[] = [
  { index: 0, name: "Baisakh", short: "Bai", quarter: 1 },
  { index: 1, name: "Jestha", short: "Jes", quarter: 1 },
  { index: 2, name: "Ashadh", short: "Ash", quarter: 1 },
  { index: 3, name: "Shrawan", short: "Shr", quarter: 2 },
  { index: 4, name: "Bhadra", short: "Bha", quarter: 2 },
  { index: 5, name: "Ashwin", short: "Asw", quarter: 2 },
  { index: 6, name: "Kartik", short: "Kar", quarter: 3 },
  { index: 7, name: "Mangsir", short: "Man", quarter: 3 },
  { index: 8, name: "Poush", short: "Pou", quarter: 3 },
  { index: 9, name: "Magh", short: "Mag", quarter: 4 },
  { index: 10, name: "Falgun", short: "Fal", quarter: 4 },
  { index: 11, name: "Chaitra", short: "Cha", quarter: 4 },
];

export function toDevanagariNumerals(num: number | string): string {
  return String(num);
}

/**
 * Returns a NepaliDate object from AD Date, ISO string, or now.
 */
export function getNepaliDate(date?: Date | string | null): NepaliDate {
  if (!date) return new NepaliDate();
  try {
    const jsDate = typeof date === "string" ? new Date(date) : date;
    if (isNaN(jsDate.getTime())) return new NepaliDate();
    return new NepaliDate(jsDate);
  } catch {
    return new NepaliDate();
  }
}

/**
 * Returns current Bikram Sambat year (e.g. 2083)
 */
export function getCurrentBsYear(): number {
  return new NepaliDate().getYear();
}

/**
 * Returns current Bikram Sambat month (0 to 11)
 */
export function getCurrentBsMonth(): number {
  return new NepaliDate().getMonth();
}

/**
 * Returns current Bikram Sambat date of the month (1 to 32)
 */
export function getCurrentBsDay(): number {
  return new NepaliDate().getDate();
}

/**
 * Convert Bikram Sambat date components (year, month 0-11, day) to JavaScript Date (AD)
 */
export function bsToAd(year: number, month: number, day: number = 1): Date {
  const nd = new NepaliDate(year, month, day);
  return nd.toJsDate();
}

/**
 * Parse a BS date string (e.g. "2083-07-18" or "2083/07/18") into an AD Date.
 */
export function bsStringToAd(bsStr: string): Date | null {
  if (!bsStr || typeof bsStr !== "string") return null;
  const parts = bsStr.trim().split(/[-/]/);
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1; // 0-indexed month
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d) || y < 2000 || y > 2150 || m < 0 || m > 11 || d < 1 || d > 32) {
    return null;
  }
  try {
    const nd = new NepaliDate(y, m, d);
    return nd.toJsDate();
  } catch {
    return null;
  }
}

/**
 * Format an AD date into Bikram Sambat representation
 */
export function formatBsDate(
  date: Date | string | null | undefined,
  style: "iso" | "short" | "medium" | "long" | "devanagari" = "medium"
): string {
  if (!date) return "—";
  try {
    const nd = getNepaliDate(date);
    const bs = nd.getBS();
    const month = BS_MONTHS[bs.month] || BS_MONTHS[0];

    switch (style) {
      case "iso": {
        const mStr = String(bs.month + 1).padStart(2, "0");
        const dStr = String(bs.date).padStart(2, "0");
        return `${bs.year}-${mStr}-${dStr}`;
      }
      case "short":
        return `${bs.date} ${month.short}, ${bs.year} BS`;
      case "medium":
      case "long":
      case "devanagari":
      default:
        return `${bs.date} ${month.name} ${bs.year} BS`;
    }
  } catch {
    return "—";
  }
}

/**
 * Get total number of days in a given BS month of a BS year.
 */
export function getDaysInBsMonth(year: number, month: number): number {
  for (let day = 32; day >= 28; day--) {
    try {
      const nd = new NepaliDate(year, month, day);
      if (nd.getMonth() === month && nd.getYear() === year) {
        return day;
      }
    } catch {}
  }
  return 30;
}

/**
 * Format BS Year string, e.g. "2083 BS"
 */
export function formatBsYearLabel(bsYear: number): string {
  return `${bsYear} BS`;
}

export { NepaliDate };
