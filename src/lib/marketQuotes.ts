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

type QuoteError = Error & { status?: number };

const CACHE_KEY = "oq:market-quotes:v1";
const RATE_LIMIT_KEY = "oq:yahoo-429-until";
const POLL_MS = 60_000;
/** Space symbol requests so Yahoo doesn't 429 a 4-wide burst. */
const STAGGER_MS = 500;
/** Cool off after a 429 before hitting Yahoo again (survives reloads via sessionStorage). */
const RATE_LIMIT_COOLDOWN_MS = 5 * 60_000;
/** Skip a network refresh when cache is newer than this. */
const FRESH_CACHE_MS = 2 * 60_000;

let rateLimitedUntil = 0;
let inflight: Promise<MarketTicker[]> | null = null;

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
  // Trailing slash before `?` matches Next `trailingSlash: true` so the browser
  // doesn't 308-redirect and double-hit Yahoo.
  return `/api/yahoo/v8/finance/chart/${encoded}/?range=5d&interval=1d`;
};

const delay = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(() => resolve(), ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });

const readRateLimitedUntil = (): number => {
  if (rateLimitedUntil > Date.now()) return rateLimitedUntil;
  try {
    if (typeof sessionStorage === "undefined") return 0;
    const raw = sessionStorage.getItem(RATE_LIMIT_KEY);
    const until = raw ? Number(raw) : 0;
    if (Number.isFinite(until) && until > Date.now()) {
      rateLimitedUntil = until;
      return until;
    }
  } catch {
    /* private mode */
  }
  return 0;
};

const markRateLimited = () => {
  rateLimitedUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(RATE_LIMIT_KEY, String(rateLimitedUntil));
    }
  } catch {
    /* private mode */
  }
};

/** True while Yahoo has recently 429'd us — skip network entirely. */
export const isRateLimited = () => readRateLimitedUntil() > Date.now();

export const parseYahooChart = (
  data: YahooChartPayload,
  label: string,
  digits: number,
): MarketTicker | null => {
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

export const readCache = (): MarketTicker[] | null => {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { tickers?: MarketTicker[]; savedAt?: number };
    if (!Array.isArray(parsed.tickers) || parsed.tickers.length === 0) return null;
    return parsed.tickers;
  } catch {
    return null;
  }
};

export const readCacheMeta = (): { tickers: MarketTicker[]; savedAt: number } | null => {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { tickers?: MarketTicker[]; savedAt?: number };
    if (!Array.isArray(parsed.tickers) || parsed.tickers.length === 0) return null;
    if (typeof parsed.savedAt !== "number") return null;
    return { tickers: parsed.tickers, savedAt: parsed.savedAt };
  } catch {
    return null;
  }
};

export const writeCache = (tickers: MarketTicker[]) => {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(CACHE_KEY, JSON.stringify({ tickers, savedAt: Date.now() }));
  } catch {
    /* ignore quota / private mode */
  }
};

/** Fetch one symbol through the nginx/Yahoo proxy (`/api/yahoo`). */
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
  if (!res.ok) {
    const err: QuoteError = new Error(`Quote failed for ${label} (${res.status})`);
    err.status = res.status;
    throw err;
  }
  const data = (await res.json()) as YahooChartPayload;
  const ticker = parseYahooChart(data, label, digits);
  if (!ticker) throw new Error(`Malformed quote for ${label}`);
  return ticker;
};

const isAbortError = (err: unknown) =>
  err instanceof DOMException && err.name === "AbortError";

const fetchMarketStreamInner = async (signal?: AbortSignal): Promise<MarketTicker[]> => {
  if (isRateLimited()) {
    const cached = readCache();
    if (cached) return cached;
    throw new Error("Yahoo rate limited; no cache available.");
  }

  const lastGood = new Map((readCache() ?? []).map((ticker) => [ticker.symbol, ticker]));
  const tickers: MarketTicker[] = [];

  for (let i = 0; i < MARKET_SYMBOLS.length; i++) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    if (i > 0) await delay(STAGGER_MS, signal);

    const { label, yahoo, digits } = MARKET_SYMBOLS[i];
    try {
      tickers.push(await fetchYahooTicker(label, yahoo, digits, signal));
    } catch (err) {
      if (isAbortError(err)) throw err;
      const status = (err as QuoteError).status;
      if (status === 429) {
        markRateLimited();
        // Keep whatever we already got + fill the rest from cache.
        for (let j = i; j < MARKET_SYMBOLS.length; j++) {
          const cached = lastGood.get(MARKET_SYMBOLS[j].label);
          if (cached && !tickers.some((t) => t.symbol === cached.symbol)) {
            tickers.push(cached);
          }
        }
        break;
      }
      const cached = lastGood.get(label);
      if (cached) tickers.push(cached);
    }
  }

  if (tickers.length === 0) {
    throw new Error("Market stream refresh failed for all symbols.");
  }

  writeCache(tickers);
  return tickers;
};

/**
 * Refresh Market Intelligence quotes.
 * - Sequential + staggered (avoids Yahoo 429 bursts)
 * - Single-flight (React Strict Mode / rapid remounts share one refresh)
 * - Serves cache during a post-429 cooldown (persisted across reloads)
 *
 * The shared in-flight refresh is not abortable (aborting would cancel work for
 * other callers). Callers that unmount should ignore the resolved result.
 */
export const fetchMarketStream = async (signal?: AbortSignal): Promise<MarketTicker[]> => {
  if (!inflight) {
    inflight = fetchMarketStreamInner().finally(() => {
      inflight = null;
    });
  }
  const tickers = await inflight;
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  return tickers;
};

/** True when localStorage quotes are fresh enough to skip an immediate network hit. */
export const hasFreshCache = (withinMs = FRESH_CACHE_MS) => {
  const meta = readCacheMeta();
  return !!meta && Date.now() - meta.savedAt < withinMs;
};

export const cachedMarketTickers = () => readCache();

export const MARKET_POLL_MS = POLL_MS;
