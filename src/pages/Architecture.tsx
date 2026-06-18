import { memo } from "react";
import { Link } from "react-router-dom";

import PageHero from "../components/PageHero";
import Section from "../components/Section";
import Eyebrow from "../components/Eyebrow";
import { Stagger, StaggerItem } from "../components/Stagger";
import Button from "../components/Button";
import AuroraRibbon from "../components/AuroraRibbon";
import ArchitectureLayers from "../components/ArchitectureLayers";
import { ARCHITECTURE } from "../content/site";

const Architecture = () => (
  <>
    <PageHero
      eyebrow={ARCHITECTURE.eyebrow}
      index={ARCHITECTURE.index}
      title={ARCHITECTURE.title}
      body={ARCHITECTURE.body}
    />

    {/* ============ SYSTEM LAYERS ============ */}
    <Section className="border-y border-gold/10 bg-midnight">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <Stagger className="lg:sticky lg:top-32">
            <StaggerItem>
              <Eyebrow index="01">System Layers</Eyebrow>
            </StaggerItem>
            <StaggerItem>
              <h2 className="mt-6 text-display text-4xl leading-tight text-ghost lg:text-5xl">
                A single mandate, resolved layer by layer.
              </h2>
            </StaggerItem>
            <StaggerItem>
              <p className="mt-6 max-w-md text-sm font-light leading-relaxed text-silver/70">
                The DOX environment is a closed pipeline. Conviction descends from
                research to live execution without a discretionary hand touching
                the path — each tier accountable to the one beneath it.
              </p>
            </StaggerItem>
          </Stagger>
        </div>

        <div className="lg:col-span-8">
          <ArchitectureLayers delay={1.7} />
        </div>
      </div>
    </Section>

    {/* ============ CAPABILITIES ============ */}
    <Section className="hex-bg">
      <Stagger className="max-w-2xl">
        <StaggerItem>
          <Eyebrow index="02">Capabilities</Eyebrow>
        </StaggerItem>
        <StaggerItem>
          <h2 className="mt-6 text-display text-4xl text-ghost lg:text-5xl">
            What the infrastructure guarantees.
          </h2>
        </StaggerItem>
      </Stagger>

      <Stagger
        className="mt-14 grid grid-cols-1 gap-px overflow-hidden border border-gold/10 bg-gold/10 md:grid-cols-2"
        gap={0.15}
        delay={0.3}
      >
        {ARCHITECTURE.checklist.map((item, i) => (
          <StaggerItem key={item} className="h-full">
            <div className="group flex h-full items-start gap-5 bg-obsidian/70 p-8 transition-colors duration-500 hover:bg-obsidian lg:p-10">
              <svg
                className="mt-0.5 h-6 w-6 flex-shrink-0 text-gold transition-transform duration-500 group-hover:scale-110"
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
              <div>
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-gold/60">
                  {`C0${i + 1}`}
                </span>
                <p className="mt-2 text-sm font-light leading-relaxed text-silver/80">
                  {item}
                </p>
              </div>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>

    {/* ============ DOX TERMINAL PANEL ============ */}
    <Section className="border-t border-gold/10 bg-midnight">
      <div className="flex flex-col items-center gap-16 lg:flex-row">
        <Stagger className="w-full lg:w-1/2">
          <StaggerItem>
            <Eyebrow index="03">Operational Access</Eyebrow>
          </StaggerItem>
          <StaggerItem>
            <h2 className="mt-6 text-display text-4xl leading-tight text-ghost lg:text-5xl">
              One gateway. Cryptographically bound.
            </h2>
          </StaggerItem>
          <StaggerItem>
            <p className="mt-6 max-w-md text-sm font-light leading-relaxed text-silver/70">
              The OBSIDIAN_CORE_V4 system is reachable only through the secured
              regulatory portal. Sessions are monitored, clearing is treasury
              mandated, and every directive is logged against the model that
              authored it.
            </p>
          </StaggerItem>
        </Stagger>

        {/* DOX terminal panel — mirrors Home's 03 — ARCHITECTURE / DOX */}
        <Stagger delay={1.7} className="w-full lg:w-1/2">
          <StaggerItem>
            <div className="relative border border-gold/20 bg-obsidian/70 p-8 backdrop-blur-sm gold-grid lg:p-12">
            <h4 className="mb-6 font-serif text-xs uppercase tracking-[0.25em] text-gold">
              {ARCHITECTURE.dox.title}
            </h4>
            <div className="space-y-4 font-mono text-[11px] text-silver/50">
              {ARCHITECTURE.dox.rows.map((row) => (
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
                {ARCHITECTURE.dox.portalLabel}
              </span>
              <Link
                to="/portal"
                className="block w-full border border-silver/20 py-3.5 text-xs font-semibold uppercase tracking-[0.22em] text-ghost transition-colors duration-300 hover:border-gold hover:text-gold"
              >
                {ARCHITECTURE.dox.cta}
              </Link>
            </div>
            </div>
          </StaggerItem>
        </Stagger>
      </div>
    </Section>

    {/* ============ CLOSING CTA ============ */}
    <section className="relative overflow-hidden border-t border-gold/10 bg-obsidian px-6 py-28 text-center lg:py-36">
      <AuroraRibbon intensity={0.4} className="opacity-60" />
      <Stagger className="relative z-10 mx-auto max-w-2xl">
        <StaggerItem>
          <Eyebrow centered>Limited Capacity</Eyebrow>
        </StaggerItem>
        <StaggerItem>
          <h2 className="mt-6 text-display text-4xl text-ghost lg:text-6xl">
            The architecture is built. The mandate is selective.
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

export default memo(Architecture);
