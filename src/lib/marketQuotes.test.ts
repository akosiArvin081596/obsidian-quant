import { afterEach, describe, expect, it, vi } from "vitest";
import { changePct, fetchMarketStream, formatChangePct, formatPrice } from "./marketQuotes";

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

describe("fetchMarketStream partial failure", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const chartResponse = () =>
    new Response(
      JSON.stringify({
        chart: { result: [{ meta: { regularMarketPrice: 100, chartPreviousClose: 99 } }] },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );

  // One flaky symbol (DXY / DX-Y.NYB) must not blank the whole stream: the
  // symbols that resolved still render, and the call does not reject/error.
  it("renders the symbols that resolve when one symbol fails", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("DX-Y.NYB")) {
        return Promise.resolve(new Response("upstream error", { status: 500 }));
      }
      return Promise.resolve(chartResponse());
    });
    vi.stubGlobal("fetch", fetchMock);

    const stream = await fetchMarketStream();
    const symbols = stream.map((ticker) => ticker.symbol);

    expect(symbols).toEqual(expect.arrayContaining(["VIX", "SPX", "NDX"]));
    expect(symbols).not.toContain("DXY");
    expect(stream).toHaveLength(3);
  });
});
