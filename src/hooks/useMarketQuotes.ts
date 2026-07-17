import { useEffect, useRef, useState } from "react";
import {
  cachedMarketTickers,
  fetchMarketStream,
  hasFreshCache,
  isRateLimited,
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
 * Live Market Intelligence quotes — seeds identically on server + client
 * (hydration-safe), then polls Yahoo via `/api/yahoo` every ~60s. Falls back
 * to localStorage / seed when rate-limited or refresh fails.
 */
export const useMarketQuotes = ({ seed, enabled = true }: Options): MarketStream => {
  // Always seed first — never read localStorage during render/init (SSR mismatch).
  const [tickers, setTickers] = useState<MarketTicker[]>(() => [...seed]);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [status, setStatus] = useState<MarketStream["status"]>(() =>
    enabled ? "loading" : "stale",
  );
  const alive = useRef(true);
  const seedRef = useRef(seed);
  useEffect(() => {
    seedRef.current = seed;
  }, [seed]);

  useEffect(() => {
    alive.current = true;
    if (!enabled) return;

    let timer = 0;
    let activeController: AbortController | null = null;

    const applyFallback = () => {
      const cache = cachedMarketTickers();
      if (cache) {
        setTickers(cache);
        setStatus("stale");
      } else {
        setTickers([...seedRef.current]);
        setStatus(isRateLimited() ? "stale" : "error");
      }
    };

    const refresh = async (isInitial: boolean) => {
      // Don't poke Yahoo while we're still in a 429 cooldown (persisted).
      if (isRateLimited()) {
        if (alive.current) applyFallback();
        return;
      }

      // Skip network when cache is still fresh — but only on mount (its job is
      // surviving HMR / remounts). Mid-session ticks must fall through to a
      // real refresh: FRESH_CACHE_MS exceeds the poll interval, so gating every
      // tick here would flap the badge live→stale on alternating polls.
      if (isInitial && hasFreshCache()) {
        const cache = cachedMarketTickers();
        if (cache && alive.current) {
          setTickers(cache);
          setStatus("stale");
        }
        return;
      }

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
        applyFallback();
      }
    };

    void refresh(true);
    timer = window.setInterval(() => {
      // Hidden tabs skip the poll; the visibilitychange handler catches up.
      if (document.hidden) return;
      void refresh(false);
    }, MARKET_POLL_MS);

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
