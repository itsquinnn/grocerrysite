export const formatNPR = (n: number | string | null | undefined) =>
  "Rs. " + Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

export const discountPct = (price: number, compare?: number | null) =>
  compare && compare > price ? Math.round(((compare - price) / compare) * 100) : 0;

export const statusLabel = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const TRACK_STEPS = ["pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered"] as const;

export const NEPAL_PROVINCES = [
  "Koshi", "Madhesh", "Bagmati", "Gandaki", "Lumbini", "Karnali", "Sudurpashchim",
];

// Districts with express (2-day) delivery coverage
export const EXPRESS_DISTRICTS = ["kathmandu", "lalitpur", "bhaktapur", "kaski", "chitwan", "morang", "rupandehi", "sunsari", "parsa"];

export function deliveryEstimate(district: string) {
  const d = district.trim().toLowerCase();
  if (!d) return null;
  if (EXPRESS_DISTRICTS.includes(d)) return { days: "1–2 days", express: true };
  return { days: "3–6 days", express: false };
}
