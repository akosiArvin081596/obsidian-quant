import { memo } from "react";
import { motion } from "framer-motion";

import PageHero from "../components/PageHero";
import Section from "../components/Section";
import Eyebrow from "../components/Eyebrow";
import Reveal from "../components/Reveal";
import { Stagger, StaggerItem } from "../components/Stagger";
import Button from "../components/Button";
import AuroraRibbon from "../components/AuroraRibbon";
import InsightCard from "../components/InsightCard";
import { EASE_LUX } from "../lib/motion";
import { INSIGHTS } from "../content/site";

const Insights = () => {
  const [featured, ...rest] = INSIGHTS.articles;

  return (
    <>
      <PageHero
        eyebrow={INSIGHTS.hero.eyebrow}
        title={INSIGHTS.hero.title}
        body={INSIGHTS.hero.body}
      />

      {/* ============ ARTICLE GRID ============ */}
      <Section className="border-y border-gold/10 bg-midnight">
        <Reveal className="flex flex-col gap-6 border-b border-gold/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow>Research & Commentary</Eyebrow>
            <h2 className="mt-5 text-display text-3xl text-ghost lg:text-4xl">
              The latest from the model.
            </h2>
          </div>
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-silver/40">
            {INSIGHTS.articles.length} Notes · Institutional Distribution
          </span>
        </Reveal>

        <Stagger className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3" gap={0.15}>
          {/* Featured — spans two columns where space allows */}
          <StaggerItem className="md:col-span-2">
            <InsightCard article={featured} featured />
          </StaggerItem>

          {rest.map((article) => (
            <StaggerItem key={article.title}>
              <InsightCard article={article} />
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      {/* ============ RESTRICTED DISTRIBUTION + CTA ============ */}
      <section className="relative overflow-hidden border-t border-gold/10 bg-obsidian px-6 py-28 hex-bg lg:py-36">
        <AuroraRibbon intensity={0.4} className="opacity-50" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-obsidian/40 via-transparent to-obsidian" />
        <motion.div
          className="relative z-10 mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE_LUX }}
        >
          <Eyebrow centered>Restricted Distribution</Eyebrow>
          <h2 className="mt-6 text-display text-4xl text-ghost lg:text-5xl">
            Reserved for institutional counterparties.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-sm font-light leading-relaxed text-silver/60">
            Obsidian Quant research is circulated privately and is not intended
            for retail distribution. Verified counterparties receive the full
            archive and forward briefings through the secured channel.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button to="/contact" variant="primary">
              Request Distribution
            </Button>
            <Button to="/access" variant="ghost">
              Counterparty Access
            </Button>
          </div>
        </motion.div>
      </section>
    </>
  );
};

export default memo(Insights);
