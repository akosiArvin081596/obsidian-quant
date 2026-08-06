"use client";

import { memo } from "react";

import PageHero from "../components/PageHero";
import Section from "../components/Section";
import Eyebrow from "../components/Eyebrow";
import { Stagger, StaggerItem } from "../components/Stagger";
import Button from "../components/Button";
import GoldRule from "../components/GoldRule";
import AuroraRibbon from "../components/AuroraRibbon";
import HexField from "../components/HexField";
import Parallax from "../components/Parallax";
import Spotlight from "../components/Spotlight";
import StrategyProcess from "../components/StrategyProcess";
import { STRATEGY, POSITIONING } from "../content/site";

/* On-brand elaboration per capability pillar — institutional, systematic tone.
   Keyed to POSITIONING.pillars[].no so copy stays anchored to the source. */
const PILLAR_DETAIL: Record<string, string> = {
  "01":
    "Research is treated as an engineering discipline: every hypothesis is falsifiable, every signal carries a provenance, and conviction is earned only through reproducible evidence across regimes.",
  "02":
    "Allocation is a control problem, not a forecast. Exposures are continuously rebalanced against live risk vectors so the portfolio inherits the discipline of the model, never the mood of the desk.",
  "03":
    "Unstructured inputs — flows, microstructure, alternative telemetry — are normalised into a single decision surface, compressing the distance between observation and capital placement.",
};

