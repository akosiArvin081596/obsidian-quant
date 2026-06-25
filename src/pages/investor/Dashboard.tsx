import { memo } from "react";
import ComingSoon from "./ComingSoon";

const TILES = [
  { label: "Allocation Overview", note: "Mandate summary" },
  { label: "Risk Posture", note: "Live drawdown protocols" },
  { label: "Recent Statements", note: "Periodic reporting" },
] as const;

/** Member dashboard — placeholder stub (Phase 2 destination). */
const Dashboard = () => (
  <ComingSoon
    eyebrow="Member Dashboard"
    index="01"
    title="Your private overview."
    body="The dashboard will surface your mandate at a glance — allocation, risk posture, and the latest reporting — drawn live from the operational system. We're building it now."
    preview={
      <div className="grid gap-4 sm:grid-cols-3">
        {TILES.map((tile) => (
          <div
            key={tile.label}
            className="border border-silver/10 bg-obsidian/40 p-5"
          >
            <div className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-gold">
              {tile.label}
            </div>
            <div className="mt-4 text-display text-3xl text-silver/25" aria-hidden>
              ——
            </div>
            <div className="mt-3 text-[0.66rem] font-light text-silver/45">
              {tile.note}
            </div>
          </div>
        ))}
      </div>
    }
  />
);

export default memo(Dashboard);
