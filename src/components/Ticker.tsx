import { cn } from "../lib/cn";

type Metric = { label: string; value: string; up?: boolean };

const DEFAULT: Metric[] = [
  { label: "Net Sharpe", value: "2.41", up: true },
  { label: "Annualised", value: "+19.8%", up: true },
  { label: "Max Drawdown", value: "−4.1%" },
  { label: "Tail Hedge", value: "Active", up: true },
  { label: "Execution Latency", value: "38µs" },
  { label: "Markets Tracked", value: "11,400+" },
  { label: "Signal Coverage", value: "24 / 6" },
  { label: "Capacity", value: "Limited" },
];

/**
 * A thin scrolling metrics tape — the live, terminal-grade finance signal.
 * Figures are illustrative of the systematic mandate.
 */
const Ticker = ({
  items = DEFAULT,
  className,
}: {
  items?: Metric[];
  className?: string;
}) => {
  const row = [...items, ...items];
  return (
    <div
      className={cn(
        "relative flex overflow-hidden border-y border-gold/10 bg-midnight/40 py-3",
        className,
      )}
      style={{
        WebkitMaskImage:
          "linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)",
        maskImage:
          "linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)",
      }}
    >
      <div className="animate-marquee flex shrink-0 items-center gap-10 whitespace-nowrap pr-10">
        {row.map((m, i) => (
          <span key={i} className="flex items-center gap-3 text-xs">
            <span className="uppercase tracking-[0.2em] text-silver/45">
              {m.label}
            </span>
            <span
              className={cn(
                "font-mono font-medium",
                m.up ? "text-graph" : "text-ghost",
              )}
            >
              {m.value}
            </span>
            <span className="h-1 w-1 rotate-45 bg-gold/40" aria-hidden />
          </span>
        ))}
      </div>
    </div>
  );
};

export default Ticker;
