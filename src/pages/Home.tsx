import { Fragment, memo, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Section from "../components/Section";
import Eyebrow from "../components/Eyebrow";
import Button from "../components/Button";
import { Stagger, StaggerItem } from "../components/Stagger";
import Reveal from "../components/Reveal";
import AnimatedCounter from "../components/AnimatedCounter";
import {
  ARCHITECTURE,
  BRAND,
  CORE_PHILOSOPHY,
  HERO,
  POSITIONING,
  STRATEGY,
} from "../content/site";

const passive = [
  "Market beta exposure",
  "No emotional advantage",
  "One-dimensional returns",
  "Market-direction dependent",
  "Crowded and correlated",
] as const;

const systematic = [
  "Multiple uncorrelated strategies",
  "Behavioral inefficiencies mathematically priced",
  "Volatility and time-decay edge",
  "Market-direction agnostic",
  "Diversified and complementary",
] as const;

const quantFlow = [
  ["⌁", "Market Noise"],
  ["◎", "Sentiment Analysis"],
  ["▥", "Volatility Modeling"],
  ["△", "Probability Engine"],
  ["◔", "Portfolio Allocation"],
  ["◆", "Alpha Generation"],
] as const;

const siteFacts = [
  ["⌘", 4, "Process Stages"],
  ["◎", 4, "Mandate Arenas"],
  ["◇", 3, "Global Presences"],
  ["Σ", 3, "Core Disciplines"],
  ["⌄", 4, "Architecture Controls"],
  ["◷", 6, "Research Notes"],
] as const;

const Home = () => {
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "8%"]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1.03, 1.065]);

  return (
    <>
      <section ref={heroRef} className="home-reference-hero reference-hero relative min-h-screen overflow-hidden border-b border-gold/20 px-6 pb-20 pt-36 lg:px-16 lg:pb-0 lg:pt-24">
        <motion.div className="home-hero-bg absolute inset-0" style={reduce ? undefined : { y: heroY, scale: heroScale }} aria-hidden />
        <div className="reference-stars absolute inset-0" aria-hidden />
        <div className="reference-fog absolute inset-0" aria-hidden />
        <div className="hero-side-dots" aria-hidden><b /><i /><i /><i /><i /></div>
        <div className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
          <motion.div
            className="relative z-10 min-w-0 max-w-3xl"
            initial={reduce ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: reduce ? 0 : 0.7 }}
          >
            <Eyebrow>{BRAND.badge}</Eyebrow>
            <h1 className="mt-7 text-display text-6xl leading-[.98] text-ghost sm:text-7xl lg:text-[6.5rem]">
              {HERO.headlineLead}<br />
              <span className="text-gold-gradient">{HERO.headlineAccent}</span>
            </h1>
            <p className="mt-7 max-w-xl text-base font-light leading-relaxed text-silver/80 lg:text-lg">
              {HERO.sub}
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button to="/firm" variant="primary">Explore Our Philosophy</Button>
              <Button to="/strategy" variant="outline">Our Strategies</Button>
            </div>
            <div className="mt-16 flex items-center gap-3 text-[.6rem] uppercase tracking-[.28em] text-silver/55">
              <span className="flex h-8 w-5 items-center justify-center rounded-full border border-silver/40"><span className="h-1.5 w-1.5 rounded-full bg-gold" /></span>
              Scroll to explore
            </div>
          </motion.div>
          <div className="hidden lg:block" aria-hidden />
        </div>
      </section>

      <Section className="philosophy-showcase reference-panel overflow-hidden border-b border-gold/15">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_18rem]">
          <div>
            <Stagger className="max-w-3xl">
              <StaggerItem><Eyebrow>{CORE_PHILOSOPHY.eyebrow}</Eyebrow></StaggerItem>
              <StaggerItem><h2 className="mt-5 text-display text-4xl text-ghost lg:text-6xl">The Architecture of Alpha</h2></StaggerItem>
              <StaggerItem><p className="mt-4 max-w-2xl text-sm leading-relaxed text-silver/60">{CORE_PHILOSOPHY.intro}</p></StaggerItem>
            </Stagger>
            <Stagger className="philosophy-card-grid mt-12 grid gap-6 md:grid-cols-3" gap={0.14}>
              {CORE_PHILOSOPHY.columns.map((item, index) => (
                <StaggerItem key={item.label} className="h-full">
                  <article className={`kev-philosophy-card h-full ${index === 1 ? "kev-philosophy-card-active" : ""}`}>
                    <strong>0{index + 1}</strong>
                    <h3>{item.label}</h3>
                    <p>{item.body}</p>
                    <div className={`kev-graphic ${["kev-brain", "kev-wave", "kev-chart"][index]}`} aria-hidden />
                  </article>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
          <div className="hidden lg:block" aria-hidden />
        </div>
      </Section>

      <Section className="kev-engine reference-engine overflow-hidden border-b border-gold/15">
        <div className="kev-engine-layout grid items-center gap-14 lg:grid-cols-[310px_1fr]">
          <Stagger>
            <StaggerItem><Eyebrow>The Quant Engine</Eyebrow></StaggerItem>
            <StaggerItem><h2 className="mt-5 text-display text-4xl text-ghost lg:text-6xl">Turning Complexity<br />Into Conviction</h2></StaggerItem>
            <StaggerItem><p className="mt-5 max-w-sm text-sm leading-relaxed text-silver/65">{STRATEGY.hero.body}</p></StaggerItem>
            <StaggerItem><div className="mt-8"><Button to="/strategy" variant="outline">See Our Strategies</Button></div></StaggerItem>
          </Stagger>
          <Reveal>
            <div className="kev-flow" aria-label="Systematic quantitative process">
              {quantFlow.map(([icon, label], index) => (
                <Fragment key={label}>
                  <div className="kev-hex">
                    <span className="kev-hex-icon" aria-hidden>{index === quantFlow.length - 1 ? <img src="/assets/obsidian-gem.webp" alt="" /> : icon}</span>
                    <span>{label}</span>
                  </div>
                  {index < quantFlow.length - 1 && <b aria-hidden />}
                </Fragment>
              ))}
            </div>
          </Reveal>
        </div>
      </Section>

      <Section className="kev-compare reference-panel overflow-hidden border-b border-gold/15">
        <div className="kev-compare-layout grid items-center gap-12 lg:grid-cols-[310px_1fr]">
          <Stagger>
            <StaggerItem><Eyebrow>Beyond Passive</Eyebrow></StaggerItem>
            <StaggerItem><h2 className="mt-5 text-display text-4xl text-ghost lg:text-6xl">Not All Strategies<br />Are Created Equal</h2></StaggerItem>
            <StaggerItem><p className="mt-5 text-sm leading-relaxed text-silver/65">{CORE_PHILOSOPHY.intro}</p></StaggerItem>
            <StaggerItem><div className="mt-8"><Button to="/architecture" variant="outline">Why It Matters</Button></div></StaggerItem>
          </Stagger>
          <Stagger className="kev-compare-grid" gap={0.15}>
            {[{ title: "Passive Investing", rows: passive }, { title: BRAND.short, rows: systematic }].map((group, i) => (
              <Fragment key={group.title}>
                {i === 1 && <div className="kev-vs" aria-hidden>VS</div>}
                <article className={i ? "active" : ""}>
                  <h3>{group.title}</h3>
                  {group.rows.map((row) => <p key={row}>{row}</p>)}
                  <div className={i ? "kev-mini" : "kev-mini kev-redline"} aria-hidden />
                </article>
              </Fragment>
            ))}
          </Stagger>
        </div>
      </Section>

      <Section className="facts-section overflow-hidden border-b border-gold/15" spacing="py-14 lg:py-16">
        <div className="facts-orbit" aria-hidden />
        <div className="relative z-10 mb-8 flex flex-wrap items-center justify-between gap-4">
          <Eyebrow>By the Structure</Eyebrow>
          <span className="text-[.58rem] uppercase tracking-[.22em] text-silver/40">Counts derived from this site’s published structure</span>
        </div>
        <Stagger className="facts-grid" gap={.1}>
          {siteFacts.map(([icon, value, label]) => (
            <StaggerItem key={label}>
              <article>
                <i aria-hidden>{icon}</i>
                <strong><AnimatedCounter value={value} /></strong>
                <span>{label}</span>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      <Section className="reference-panel border-b border-gold/15">
        <Stagger className="text-center">
          <StaggerItem><Eyebrow centered>Market Intelligence</Eyebrow></StaggerItem>
          <StaggerItem><h2 className="mt-5 text-display text-4xl text-ghost lg:text-6xl">Where Data Becomes Conviction.</h2></StaggerItem>
        </Stagger>
        <Stagger className="mt-12 grid gap-5 md:grid-cols-3" gap={0.15}>
          {POSITIONING.pillars.map((item) => (
            <StaggerItem key={item.no} className="h-full">
              <article className="reference-card h-full p-8 text-center">
                <span className="font-serif text-3xl text-gold">{item.no}</span>
                <h3 className="mt-5 text-2xl">{item.title}</h3>
                <p className="mt-4 text-xs leading-relaxed text-silver/65">{item.body}</p>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      <section className="reference-quote relative grid min-h-[600px] place-items-center overflow-hidden border-b border-gold/15 px-6 py-28 text-center">
        <div className="quote-stars absolute inset-0" aria-hidden />
        <Reveal className="relative z-10 mx-auto max-w-5xl">
          <Eyebrow centered>Precision, Systematized</Eyebrow>
          <blockquote className="mt-8 font-serif text-4xl font-semibold leading-[1.05] text-ghost sm:text-6xl lg:text-8xl">
            Markets misprice human emotion.<br />
            We express it <span className="text-gold-gradient">mathematically.</span>
          </blockquote>
          <div className="mt-10"><Button to="/contact" variant="primary">Contact Obsidian Quant</Button></div>
        </Reveal>
      </section>

      <section className="reference-closing relative overflow-hidden px-6 py-28 lg:px-16 lg:py-40">
        <div className="mx-auto grid max-w-7xl items-center lg:grid-cols-[1fr_.8fr]">
          <Stagger className="relative z-10 max-w-2xl">
            <StaggerItem><Eyebrow>Built Different</Eyebrow></StaggerItem>
            <StaggerItem><h2 className="mt-6 text-display text-5xl text-ghost lg:text-7xl">{ARCHITECTURE.title}</h2></StaggerItem>
            <StaggerItem><p className="mt-6 max-w-lg text-sm leading-relaxed text-silver/70">{ARCHITECTURE.body}</p></StaggerItem>
            <StaggerItem><div className="mt-9"><Button to="/contact" variant="primary">Partner With Obsidian</Button></div></StaggerItem>
          </Stagger>
          <div className="hidden lg:block" aria-hidden />
        </div>
      </section>
    </>
  );
};

export default memo(Home);
