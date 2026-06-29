import { Fragment, memo } from "react";
import { Link } from "react-router-dom";
import Eyebrow from "../../components/Eyebrow";
import GoldRule from "../../components/GoldRule";
import PerformanceChart from "../../components/PerformanceChart";
import { useSession } from "./session-context";
import SampleDataBadge from "./SampleDataBadge";
import {
  ACTIVITY,
  INCEPTION_RETURN_PCT,
  MANDATE,
  PERFORMANCE_SERIES,
  RELATIONSHIP,
  SUMMARY_TILES,
} from "./mockData";

const toneClass = {
  graph: "text-graph",
  loss: "text-loss",
  gold: "text-gold",
  neutral: "text-ghost",
} as const;

const QUICK_LINKS = [
  {
    to: "/investor/portfolio",
    label: "Portfolio",
    desc: "Holdings, allocation & performance",
  },
  {
    to: "/investor/account",
    label: "Account",
    desc: "Membership, mandate & access",
  },
] as const;

/** Glance-level mandate credentials shown as a quiet strip above the tiles. */
const MANDATE_STRIP: ReadonlyArray<{ k: string; v: string; accent?: boolean }> = [
  { k: "Mandate", v: MANDATE.name, accent: true },
  { k: "Inception", v: MANDATE.inception },
  { k: "Next review", v: MANDATE.nextReview },
  { k: "Coverage", v: RELATIONSHIP.manager },
];

/** Member dashboard — the at-a-glance overview shown after sign-in (mockup). */
const Dashboard = () => {
  const { memberId } = useSession();

  return (
    <div>
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <Eyebrow index="01">Member Dashboard</Eyebrow>
          <h1 className="mt-5 text-display text-4xl text-ghost lg:text-5xl">
            Welcome back,{" "}
            <span className="text-gold-gradient">{memberId || "Member"}</span>.
          </h1>
          <p className="mt-4 text-sm font-light leading-relaxed text-silver/60">
            Your private overview — mandate at a glance, with the latest
            performance snapshot and reporting. Figures shown are illustrative,
            to demonstrate the member experience.
          </p>
        </div>
        <SampleDataBadge className="shrink-0" />
      </header>

      <GoldRule className="my-10" />

      {/* ============ MANDATE OVERVIEW (quiet credential strip) ============ */}
      <section
        aria-label="Mandate overview"
        className="border border-gold/10 bg-midnight/40 px-6 py-4"
      >
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 font-mono text-[0.58rem] uppercase tracking-[0.18em]">
          {MANDATE_STRIP.map((item, i) => (
            <Fragment key={item.k}>
              {i > 0 && (
                <span className="h-1 w-1 rotate-45 bg-gold/40" aria-hidden />
              )}
              <span className="flex items-center gap-2.5">
                <span className="text-silver/40">{item.k}</span>
                <span className={item.accent ? "text-gold/85" : "text-silver/80"}>
                  {item.v}
                </span>
              </span>
            </Fragment>
          ))}
        </div>
      </section>

      {/* ============ SUMMARY TILES ============ */}
      <section className="mt-6" aria-label="Portfolio summary">
        <div className="grid gap-px overflow-hidden border border-gold/10 bg-gold/10 sm:grid-cols-2 lg:grid-cols-4">
          {SUMMARY_TILES.map((tile) => (
            <div
              key={tile.label}
              className="bg-midnight/60 p-6 backdrop-blur-sm transition-colors duration-500 hover:bg-midnight/90"
            >
              <div className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-gold">
                {tile.label}
              </div>
              <div
                className={`mt-4 text-display text-3xl lg:text-4xl ${
                  toneClass[tile.tone ?? "neutral"]
                }`}
              >
                {tile.value}
              </div>
              {tile.delta && (
                <div className="mt-2 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-silver/50">
                  {tile.delta}
                </div>
              )}
              <div className="mt-3 text-[0.66rem] font-light text-silver/45">
                {tile.note}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ PERFORMANCE SNAPSHOT + QUICK LINKS ============ */}
      <section className="mt-12 grid gap-6 lg:grid-cols-3" aria-label="Performance snapshot">
        <div className="relative overflow-hidden border border-gold/10 bg-midnight/40 p-6 gold-grid lg:col-span-2 lg:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-gold">
                Performance Snapshot
              </div>
              <p className="mt-2 text-xs font-light text-silver/50">
                Indexed to 100 at inception · sample series
              </p>
            </div>
            <div className="text-right">
              <div className="text-display text-2xl text-graph lg:text-3xl">
                +{INCEPTION_RETURN_PCT}%
              </div>
              <div className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-silver/45">
                Since inception
              </div>
            </div>
          </div>
          <div className="mt-6 aspect-[9/4]">
            <PerformanceChart series={PERFORMANCE_SERIES} />
          </div>
        </div>

        {/* Quick links into the rest of the member area */}
        <nav className="flex flex-col gap-4" aria-label="Member area shortcuts">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="group flex flex-1 flex-col justify-between border border-gold/10 bg-obsidian/40 p-6 transition-all duration-500 hover:-translate-y-1 hover:border-gold/30"
            >
              <div className="flex items-center justify-between">
                <span className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-gold">
                  {link.label}
                </span>
                <span
                  className="text-silver/40 transition-transform duration-500 group-hover:translate-x-1 group-hover:text-gold"
                  aria-hidden
                >
                  &rarr;
                </span>
              </div>
              <p className="mt-6 text-sm font-light leading-relaxed text-silver/65">
                {link.desc}
              </p>
            </Link>
          ))}
        </nav>
      </section>

      {/* ============ RECENT ACTIVITY / NOTICES ============ */}
      <section className="mt-12" aria-label="Recent activity">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl text-ghost">Recent activity</h2>
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-silver/40">
            Statements · notices
          </span>
        </div>
        <GoldRule className="mt-5" diamond={false} />
        <ul className="mt-2">
          {ACTIVITY.map((item) => (
            <li
              key={`${item.date}-${item.title}`}
              className="grid grid-cols-[auto_1fr] items-start gap-4 border-b border-silver/5 py-5 sm:grid-cols-[5rem_7rem_1fr] sm:gap-6"
            >
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-silver/45">
                {item.date}
              </span>
              <span className="order-last col-span-2 inline-flex w-fit items-center gap-2 border border-gold/20 px-2.5 py-0.5 text-[0.54rem] font-semibold uppercase tracking-[0.18em] text-gold sm:order-none sm:col-span-1">
                <span className="h-1 w-1 rotate-45 bg-gold" aria-hidden />
                {item.kind}
              </span>
              <span>
                <span className="block text-sm font-light text-ghost">
                  {item.title}
                </span>
                <span className="mt-1 block text-xs font-light leading-relaxed text-silver/50">
                  {item.detail}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default memo(Dashboard);
