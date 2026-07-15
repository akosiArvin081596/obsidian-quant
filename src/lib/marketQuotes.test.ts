import { describe, expect, it } from "vitest";
import { changePct, formatChangePct, formatPrice } from "./marketQuotes";

describe("marketQuotes formatters", () => {
  it("formats prices with grouping", () => {
    expect(formatPrice(5127.78)).toBe("5,127.78");
    expect(formatPrice(16.2)).toBe("16.20");
  });

  it("formats signed percent changes", () => {
    expect(formatChangePct(0.41)).toBe("+0.41%");
    expect(formatChangePct(-1.35)).toBe("-1.35%");
    expect(formatChangePct(0)).toBe("+0.00%");
  });

  it("computes day change percent from price and previous close", () => {
    expect(changePct(105, 100)).toBeCloseTo(5);
    expect(changePct(99, 100)).toBeCloseTo(-1);
    expect(changePct(100, 0)).toBe(0);
  });
});
