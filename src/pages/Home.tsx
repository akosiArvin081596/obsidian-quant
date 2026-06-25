import { memo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import Section from "../components/Section";
import Eyebrow from "../components/Eyebrow";
import Button from "../components/Button";
import GoldRule from "../components/GoldRule";
import AuroraRibbon from "../components/AuroraRibbon";
import ForgedHeadline from "../components/ForgedHeadline";
import { Stagger, StaggerItem } from "../components/Stagger";
import { EASE_LUX } from "../lib/motion";
import { BRAND, ESSENCE, POSITIONING, ARCHITECTURE } from "../content/site";

const Home = () => {
  // Hero entrance begins as the forge curtain lifts; beats hang off this.
  const HERO_T = 2.4;
  const beat = (t: number) => ({
    initial: { opacity: 0, y: 22, filter: "blur(6px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { delay: HERO_T + t, duration: 0.9, ease: EASE_LUX },
  });

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-28 hex-bg gold-grid">
        <AuroraRibbon intensity={0.85} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-obsidian/50 via-transparent to-obsidian" />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <motion.div className="flex justify-center" {...beat(0)}>
            <span className="inline-flex items-center gap-2 border border-gold/25 bg-midnight/50 px-4 py-1.5 text-[0.6rem] uppercase tracking-[0.28em] text-gold backdrop-blur-sm">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-graph" />
              {BRAND.badge}
            </span>
          </motion.div>

          <ForgedHeadline className="mt-8" delay={HERO_T + 0.5} />

          <motion.p
            className="mx-auto mt-6 max-w-2xl font-serif text-xl font-light italic text-silver/80 md:text-2xl"
            {...beat(1.2)}
          >
            “{BRAND.slogan}”
          </motion.p>

          <motion.div {...beat(1.6)}>
            <GoldRule className="mx-auto my-8 w-28" />
          </motion.div>

          <motion.p
            className="mx-auto max-w-xl text-sm font-light leading-relaxed tracking-wide text-silver/60"
            {...beat(1.95)}
          >
            {BRAND.intro}
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            {...beat(2.3)}
          >
            <Button to="/strategy" variant="primary">
              Explore Strategy
            </Button>
            <Button to="/contact" variant="ghost">
              Request Access
            </Button>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: HERO_T + 2.8, duration: 1.2 }}
        >
          <div className="h-20 w-px bg-gradient-to-b from-gold/50 to-transparent" />
        </motion.div>
      </section>

      {/* Mandate strip — a quiet institutional credential line (no ticker). */}
      <div className="border-y border-gold/10 bg-midnight/30 px-6 py-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-7 gap-y-2 text-center text-[0.6rem] uppercase tracking-[0.26em] text-silver/45">
          <span>Established {BRAND.established}</span>
          <span className="h-1 w-1 rotate-45 bg-gold/50" aria-hidden />
          <span>{BRAND.presence.join(" · ")}</span>
          <span className="h-1 w-1 rotate-45 bg-gold/50" aria-hidden />
          <span>Institutional Counterparties Only</span>
          <span className="h-1 w-1 rotate-45 bg-gold/50" aria-hidden />
          <span className="flex items-center gap-2 text-gold/80">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-graph" />
            Limited Capacity
          </span>
        </div>
      </div>

      {/* ============ 01 — BRAND ESSENCE ============ */}
      <Section className="border-y border-gold/10 bg-midnight">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <Stagger className="lg:col-span-5">
            <StaggerItem>
              <Eyebrow index={ESSENCE.index}>{ESSENCE.eyebrow}</Eyebrow>
            </StaggerItem>
            <StaggerItem>
              <h2 className="mt-6 text-display text-4xl text-ghost lg:text-5xl">
                {ESSENCE.title}
              </h2>
            </StaggerItem>
            <StaggerItem>
              <p className="mt-6 max-w-md text-sm font-light leading-relaxed text-silver/70">
                {ESSENCE.body}
              </p>
            </StaggerItem>
          </Stagger>

          <Stagger
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:col-span-7"
            delay={1.7}
          >
            {ESSENCE.cards.map((card) => (
              <StaggerItem key={card.title} className="h-full">
                <div className="group h-full border border-gold/10 bg-obsidian/40 p-7 backdrop-blur-sm transition-colors duration-500 hover:border-gold/30">
                  <div className="mb-4 h-1.5 w-1.5 rotate-45 bg-gold transition-transform duration-500 group-hover:scale-150" />
                  <h3 className="font-serif text-2xl text-ghost">{card.title}</h3>
                  <p className="mt-3 text-xs leading-relaxed text-silver/60">
                    {card.body}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </Section>

      {/* ============ 02 — POSITIONING ============ */}
      <Section className="border-y border-gold/10 bg-midnight">
        <Stagger className="mx-auto max-w-3xl text-center">
          <StaggerItem>
            <Eyebrow index={POSITIONING.index} centered>
              {POSITIONING.eyebrow}
            </Eyebrow>
          </StaggerItem>
          <StaggerItem>
            <h2 className="mt-6 text-display text-4xl text-ghost lg:text-6xl">
              {POSITIONING.title}
            </h2>
          </StaggerItem>
          <StaggerItem>
            <p className="mt-5 text-sm font-light tracking-wide text-silver/60">
              {POSITIONING.body}
            </p>
          </StaggerItem>
        </Stagger>

        <Stagger className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3" delay={0.3}>
          {POSITIONING.pillars.map((p) => (
            <StaggerItem key={p.no} className="h-full">
              <div className="group flex h-full flex-col justify-between border-t-2 border-gold bg-obsidian/50 p-8 transition-colors duration-500 hover:bg-obsidian">
                <div>
                  <div className="font-serif text-3xl text-gold">{p.no}</div>
                  <h4 className="mt-5 text-lg font-medium text-ghost">
                    {p.title}
                  </h4>
                  <p className="mt-3 text-xs font-light leading-relaxed text-silver/60">
                    {p.body}
                  </p>
                </div>
                <div className="mt-8 flex items-center justify-between border-t border-silver/10 pt-5 text-[0.6rem] uppercase tracking-[0.22em] text-gold">
                  <span>{p.tag}</span>
                  <span className="h-1 w-1 bg-gold" />
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      {/* ============ 03 — ARCHITECTURE ============ */}
      <Section className="hex-bg">
        <div className="flex flex-col items-center gap-16 lg:flex-row">
          <Stagger className="w-full lg:w-1/2">
            <StaggerItem>
              <Eyebrow index={ARCHITECTURE.index}>{ARCHITECTURE.eyebrow}</Eyebrow>
            </StaggerItem>
            <StaggerItem>
              <h2 className="mt-6 text-display text-4xl leading-tight text-ghost lg:text-5xl">
                {ARCHITECTURE.title}
              </h2>
            </StaggerItem>
            <StaggerItem>
              <p className="mt-6 text-sm font-light leading-relaxed text-silver/70">
                {ARCHITECTURE.body}
              </p>
            </StaggerItem>
            {ARCHITECTURE.checklist.slice(0, 3).map((item) => (
              <StaggerItem key={item}>
                <div className="mt-4 flex items-start gap-3">
                  <svg
                    className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.6"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-xs font-medium text-silver/80">{item}</span>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          <Stagger className="w-full lg:w-1/2" delay={2.4}>
            <StaggerItem>
              <div className="relative border border-gold/20 bg-obsidian/70 p-8 backdrop-blur-sm gold-grid lg:p-12">
                <h4 className="mb-6 font-serif text-xs uppercase tracking-[0.25em] text-gold">
                  {ARCHITECTURE.terminal.title}
                </h4>
                <div className="space-y-4 font-mono text-[11px] text-silver/50">
                  {ARCHITECTURE.terminal.rows.map((row) => (
                    <div
                      key={row.k}
                      className="flex items-center justify-between border-b border-silver/5 pb-2"
                    >
                      <span className="uppercase tracking-wider">{row.k}_</span>
                      <span
                        className={
                          row.tone === "gold"
                            ? "font-sans text-gold"
                            : row.tone === "graph"
                              ? "font-sans text-graph"
                              : "font-sans text-ghost"
                        }
                      >
                        {row.v}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 border-t border-gold/10 pt-6 text-center">
                  <span className="mb-4 block text-[0.6rem] uppercase tracking-[0.3em] text-silver/40">
                    {ARCHITECTURE.terminal.portalLabel}
                  </span>
                  <Link
                    to="/portal"
                    className="block w-full border border-silver/20 py-3.5 text-xs font-semibold uppercase tracking-[0.22em] text-ghost transition-colors duration-300 hover:border-gold hover:text-gold"
                  >
                    {ARCHITECTURE.terminal.cta}
                  </Link>
                </div>
              </div>
            </StaggerItem>
          </Stagger>
        </div>
      </Section>

      {/* ============ CLOSING CTA ============ */}
      <section className="relative overflow-hidden border-t border-gold/10 bg-midnight px-6 py-28 text-center lg:py-36">
        <AuroraRibbon intensity={0.4} className="opacity-60" />
        <Stagger className="relative z-10 mx-auto max-w-2xl">
          <StaggerItem>
            <Eyebrow centered>Limited Capacity</Eyebrow>
          </StaggerItem>
          <StaggerItem>
            <h2 className="mt-6 text-display text-4xl text-ghost lg:text-6xl">
              Access is by mandate, not by market.
            </h2>
          </StaggerItem>
          <StaggerItem>
            <p className="mx-auto mt-6 max-w-lg text-sm font-light leading-relaxed text-silver/60">
              Obsidian Quant operates a strict limited-capacity footprint for
              institutional counterparties. Begin secure verification to schedule a
              briefing with our technical committee.
            </p>
          </StaggerItem>
          <StaggerItem>
            <div className="mt-10">
              <Button to="/contact" variant="primary">
                Request Strategic Allocation
              </Button>
            </div>
          </StaggerItem>
        </Stagger>
      </section>
    </>
  );
};

export default memo(Home);
