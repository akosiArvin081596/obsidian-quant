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
  const [status, setStatus] = useState<MarketStream["status"]>("loading");
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    if (!enabled) {
      setStatus("stale");
      return;
    }

    let timer = 0;
    const controller = new AbortController();

    const refresh = async (isInitial: boolean) => {
      if (!isInitial) setStatus((prev) => (prev === "live" ? "live" : "loading"));
      try {
        const next = await fetchMarketStream(controller.signal);
        if (!alive.current) return;
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
          setTickers([...seed]);
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
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, seed]);

  return { tickers, updatedAt, status };
};
