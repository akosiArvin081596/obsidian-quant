import { memo } from "react";
import Eyebrow from "../../components/Eyebrow";
import GoldRule from "../../components/GoldRule";
import PerformanceChart from "../../components/PerformanceChart";
import SampleDataBadge from "./SampleDataBadge";
import {
  ACCOUNT_INFO,
  ALLOCATION,
  BENCHMARK_SERIES,
  HOLDINGS,
  INCEPTION_RETURN_PCT,
  PERFORMANCE_SERIES,
  PERIOD_RETURN_PCT,
  PORTFOLIO_VALUE,
} from "./mockData";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const statusTone = {
  Active: "text-graph border-graph/30",
  Scaling: "text-warm-gold border-warm-gold/30",
  Hedged: "text-silver/70 border-silver/25",
} as const;

/* ---- Donut geometry (single ring, sample allocation) ---- */
const R = 52;
const STROKE = 22;
const CIRC = 2 * Math.PI * R;

type DonutSeg = { color: string; dash: number; gap: number; offset: number };

const buildDonut = (): DonutSeg[] => {
  let acc = 0;
  return ALLOCATION.map((slice) => {
    const dash = (slice.weight / 100) * CIRC;
    const seg: DonutSeg = {
      color: slice.color,
      dash,
      gap: CIRC - dash,
      // rotate each segment to start where the previous ended
      offset: -acc,
    };
    acc += dash;
    return seg;
  });
};

