import NepaliDate from "nepali-date-converter";

export interface BsMonthInfo {
  index: number; // 0 to 11
  name: string; // e.g. "Baisakh"
  nameNp: string; // e.g. "बैशाख"
  short: string; // e.g. "Bai"
  shortNp: string; // e.g. "बै"
  quarter: number; // 1, 2, 3, or 4
}

export const BS_MONTHS: BsMonthInfo[] = [
  { index: 0, name: "Baisakh", nameNp: "बैशाख", short: "Bai", shortNp: "बै", quarter: 1 },
  { index: 1, name: "Jestha", nameNp: "जेठ", short: "Jes", shortNp: "जे", quarter: 1 },
  { index: 2, name: "Ashadh", nameNp: "असार", short: "Ash", shortNp: "अ", quarter: 1 },
  { index: 3, name: "Shrawan", nameNp: "साउन", short: "Shr", shortNp: "सा", quarter: 2 },
  { index: 4, name: "Bhadra", nameNp: "भदौ", short: "Bha", shortNp: "भ", quarter: 2 },
  { index: 5, name: "Ashwin", nameNp: "असोज", short: "Asw", shortNp: "अ", quarter: 2 },
  { index: 6, name: "Kartik", nameNp: "कात्तिक", short: "Kar", shortNp: "का", quarter: 3 },
  { index: 7, name: "Mangsir", nameNp: "मंसिर", short: "Man", shortNp: "मं", quarter: 3 },
  { index: 8, name: "Poush", nameNp: "पुस", short: "Pou", shortNp: "पु", quarter: 3 },
  { index: 9, name: "Magh", nameNp: "माघ", short: "Mag", shortNp: "मा", quarter: 4 },
  { index: 10, name: "Falgun", nameNp: "फागुन", short: "Fal", shortNp: "फा", quarter: 4 },
  { index: 11, name: "Chaitra", nameNp: "चैत", short: "Cha", shortNp: "चै", quarter: 4 },
];

const DEVANAGARI_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

export function toDevanagariNumerals(num: number | string): string {
  return String(num).replace(/[0-9]/g, (d) => DEVANAGARI_DIGITS[Number(d)] ?? d);
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
        return `${bs.date} ${month.name} ${bs.year} BS`;
      case "long":
        return `${nd.format("ddd")}, ${bs.date} ${month.name} ${bs.year} BS`;
      case "devanagari":
        return `${toDevanagariNumerals(bs.date)} ${month.nameNp} ${toDevanagariNumerals(bs.year)} वि.सं.`;
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
 * Format BS Year string, e.g. "२०८३ वि.सं. (2083 BS)"
 */
export function formatBsYearLabel(bsYear: number): string {
  return `${bsYear} BS (${toDevanagariNumerals(bsYear)} वि.सं.)`;
}

export { NepaliDate };
