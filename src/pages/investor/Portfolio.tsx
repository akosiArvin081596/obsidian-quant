import { memo } from "react";
import ComingSoon from "./ComingSoon";

const ROWS = [
  "Systematic Equities",
  "Rates & Macro",
  "Digital Assets",
  "Volatility & Tail",
] as const;

/** Member portfolio — placeholder stub (Phase 2 destination). */
const Portfolio = () => (
  <ComingSoon
    eyebrow="Member Portfolio"
    index="02"
    title="Your allocation, in detail."
    body="The portfolio view will break your mandate down by strategy and exposure, with risk-aware reporting across every node. The full breakdown arrives in the next phase."
    preview={
      <div className="overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-gold/10 pb-3 font-mono text-[0.58rem] uppercase tracking-[0.18em] text-silver/40">
          <span>Strategy</span>
          <span className="text-right">Weight</span>
          <span className="text-right">Status</span>
        </div>
        <ul>
          {ROWS.map((row) => (
            <li
              key={row}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-silver/5 py-4"
            >
              <span className="text-sm font-light text-silver/75">{row}</span>
              <span className="text-right text-display text-lg text-silver/25" aria-hidden>
                ——
              </span>
              <span className="text-right font-mono text-[0.58rem] uppercase tracking-[0.16em] text-silver/35">
                Pending
              </span>
            </li>
          ))}
        </ul>
      </div>
    }
  />
);

export default memo(Portfolio);
