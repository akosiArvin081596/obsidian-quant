import { memo } from "react";

import PageHero from "../components/PageHero";
import Section from "../components/Section";
import Eyebrow from "../components/Eyebrow";
import { Stagger, StaggerItem } from "../components/Stagger";
import Button from "../components/Button";
import HexField from "../components/HexField";
import AuroraRibbon from "../components/AuroraRibbon";
import Spotlight from "../components/Spotlight";
import { FIRM } from "../content/site";

const Firm = () => (
  <>
    <PageHero
      eyebrow={FIRM.hero.eyebrow}
      title={FIRM.hero.title}
      body={FIRM.hero.body}
      standardHeight
    />

    {/* ============ PHILOSOPHY ============ */}
    <Section className="border-y border-gold/10 bg-midnight">
      {/* ambient gold bloom — soft light seated behind the philosophy blocks */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="gold-bloom absolute left-[62%] top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2" />
      </div>

      <Stagger className="max-w-2xl">
        <StaggerItem>
          <Eyebrow>{FIRM.philosophy.eyebrow}</Eyebrow>
        </StaggerItem>
        <StaggerItem>
          <h2 className="mt-6 text-display text-4xl text-ghost lg:text-5xl">
            {FIRM.philosophy.title}
          </h2>
        </StaggerItem>
      </Stagger>

      <div className="mt-12 grid items-start gap-12 lg:mt-16 lg:grid-cols-12">
        <div className="relative mt-4 hidden lg:col-span-5 lg:block" aria-hidden>
          <HexField className="max-w-xs opacity-70" />
        </div>

        <Stagger
          className="grid grid-cols-1 gap-px overflow-hidden border border-gold/10 bg-gold/10 sm:grid-cols-2 lg:col-span-7"
          gap={0.15}
          delay={0.3}
        >
          {FIRM.philosophy.blocks.map((block, i) => (
            <StaggerItem key={block.title} className="h-full">
              <div className="group relative z-10 h-full bg-obsidian/80 p-8 transition-colors duration-500 hover:bg-ink active:bg-ink lg:bg-obsidian/70 lg:p-10 lg:hover:bg-obsidian">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[0.66rem] tracking-[0.2em] text-gold/70">
                    0{i + 1}
                  </span>
                  <span className="h-px flex-1 bg-gold/15" />
                </div>
                <h3 className="mt-6 font-serif text-2xl text-ghost lg:text-3xl">
                  {block.title}
                </h3>
                <p className="mt-4 text-xs font-light leading-relaxed text-silver/75 lg:text-sm lg:text-silver/65">
                  {block.body}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </Section>

    {/* ============ PRINCIPLES ============ */}
    <Section className="hex-bg">
      <Stagger className="max-w-2xl">
        <StaggerItem>
          <Eyebrow>Operating Principles</Eyebrow>
        </StaggerItem>
        <StaggerItem>
          <h2 className="mt-6 text-display text-4xl text-ghost lg:text-5xl">
            The doctrine the architecture is held to.
          </h2>
        </StaggerItem>
      </Stagger>

      <Stagger
        className="mt-16 grid grid-cols-1 border-t border-gold/15 sm:grid-cols-2"
        gap={0.15}
        delay={0.3}
      >
        {FIRM.principles.map((p) => (
          <StaggerItem key={p.no} className="h-full">
            <div className="group flex h-full gap-6 border-b border-gold/15 py-10 transition-colors duration-500 sm:gap-8 sm:[&:nth-child(odd)]:pr-10 sm:[&:nth-child(even)]:border-l sm:[&:nth-child(even)]:border-l-gold/15 sm:[&:nth-child(even)]:pl-10">
              <span className="principle-mark font-serif text-5xl leading-none text-gold transition-all duration-500 group-hover:-translate-y-1 group-hover:text-warm-gold lg:text-6xl">
                {p.no}
              </span>
              <div>
                <h3 className="font-serif text-2xl text-ghost lg:text-3xl">
                  {p.title}
                </h3>
                <p className="mt-3 max-w-md text-xs font-light leading-relaxed text-silver/65 lg:text-sm">
                  {p.body}
                </p>
              </div>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>

    {/* ============ GOVERNANCE ============ */}
    <Section className="border-y border-gold/10 bg-midnight">
      <Stagger className="mx-auto max-w-3xl text-center">
        <StaggerItem>
          <Eyebrow centered>{FIRM.governance.eyebrow}</Eyebrow>
        </StaggerItem>
        <StaggerItem>
          <h2 className="mt-6 text-display text-4xl text-ghost lg:text-6xl">
            {FIRM.governance.title}
          </h2>
        </StaggerItem>
        <StaggerItem>
          <p className="mt-5 text-sm font-light leading-relaxed tracking-wide text-silver/60">
            {FIRM.governance.body}
          </p>
        </StaggerItem>
      </Stagger>

      <Spotlight className="mt-16">
        <Stagger
        className="grid grid-cols-1 gap-6 md:grid-cols-3"
        gap={0.16}
        delay={0.3}
      >
        {FIRM.governance.pillars.map((pillar, i) => (
          <StaggerItem key={pillar.title} className="h-full">
            <div className="group relative z-10 flex h-full flex-col justify-between border-t-2 border-gold bg-obsidian/80 p-6 transition-colors duration-500 hover:bg-ink active:bg-ink sm:p-8 lg:bg-obsidian/50 lg:hover:bg-obsidian">
              <div>
                <div className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-gold/70">
                  {`0${i + 1}`} / Authority
                </div>
                <h4 className="mt-5 font-serif text-xl text-ghost lg:text-2xl">
                  {pillar.title}
                </h4>
                <p className="mt-3 text-xs font-light leading-relaxed text-silver/70 lg:text-silver/60">
                  {pillar.body}
                </p>
              </div>
              <div className="mt-8 flex items-center justify-between border-t border-silver/10 pt-5 text-[0.6rem] uppercase tracking-[0.22em] text-gold">
                <span>Independent</span>
                <span className="h-1 w-1 bg-gold" />
              </div>
            </div>
          </StaggerItem>
        ))}
        </Stagger>
      </Spotlight>
    </Section>

    {/* ============ CLOSING CTA ============ */}
    <section className="relative overflow-hidden border-t border-gold/10 bg-obsidian px-6 py-28 text-center lg:py-36">
      <AuroraRibbon intensity={0.4} className="scene-behind opacity-60" />
      <Stagger className="scene-content relative z-10 mx-auto max-w-2xl">
        <StaggerItem>
          <Eyebrow centered>The Long View</Eyebrow>
        </StaggerItem>
        <StaggerItem>
          <h2 className="mt-6 text-display text-4xl text-ghost lg:text-6xl">
            Built for those who measure in decades.
          </h2>
        </StaggerItem>
        <StaggerItem>
          <p className="mx-auto mt-6 max-w-lg text-sm font-light leading-relaxed text-silver/60">
            Obsidian Quant Group partners with a select roster of institutional
            counterparties. Begin secure verification to schedule a briefing with
            our technical committee.
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

export default memo(Firm);
