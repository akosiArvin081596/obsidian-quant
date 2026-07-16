/** Live market quote shape used by the Market Intelligence panel. */
export type MarketTicker = {
  symbol: string;
  value: string;
  change: string;
  up: boolean;
};

export type MarketStream = {
  tickers: MarketTicker[];
  /** Epoch ms of the last successful refresh. */
  updatedAt: number | null;
  status: "live" | "loading" | "stale" | "error";
};

/** Display labels → Yahoo Finance chart symbols. */
export const MARKET_SYMBOLS = [
  { label: "VIX", yahoo: "^VIX", digits: 2 },
  { label: "SPX", yahoo: "^GSPC", digits: 2 },
  { label: "NDX", yahoo: "^NDX", digits: 2 },
  { label: "DXY", yahoo: "DX-Y.NYB", digits: 2 },
] as const;

type YahooChartPayload = {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        chartPreviousClose?: number;
        previousClose?: number;
        regularMarketTime?: number;
      };
    }>;
    error?: unknown;
  };
};

const CACHE_KEY = "oq:market-quotes:v1";
const POLL_MS = 45_000;

export const formatPrice = (n: number, digits = 2) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

export const formatChangePct = (pct: number) => {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
};

export const changePct = (price: number, previous: number) => {
  if (!Number.isFinite(price) || !Number.isFinite(previous) || previous === 0) {
    return 0;
  }
  return ((price - previous) / previous) * 100;
};

const yahooChartUrl = (symbol: string) => {
  const encoded = encodeURIComponent(symbol);
  return `/api/yahoo/v8/finance/chart/${encoded}?range=5d&interval=1d`;
};

const parseYahooChart = (data: YahooChartPayload, label: string, digits: number): MarketTicker | null => {
  const meta = data.chart?.result?.[0]?.meta;
  const price = meta?.regularMarketPrice;
  const previous = meta?.chartPreviousClose ?? meta?.previousClose;
  if (typeof price !== "number" || typeof previous !== "number") return null;

  const pct = changePct(price, previous);
  return {
    symbol: label,
    value: formatPrice(price, digits),
    change: formatChangePct(pct),
    up: pct >= 0,
  };
};

const readCache = (): MarketTicker[] | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { tickers?: MarketTicker[]; savedAt?: number };
    if (!Array.isArray(parsed.tickers) || parsed.tickers.length === 0) return null;
    return parsed.tickers;
  } catch {
    return null;
  }
};

const writeCache = (tickers: MarketTicker[]) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ tickers, savedAt: Date.now() }));
  } catch {
    /* ignore quota / private mode */
  }
};

/** Fetch one symbol through the Vite/Yahoo proxy. */
export const fetchYahooTicker = async (
  label: string,
  yahoo: string,
  digits: number,
  signal?: AbortSignal,
): Promise<MarketTicker> => {
  const res = await fetch(yahooChartUrl(yahoo), {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Quote failed for ${label} (${res.status})`);
  const data = (await res.json()) as YahooChartPayload;
  const ticker = parseYahooChart(data, label, digits);
  if (!ticker) throw new Error(`Malformed quote for ${label}`);
  return ticker;
};

/** Parallel refresh of the Market Intelligence stream. */
export const fetchMarketStream = async (signal?: AbortSignal): Promise<MarketTicker[]> => {
  const settled = await Promise.allSettled(
    MARKET_SYMBOLS.map(({ label, yahoo, digits }) => fetchYahooTicker(label, yahoo, digits, signal)),
  );

  // Only a total wipe-out is fatal. A single flaky symbol (DXY on Yahoo is a
  // frequent offender) must not blank the whole panel — let the caller fall
  // back to cache/seed and surface stale/error only when everything failed.
  if (settled.every((result) => result.status === "rejected")) {
    throw new Error("Market stream refresh failed for all symbols.");
  }

  // For any symbol that failed, keep its last-good value from the cache.
  const lastGood = new Map((readCache() ?? []).map((ticker) => [ticker.symbol, ticker]));

  const tickers = settled
    .map((result, i) =>
      result.status === "fulfilled"
        ? result.value
        : lastGood.get(MARKET_SYMBOLS[i].label) ?? null,
    )
    .filter((ticker): ticker is MarketTicker => ticker !== null);

  writeCache(tickers);
  return tickers;
};

export const cachedMarketTickers = () => readCache();

export const MARKET_POLL_MS = POLL_MS;
