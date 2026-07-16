import { useEffect, useRef, useState } from "react";
import {
  cachedMarketTickers,
  fetchMarketStream,
  MARKET_POLL_MS,
  type MarketStream,
  type MarketTicker,
} from "../lib/marketQuotes";

type Options = {
  /** Seed shown instantly before the first live fetch resolves. */
  seed: readonly MarketTicker[];
  /** Disable polling (e.g. reduced motion still polls; pass false to turn off). */
  enabled?: boolean;
};

/**
 * Live Market Intelligence quotes — seeds instantly, then polls Yahoo (via
 * the Vite `/api/yahoo` proxy) every ~45s. Falls back to localStorage cache
 * when a refresh fails.
 */
export const useMarketQuotes = ({ seed, enabled = true }: Options): MarketStream => {
  const [tickers, setTickers] = useState<MarketTicker[]>(() => cachedMarketTickers() ?? [...seed]);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [status, setStatus] = useState<MarketStream["status"]>(() =>
    enabled ? "loading" : "stale",
  );
  const alive = useRef(true);
  // Hold `seed` in a ref so the polling effect can read the latest value
  // without depending on it. A caller passing an unstable inline
  // `seed={[...]}` would otherwise tear down + recreate the interval and
  // AbortController on every render (a refresh storm). The lazy `useState`
  // initializer above still reads `seed` directly — that's init-only and fine.
  const seedRef = useRef(seed);
  useEffect(() => {
    seedRef.current = seed;
  }, [seed]);

  useEffect(() => {
    alive.current = true;
    // Disabled → status is already seeded to "stale" in useState, so just bail.
    // (Setting state here would trip react-hooks/set-state-in-effect on React 19.)
    if (!enabled) return;

    let timer = 0;
    // Each refresh runs under its own controller and aborts the previous
    // in-flight one, so overlapping interval + visibility refreshes can't
    // resolve out of order: a superseded fetch aborts out and its
    // `signal.aborted` guard bails before applying state, so only the latest
    // refresh ever wins. (`fetchMarketStream` uses `Promise.allSettled`, so an
    // aborted refresh can still *resolve* with a partial result — hence the
    // guard on the success path too, not just the catch.)
    let activeController: AbortController | null = null;

    const refresh = async (isInitial: boolean) => {
      activeController?.abort();
      const controller = new AbortController();
      activeController = controller;
      if (!isInitial) setStatus((prev) => (prev === "live" ? "live" : "loading"));
      try {
        const next = await fetchMarketStream(controller.signal);
        if (!alive.current || controller.signal.aborted) return;
        setTickers(next);
        setUpdatedAt(Date.now());
        setStatus("live");
      } catch {
        if (!alive.current || controller.signal.aborted) return;
        const cache = cachedMarketTickers();
        if (cache) {
          setTickers(cache);
          setStatus("stale");
        } else {
          setTickers([...seedRef.current]);
          setStatus("error");
        }
      }
    };

    void refresh(true);
    timer = window.setInterval(() => void refresh(false), MARKET_POLL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") void refresh(false);
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      alive.current = false;
      activeController?.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled]);

  return { tickers, updatedAt, status };
};
