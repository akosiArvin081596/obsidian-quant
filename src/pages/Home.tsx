import { memo, useRef } from "react";
import type { PointerEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";

import Section from "../components/Section";
import Eyebrow from "../components/Eyebrow";
import Button from "../components/Button";
import GoldRule from "../components/GoldRule";
import AuroraRibbon from "../components/AuroraRibbon";
import Parallax from "../components/Parallax";
import { Stagger, StaggerItem } from "../components/Stagger";
import { EASE_LUX } from "../lib/motion";
import {
  BRAND,
  HERO,
  CORE_PHILOSOPHY,
  ESSENCE,
  POSITIONING,
  ARCHITECTURE,
} from "../content/site";

/** Sparse gold motes drifting up through the hero (deterministic — fixed once). */
const EMBERS = [
  { left: "14%", delay: 0, dur: 7.5, drift: 10 },
  { left: "27%", delay: 2.4, dur: 9, drift: -8 },
  { left: "41%", delay: 4.1, dur: 8, drift: 6 },
  { left: "56%", delay: 1.3, dur: 9.5, drift: -10 },
  { left: "68%", delay: 5.4, dur: 7, drift: 9 },
  { left: "81%", delay: 3.2, dur: 10, drift: -6 },
  { left: "35%", delay: 6.6, dur: 8.5, drift: 5 },
  { left: "73%", delay: 7.8, dur: 9, drift: -7 },
] as const;

const Home = () => {
  const reduce = useReducedMotion();
  // Hero entrance begins as the forge curtain lifts; under reduced motion the
  // curtain is much shorter, so the beats start sooner.
  const HERO_T = reduce ? 0.7 : 2.4;
  const beat = (t: number) => ({
    initial: { opacity: 0, y: 22, filter: "blur(6px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { delay: HERO_T + t, duration: 0.9, ease: EASE_LUX },
  });

  const heroRef = useRef<HTMLElement>(null);
  const onHeroMove = (e: PointerEvent<HTMLElement>) => {
    const el = heroRef.current;
    if (!el || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
    el.style.setProperty("--glow", "1");
  };
  const onHeroLeave = () => heroRef.current?.style.setProperty("--glow", "0");

  return (
    <>
      {/* ============ HERO ============ */}
      <section
        ref={heroRef}
        onPointerMove={reduce ? undefined : onHeroMove}
        onPointerLeave={reduce ? undefined : onHeroLeave}
        className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-28 hex-bg gold-grid"
      >
        {/* parallax aurora — drifts as you scroll for depth */}
        <Parallax className="absolute inset-0" speed={0.3}>
          <AuroraRibbon intensity={0.7} />
        </Parallax>

        {/* ambient gold bloom behind the headline */}
        <div
          aria-hidden
          className="gold-bloom pointer-events-none absolute left-1/2 top-[44%] h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2"
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-obsidian/50 via-transparent to-obsidian" />

        {/* cursor-following gold glow */}
        {!reduce && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[1] transition-opacity duration-500"
            style={{
              opacity: "var(--glow, 0)",
              background:
                "radial-gradient(460px circle at var(--mx, 50%) var(--my, 50%), rgba(184,138,74,0.16), transparent 65%)",
            }}
          />
        )}

        {/* drifting gold embers */}
        {!reduce && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
          >
            {EMBERS.map((e, i) => (
              <motion.span
                key={i}
                className="absolute bottom-[-12px] block h-1 w-1 rounded-full bg-warm-gold/50"
                style={{ left: e.left, filter: "blur(0.5px)" }}
                initial={{ opacity: 0, y: 0, x: 0 }}
                animate={{ opacity: [0, 0.6, 0], y: [-20, -340], x: [0, e.drift] }}
                transition={{
                  duration: e.dur,
                  delay: e.delay,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
            ))}
          </span>
        )}

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <motion.div className="flex justify-center" {...beat(0)}>
            <span className="inline-flex items-center gap-2 border border-gold/25 bg-midnight/50 px-4 py-1.5 text-[0.6rem] uppercase tracking-[0.28em] text-gold backdrop-blur-sm">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-graph" />
              {BRAND.badge}
            </span>
          </motion.div>

          <motion.h1
            className="mt-8 text-display text-5xl leading-[1.05] text-ghost md:text-7xl lg:text-8xl"
            {...beat(0.5)}
          >
            {HERO.headlineLead}{" "}
            <span className="text-gold-shimmer">{HERO.headlineAccent}</span>
          </motion.h1>

          <motion.p
            className="mx-auto mt-7 max-w-2xl font-serif text-xl font-light leading-relaxed text-silver/80 md:text-2xl"
            {...beat(1.2)}
          >
            {HERO.sub}
          </motion.p>

          <motion.div {...beat(1.6)}>
            <GoldRule className="mx-auto my-8 w-28" />
          </motion.div>

          <motion.div
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            {...beat(1.95)}
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

      {/* Mandate strip — a quiet institutional credential line. */}
      {/* border-t only: the Core Philosophy section below carries its own top
          hairline, so a single rule renders at this boundary, not a doubled one. */}
      <div className="border-t border-gold/10 bg-midnight/30 px-6 py-4">
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

      {/* ============ THE CORE PHILOSOPHY ============ */}
      <Section className="border-t border-gold/10 hex-bg">
        <Stagger className="mx-auto max-w-3xl text-center">
          <StaggerItem>
            <Eyebrow centered>{CORE_PHILOSOPHY.eyebrow}</Eyebrow>
          </StaggerItem>
          <StaggerItem>
            <h2 className="mt-6 text-display text-2xl leading-snug text-ghost md:text-3xl lg:text-4xl">
              {CORE_PHILOSOPHY.intro}
            </h2>
          </StaggerItem>
        </Stagger>

        <Stagger className="mt-16 border-t border-gold/15" gap={0.16} delay={0.3}>
          {CORE_PHILOSOPHY.columns.map((col, i) => (
            <StaggerItem key={col.label}>
              <div className="group grid grid-cols-1 gap-4 border-b border-gold/15 py-10 md:grid-cols-12 md:gap-8 md:py-12">
                <div className="flex items-baseline gap-4 md:col-span-4">
                  <span className="font-serif text-4xl leading-none text-gold/80 transition-colors duration-500 group-hover:text-gold lg:text-5xl">
                    {`0${i + 1}`}
                  </span>
                  <h3 className="font-serif text-2xl text-ghost lg:text-3xl">
                    {col.label}
                  </h3>
                </div>
                <p className="text-sm font-light leading-relaxed text-silver/70 md:col-span-8 lg:text-base">
                  {col.body}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

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
      {/* border-b only: Brand Essence supplies the hairline above, so a single
          rule renders at that boundary instead of a doubled one. */}
      <Section className="border-b border-gold/10 bg-midnight">
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
        <Stagger className="mx-auto max-w-3xl text-center">
          <StaggerItem>
            <Eyebrow index={ARCHITECTURE.index} centered>
              {ARCHITECTURE.eyebrow}
            </Eyebrow>
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
        </Stagger>

        <Stagger
          className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2"
          gap={0.15}
          delay={0.3}
        >
          {ARCHITECTURE.checklist.map((item) => (
            <StaggerItem key={item} className="h-full">
              <div className="group flex h-full items-start gap-4 border border-gold/10 bg-obsidian/40 p-7 backdrop-blur-sm transition-colors duration-500 hover:border-gold/30">
                <svg
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.6"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-xs font-medium leading-relaxed text-silver/80">
                  {item}
                </span>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
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
