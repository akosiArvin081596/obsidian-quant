import { afterEach, describe, expect, it, vi } from "vitest";
import {
  changePct,
  fetchMarketStream,
  formatChangePct,
  formatPrice,
  parseYahooChart,
  readCache,
  writeCache,
  type MarketTicker,
} from "./marketQuotes";

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

describe("parseYahooChart", () => {
  it("parses a well-formed chart payload", () => {
    const ticker = parseYahooChart(
      { chart: { result: [{ meta: { regularMarketPrice: 100, chartPreviousClose: 99 } }] } },
      "VIX",
      2,
    );
    expect(ticker).toEqual({ symbol: "VIX", value: "100.00", change: "+1.01%", up: true });
  });

  it("returns null when meta or regularMarketPrice is missing", () => {
    // Result present but no `meta`.
    expect(parseYahooChart({ chart: { result: [{}] } }, "VIX", 2)).toBeNull();
    // `meta` present but no `regularMarketPrice`.
    expect(
      parseYahooChart({ chart: { result: [{ meta: { chartPreviousClose: 99 } }] } }, "VIX", 2),
    ).toBeNull();
    // Empty payload — no `chart` at all.
    expect(parseYahooChart({}, "VIX", 2)).toBeNull();
  });

  it("resolves the chartPreviousClose ?? previousClose fallback", () => {
    // `chartPreviousClose` absent → falls back to `previousClose` (100).
    expect(
      parseYahooChart(
        { chart: { result: [{ meta: { regularMarketPrice: 105, previousClose: 100 } }] } },
        "SPX",
        2,
      ),
    ).toMatchObject({ change: "+5.00%", up: true });

    // Both present → `chartPreviousClose` (100) wins over `previousClose` (50);
    // had the fallback leaked, the change would read "+110.00%".
    expect(
      parseYahooChart(
        {
          chart: {
            result: [
              { meta: { regularMarketPrice: 105, chartPreviousClose: 100, previousClose: 50 } },
            ],
          },
        },
        "SPX",
        2,
      ),
    ).toMatchObject({ change: "+5.00%" });
  });
});

describe("market quote cache round-trip", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // vitest runs in the default `node` environment (no DOM), so provide a
  // minimal in-memory localStorage for the cache helpers to hit.
  const memoryStorage = () => {
    const store = new Map<string, string>();
    return {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    };
  };

  it("preserves tickers through a writeCache → readCache round-trip", () => {
    vi.stubGlobal("localStorage", memoryStorage());

    const tickers: MarketTicker[] = [
      { symbol: "VIX", value: "16.20", change: "+0.41%", up: true },
      { symbol: "SPX", value: "5,127.78", change: "-1.35%", up: false },
    ];

    writeCache(tickers);
    expect(readCache()).toEqual(tickers);
  });

  // An empty array is TRUTHY, and every caller gates on `if (cached)`. A cache
  // entry holding zero tickers would therefore be served as though it were a
  // live stream — during a 429 cooldown the panel would render nothing at all
  // while reporting itself current, instead of falling through to the error
  // state. `null` is the only value that reaches the callers as "no cache".
  it("treats an empty cached array as no cache at all", () => {
    vi.stubGlobal("localStorage", memoryStorage());

    writeCache([]);
    expect(readCache()).toBeNull();
  });
});
