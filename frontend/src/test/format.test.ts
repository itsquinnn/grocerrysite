import { describe, it, expect } from "vitest";
import { discountPct, deliveryEstimate } from "@/lib/format";

describe("store rules", () => {
  it("discount percent is rounded from original price", () => {
    expect(discountPct(3490, 4290)).toBe(19);
    expect(discountPct(1000, null)).toBe(0);
  });
  it("major cities get express 1–2 day delivery", () => {
    expect(deliveryEstimate("Kathmandu")).toEqual({ days: "1–2 days", express: true });
    expect(deliveryEstimate("Jumla")).toEqual({ days: "3–6 days", express: false });
  });
});