const Strategy = () => (
  <>
    <PageHero
      eyebrow={STRATEGY.hero.eyebrow}
      title={STRATEGY.hero.title}
      body={STRATEGY.hero.body}
      standardHeight
    />

    {/* ============ CAPABILITY PILLARS ============ */}
    <Section id="systematic-approach" className="border-y border-gold/10 bg-midnight">
      <Stagger className="max-w-3xl">
        <StaggerItem>
          <Eyebrow index={POSITIONING.index}>{POSITIONING.eyebrow}</Eyebrow>
        </StaggerItem>
        <StaggerItem>
          <h2 className="mt-6 text-display text-4xl text-ghost lg:text-5xl">
            {POSITIONING.title}
          </h2>
        </StaggerItem>
        <StaggerItem>
          <p className="mt-5 max-w-xl text-sm font-light leading-relaxed text-silver/60">
            {POSITIONING.body}
          </p>
        </StaggerItem>
      </Stagger>

      <Stagger className="mt-16 space-y-px lg:mt-20" gap={0.18} delay={0.3}>
        {POSITIONING.pillars.map((p) => (
          <StaggerItem key={p.no}>
            <div className="group relative z-10 grid grid-cols-1 items-center gap-6 border-t border-gold/10 bg-obsidian/80 px-6 py-10 transition-colors duration-500 hover:bg-ink hover:shadow-[inset_0_0_0_1px_rgba(184,138,74,0.12)] sm:gap-8 sm:px-8 sm:py-12 lg:grid-cols-12 lg:gap-12 lg:bg-obsidian/30 lg:px-12 lg:py-14 lg:hover:bg-obsidian xl:px-14">
              {/* Big serif index */}
              <div className="lg:col-span-2">
                <div className="font-serif text-5xl leading-none text-gold-gradient sm:text-6xl lg:text-7xl">
                  {p.no}
                </div>
                <div className="mt-4 flex items-center gap-3 text-[0.6rem] uppercase tracking-[0.24em] text-gold">
                  <span className="h-px w-6 bg-gold/50" aria-hidden />
                  {p.tag}
                </div>
              </div>

              {/* Title */}
              <div className="lg:col-span-4">
                <h3 className="text-display text-2xl text-ghost sm:text-3xl lg:text-4xl">
                  {p.title}
                </h3>
              </div>

              {/* Body + elaboration */}
              <div className="min-w-0 lg:col-span-6">
                <p className="text-sm font-light leading-relaxed text-silver/75">
                  {p.body}
                </p>
                <p className="mt-4 text-xs font-light leading-relaxed text-silver/50">
                  {PILLAR_DETAIL[p.no]}
                </p>
              </div>
            </div>
          </StaggerItem>
        ))}
        <div className="border-t border-gold/10" aria-hidden />
      </Stagger>
    </Section>

    {/* ============ PROCESS — SYSTEMATIC PIPELINE ============ */}
    <Section className="hex-bg">
      {/* ambient gold bloom behind the pipeline — drifts gently on scroll */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <Parallax className="absolute inset-0" speed={0.18}>
          <div className="gold-bloom absolute left-1/2 top-[60%] h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2" />
        </Parallax>
      </div>
      <Stagger className="mx-auto max-w-3xl text-center">
        <StaggerItem>
          <Eyebrow centered>The Pipeline</Eyebrow>
        </StaggerItem>
        <StaggerItem>
          <h2 className="mt-6 text-display text-4xl text-ghost lg:text-6xl">
            From structure to execution.
          </h2>
        </StaggerItem>
        <StaggerItem>
          <p className="mt-5 text-sm font-light leading-relaxed text-silver/60">
            A single directional path runs from research to clearing. No step is
            discretionary; each is the input to the next.
          </p>
        </StaggerItem>
        <StaggerItem>
          <GoldRule diamond className="mx-auto mt-8 w-28" />
        </StaggerItem>
      </Stagger>

      <div className="mt-20">
        <StrategyProcess />
      </div>
    </Section>

    {/* ============ ASSET CLASSES ============ */}
    <Section id="mandate-coverage" className="border-y border-gold/10 bg-midnight">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <Stagger className="lg:col-span-4">
          <StaggerItem>
            <Eyebrow>Mandate Coverage</Eyebrow>
          </StaggerItem>
          <StaggerItem>
            <h2 className="mt-6 text-display text-4xl text-ghost lg:text-5xl">
              One architecture, four arenas.
            </h2>
          </StaggerItem>
          <StaggerItem>
            <p className="mt-6 max-w-md text-sm font-light leading-relaxed text-silver/70">
              The same systematic discipline is expressed across uncorrelated
              return streams — each engineered to the structure of its own market.
            </p>
          </StaggerItem>
          <StaggerItem>
            <div className="mt-10 hidden lg:block">
              <HexField className="max-w-[14rem] opacity-70" />
            </div>
          </StaggerItem>
        </Stagger>

        <Spotlight className="lg:col-span-8">
          <Stagger
          className="grid grid-cols-1 gap-5 sm:grid-cols-2"
          gap={0.15}
          delay={0.25}
        >
          {STRATEGY.classes.map((c, i) => (
            <StaggerItem key={c.title} className="h-full">
              <div className="group relative z-10 flex h-full flex-col justify-between overflow-hidden border border-gold/10 bg-obsidian/80 p-6 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:border-gold/35 hover:bg-ink hover:shadow-[inset_0_0_0_1px_rgba(184,138,74,0.1),0_18px_40px_-20px_rgba(0,0,0,0.85)] active:bg-ink sm:p-8 lg:bg-obsidian/45 lg:hover:bg-ink">
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="h-2 w-2 rotate-45 bg-gold transition-transform duration-500 group-hover:scale-150" />
                    <span className="font-mono text-[0.7rem] tracking-[0.2em] text-silver/35">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-6 font-serif text-2xl text-ghost">
                    {c.title}
                  </h3>
                  <p className="mt-3 text-xs font-light leading-relaxed text-silver/75 sm:text-sm lg:text-silver/60 lg:group-hover:text-silver/80">
                    {c.body}
                  </p>
                </div>
                <div className="relative z-10 mt-8 h-px w-full bg-gradient-to-r from-gold/30 to-transparent transition-all duration-500 group-hover:from-gold/60" />
              </div>
            </StaggerItem>
          ))}
          </Stagger>
        </Spotlight>
      </div>
    </Section>

    {/* ============ CLOSING CTA ============ */}
    <section className="relative overflow-hidden border-t border-gold/10 bg-midnight px-6 py-28 text-center lg:py-36">
      <AuroraRibbon intensity={0.4} className="scene-behind opacity-60" />
      <Stagger className="scene-content relative z-10 mx-auto max-w-2xl">
        <StaggerItem>
          <Eyebrow centered>Strategic Allocation</Eyebrow>
        </StaggerItem>
        <StaggerItem>
          <h2 className="mt-6 text-display text-4xl text-ghost lg:text-6xl">
            Allocate to the architecture, not the noise.
          </h2>
        </StaggerItem>
        <StaggerItem>
          <p className="mx-auto mt-6 max-w-lg text-sm font-light leading-relaxed text-silver/60">
            The mandate is systematic, the capacity is finite, and access is
            reserved for institutional counterparties. Begin secure verification
            to open a briefing with our technical committee.
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

export default memo(Strategy);