/** Member portfolio — detailed allocation, performance & account view (mockup). */
const Portfolio = () => {
  const donut = buildDonut();

  return (
    <div>
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <Eyebrow index="02">Member Portfolio</Eyebrow>
          <h1 className="mt-5 text-display text-4xl text-ghost lg:text-5xl">
            Your allocation, in detail.
          </h1>
          <p className="mt-4 text-sm font-light leading-relaxed text-silver/60">
            The mandate broken down by strategy and exposure, with a sample
            performance history and account terms. All figures are illustrative,
            shown to demonstrate the reporting experience.
          </p>
        </div>
        <SampleDataBadge className="shrink-0" />
      </header>

      <GoldRule className="my-10" />

      {/* ============ SUMMARY HEADER ============ */}
      <section
        className="grid gap-px overflow-hidden border border-gold/10 bg-gold/10 sm:grid-cols-3"
        aria-label="Portfolio summary"
      >
        <div className="bg-midnight/60 p-6">
          <div className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-gold">
            Total Value
          </div>
          <div className="mt-3 text-display text-3xl text-ghost lg:text-4xl">
            {usd.format(PORTFOLIO_VALUE)}
          </div>
          <div className="mt-2 text-[0.66rem] font-light text-silver/45">
            Marked to sample close
          </div>
        </div>
        <div className="bg-midnight/60 p-6">
          <div className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-gold">
            Quarter to Date
          </div>
          <div className="mt-3 text-display text-3xl text-graph lg:text-4xl">
            +{PERIOD_RETURN_PCT}%
          </div>
          <div className="mt-2 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-silver/45">
            vs +2.1% benchmark
          </div>
        </div>
        <div className="bg-midnight/60 p-6">
          <div className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-gold">
            Since Inception
          </div>
          <div className="mt-3 text-display text-3xl text-graph lg:text-4xl">
            +{INCEPTION_RETURN_PCT}%
          </div>
          <div className="mt-2 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-silver/45">
            Indexed · net of sample fees
          </div>
        </div>
      </section>

      {/* ============ PERFORMANCE CHART ============ */}
      <section className="mt-8" aria-label="Performance history">
        <div className="relative overflow-hidden border border-gold/10 bg-midnight/40 p-6 gold-grid lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-gold">
              Performance History
            </div>
            <div className="flex items-center gap-5 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-silver/50">
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-4 bg-graph" aria-hidden />
                Mandate
              </span>
              <span className="flex items-center gap-2">
                <span
                  className="h-0.5 w-4 bg-gold"
                  style={{ opacity: 0.5 }}
                  aria-hidden
                />
                Benchmark
              </span>
            </div>
          </div>
          <div className="mt-6 h-60 sm:h-72">
            <PerformanceChart series={PERFORMANCE_SERIES} benchmark={BENCHMARK_SERIES} />
          </div>
        </div>
      </section>

      {/* ============ HOLDINGS TABLE ============ */}
      <section className="mt-12" aria-label="Holdings">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl text-ghost">Holdings & allocations</h2>
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-silver/40">
            By strategy
          </span>
        </div>
        <GoldRule className="mt-5" diamond={false} />

        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-gold/15 font-mono text-[0.56rem] uppercase tracking-[0.18em] text-silver/40">
                <th scope="col" className="py-3 pr-4 font-medium">Strategy</th>
                <th scope="col" className="py-3 pr-4 font-medium">Sleeve</th>
                <th scope="col" className="py-3 pr-4 text-right font-medium">Weight</th>
                <th scope="col" className="py-3 pr-4 text-right font-medium">Value</th>
                <th scope="col" className="py-3 pr-4 text-right font-medium">QTD</th>
                <th scope="col" className="py-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {HOLDINGS.map((h) => (
                <tr
                  key={h.strategy}
                  className="border-b border-silver/5 transition-colors duration-300 hover:bg-obsidian/40"
                >
                  <th
                    scope="row"
                    className="py-4 pr-4 text-sm font-light text-ghost"
                  >
                    {h.strategy}
                  </th>
                  <td className="py-4 pr-4 text-xs font-light text-silver/55">
                    {h.sleeve}
                  </td>
                  <td className="py-4 pr-4 text-right font-mono text-sm text-silver/80">
                    {h.weight}%
                  </td>
                  <td className="py-4 pr-4 text-right font-mono text-sm text-silver/80">
                    {usd.format(h.value)}
                  </td>
                  <td
                    className={`py-4 pr-4 text-right font-mono text-sm ${
                      h.contribution >= 0 ? "text-graph" : "text-loss"
                    }`}
                  >
                    {h.contribution >= 0 ? "+" : ""}
                    {h.contribution.toFixed(1)}%
                  </td>
                  <td className="py-4 text-right">
                    <span
                      className={`inline-block border px-2.5 py-0.5 text-[0.54rem] font-semibold uppercase tracking-[0.16em] ${statusTone[h.status]}`}
                    >
                      {h.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-silver/55">
                <td className="py-4 pr-4 text-ghost" colSpan={2}>
                  Total mandate
                </td>
                <td className="py-4 pr-4 text-right text-ghost">100%</td>
                <td className="py-4 pr-4 text-right text-ghost">
                  {usd.format(PORTFOLIO_VALUE)}
                </td>
                <td className="py-4 pr-4 text-right text-graph">+{PERIOD_RETURN_PCT}%</td>
                <td className="py-4" />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* ============ ALLOCATION BREAKDOWN ============ */}
      <section className="mt-12" aria-label="Allocation breakdown">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl text-ghost">Allocation breakdown</h2>
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-silver/40">
            % of mandate
          </span>
        </div>
        <GoldRule className="mt-5" diamond={false} />

        <div className="mt-8 grid items-center gap-10 lg:grid-cols-[auto_1fr] lg:gap-14">
          {/* Donut by strategy */}
          <div className="mx-auto flex flex-col items-center">
            <svg
              viewBox="0 0 140 140"
              className="h-44 w-44"
              role="img"
              aria-label="Allocation by strategy — sample weights"
            >
              <circle
                cx="70"
                cy="70"
                r={R}
                fill="none"
                stroke="#1d2735"
                strokeWidth={STROKE}
              />
              {donut.map((seg, i) => (
                <circle
                  key={ALLOCATION[i].label}
                  cx="70"
                  cy="70"
                  r={R}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={STROKE}
                  strokeDasharray={`${seg.dash} ${seg.gap}`}
                  strokeDashoffset={seg.offset}
                  transform="rotate(-90 70 70)"
                />
              ))}
              <text
                x="70"
                y="66"
                textAnchor="middle"
                fill="#f5f5f5"
                className="font-serif"
                fontSize="20"
              >
                5
              </text>
              <text
                x="70"
                y="82"
                textAnchor="middle"
                fill="#c9cdd3"
                fillOpacity="0.5"
                className="font-mono"
                fontSize="7"
                letterSpacing="1.5"
              >
                SLEEVES
              </text>
            </svg>
          </div>

          {/* Horizontal bars */}
          <ul className="w-full space-y-4">
            {ALLOCATION.map((slice) => (
              <li key={slice.label}>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2.5 font-light text-silver/75">
                    <span
                      className="h-2 w-2 rotate-45"
                      style={{ backgroundColor: slice.color }}
                      aria-hidden
                    />
                    {slice.label}
                  </span>
                  <span className="font-mono text-silver/60">{slice.weight}%</span>
                </div>
                <div className="mt-2 h-1.5 w-full bg-obsidian/70">
                  <div
                    className="h-full"
                    style={{ width: `${slice.weight}%`, backgroundColor: slice.color }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ============ ACCOUNT / INVESTMENT INFO ============ */}
      <section className="mt-12" aria-label="Account and investment information">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl text-ghost">Account & investment</h2>
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-silver/40">
            Mandate terms
          </span>
        </div>
        <GoldRule className="mt-5" diamond={false} />

        <dl className="mt-2 grid gap-px overflow-hidden border border-gold/10 bg-gold/10 sm:grid-cols-2 lg:grid-cols-3">
          {ACCOUNT_INFO.map((row) => (
            <div key={row.k} className="bg-midnight/50 px-6 py-5">
              <dt className="text-[0.58rem] font-medium uppercase tracking-[0.22em] text-silver/45">
                {row.k}
              </dt>
              <dd
                className={`mt-2 text-sm text-ghost ${row.mono ? "font-mono" : "font-light"}`}
              >
                {row.v}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
};

export default memo(Portfolio);
