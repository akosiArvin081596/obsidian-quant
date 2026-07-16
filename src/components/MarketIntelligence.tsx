import { motion, useReducedMotion } from "framer-motion";
import { HERO } from "../content/site";
import { useMarketQuotes } from "../hooks/useMarketQuotes";
import { cn } from "../lib/cn";

const statusLabel = (status: "live" | "loading" | "stale" | "error", updatedAt: number | null) => {
  if (status === "live" && updatedAt) {
    const time = new Date(updatedAt).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    return `Live · ${time}`;
  }
  if (status === "loading") return "Syncing streams…";
  if (status === "stale") return "Last known quotes";
  if (status === "error") return "Feeds unavailable";
  return HERO.market.subtitle;
};

/** Hero-side Market Intelligence panel — live Yahoo quotes via /api/yahoo. */
const MarketIntelligence = () => {
  const reduce = useReducedMotion();
  const { tickers, updatedAt, status } = useMarketQuotes({
    seed: HERO.market.tickers,
  });

  return (
    <motion.aside
      className="hero-market scene-content relative z-20 hidden lg:block"
      aria-label="Market intelligence snapshot"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: reduce ? 0 : 0.9 }}
    >
      <hr />
      <h4>{HERO.market.title}</h4>
      <small className="hero-market-status" aria-live="polite">
        <i
          className={cn(
            "hero-market-dot",
            status === "live" && "is-live",
            status === "loading" && "is-loading",
            status === "stale" && "is-stale",
            status === "error" && "is-error",
          )}
          aria-hidden
        />
        {statusLabel(status, updatedAt)}
      </small>
      {tickers.map((ticker) => (
        <p key={ticker.symbol}>
          <b>
            {ticker.symbol}
            <br />
            {ticker.value}
          </b>
          <span className={ticker.up ? "text-graph" : "text-loss"}>{ticker.change}</span>
        </p>
      ))}
    </motion.aside>
  );
};

export default MarketIntelligence;
