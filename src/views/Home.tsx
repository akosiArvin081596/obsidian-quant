"use client";

import { Fragment, memo, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Section from "../components/Section";
import Eyebrow from "../components/Eyebrow";
import Button from "../components/Button";
import { Stagger, StaggerItem } from "../components/Stagger";
import Reveal from "../components/Reveal";
import AnimatedCounter from "../components/AnimatedCounter";
import MarketIntelligence from "../components/MarketIntelligence";
import { cn } from "../lib/cn";
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

const QuantIcon = ({ index }: { index: number }) => {
  const icons = [
    <><path d="M4 32h8l3-13 5 27 6-36 6 43 5-30 5 18 4-9h10" /><path d="M8 26v12M52 25v14" /></>,
    <><path d="M32 11c-7-6-15 0-13 7-8 0-10 11-4 15-4 8 5 15 12 10 2 8 12 8 13 0 8 5 16-3 12-10 7-5 3-15-5-15 2-8-7-14-13-8Z" /><path d="M32 12v36M21 20c7 1 8 5 7 10M43 20c-7 1-8 5-7 10M18 34c5-2 9 0 10 5M46 34c-5-2-9 0-10 5" /></>,
    <><path d="M10 51V13M10 51h45" /><path d="m16 43 8-10 8 5 9-16 7 5 8-14M48 13h8v8" /><path d="M19 47v-6M28 47V36M37 47V29M46 47V23" /></>,
    <><path d="m32 9 23 42H9L32 9Z" /><circle cx="32" cy="25" r="3" /><path d="m32 28-11 16M32 28l11 16M21 44h22" /></>,
    <><circle cx="32" cy="32" r="23" /><path d="M32 9v23h23M32 32 17 49M32 32 12 21" /><path d="M37 10a23 23 0 0 1 17 17H37V10Z" /></>,
    <><path d="M32 8 48 22 32 56 16 22 32 8Z" /><path d="M16 22h32M32 8v48M22 22l10 34M42 22 32 56" /></>,
  ];

  return <svg viewBox="0 0 64 64" aria-hidden>{icons[index]}</svg>;
};

const FactIcon = ({ index }: { index: number }) => {
  const icons = [
    <><circle cx="32" cy="32" r="5" /><circle cx="32" cy="9" r="3" /><circle cx="53" cy="21" r="3" /><circle cx="53" cy="44" r="3" /><circle cx="32" cy="55" r="3" /><circle cx="11" cy="44" r="3" /><circle cx="11" cy="21" r="3" /><path d="m32 14v13m5-1 12-4m-12 16 12 5M32 37v13m-5-12-12 5m12-17-12-4" /></>,
    <><circle cx="32" cy="32" r="24" /><circle cx="32" cy="32" r="12" /><path d="M32 8v12M56 32H44M32 56V44M8 32h12" /><circle cx="32" cy="32" r="3" /></>,
    <><circle cx="32" cy="32" r="24" /><path d="M8 32h48M32 8c8 7 12 15 12 24S40 49 32 56c-8-7-12-15-12-24S24 15 32 8ZM13 20h38M13 44h38" /></>,
    <><circle cx="32" cy="32" r="24" /><path d="M40 18H23l12 14-12 14h17" /></>,
    <><path d="M32 7 53 15v16c0 13-8 21-21 27C19 52 11 44 11 31V15L32 7Z" /><path d="m23 32 6 6 13-14" /></>,
    <><path d="M15 8h25l10 10v38H15V8Z" /><path d="M40 8v11h10M23 28h19M23 36h13M23 44h9" /><circle cx="43" cy="43" r="7" /><path d="m48 48 7 7" /></>,
  ];

  return <svg viewBox="0 0 64 64" aria-hidden>{icons[index]}</svg>;
};

const siteFacts = [
  [4, "Process Stages"],
  [4, "Mandate Arenas"],
  [3, "Global Presences"],
  [3, "Core Disciplines"],
  [4, "Architecture Controls"],
  [6, "Research Notes"],
] as const;

const Home = () => {
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const [scrollCueVisible, setScrollCueVisible] = useState(true);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "8%"]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1.03, 1.065]);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Hide once the hero has scrolled ~38% of the viewport away so the cue
        // never sits on the next section. Keyed to the viewport, not the hero's
        // own height: the hero can exceed 100svh on small screens, where an
        // intersectionRatio test could never pass and the cue would never show.
        const viewportH = entry.rootBounds?.height ?? window.innerHeight;
        setScrollCueVisible(entry.isIntersecting && entry.boundingClientRect.top >= viewportH * -0.38);
      },
      { threshold: Array.from({ length: 21 }, (_, i) => i / 20) },
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <section ref={heroRef} className="home-reference-hero reference-hero relative flex min-h-[100svh] flex-col overflow-hidden border-b border-gold/20 px-5 pt-28 sm:px-6 sm:pt-32 lg:h-screen lg:min-h-0 lg:px-16 lg:pt-70">
        {/* Clip parallax only; stays behind the traveling gem (scene-behind). */}
        <div className="scene-behind pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <motion.div className="home-hero-bg absolute inset-0" style={reduce ? undefined : { y: heroY, scale: heroScale }} />
          <div className="reference-stars absolute inset-0" />
        </div>
        <div className="hero-side-dots hidden lg:grid" aria-hidden><b /><i /><i /><i /><i /></div>
        <div className="scene-content relative z-10 flex min-h-0 flex-1 items-start py-2 pb-[13.5rem] sm:py-4 sm:pb-[14rem] lg:items-center min-[1181px]:py-0 min-[1181px]:pb-20">
          <motion.div
            className="hero-copy relative min-w-0 max-w-3xl lg:max-w-[720px]"
            initial={reduce ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: reduce ? 0 : 0.7 }}
          >
            <Eyebrow>{BRAND.badge}</Eyebrow>
            <h1 className="mt-5 text-display text-[2.35rem] leading-[1.05] text-ghost sm:mt-7 sm:text-7xl sm:leading-[.98] lg:text-[6.5rem]">
              {HERO.headlineLead}<br />
              <span className="text-gold-gradient">{HERO.headlineAccent}</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm font-light leading-relaxed text-silver/80 sm:mt-7 sm:text-base lg:text-lg">
              {HERO.sub}
            </p>
            <div className="mt-8 flex w-full flex-col gap-3 sm:mt-10 sm:w-auto sm:flex-row sm:gap-4">
              <Button to="/firm" variant="primary" className="w-full sm:w-auto">Explore Our Philosophy</Button>
              <Button to="/strategy" variant="outline" className="w-full sm:w-auto">Our Strategies</Button>
            </div>
          </motion.div>
        </div>
        <div
          className={cn("hero-scroll", !scrollCueVisible && "hero-scroll-away")}
          aria-hidden={!scrollCueVisible}
        >
          <i aria-hidden />
          Scroll to explore
        </div>
        <MarketIntelligence />
      </section>

      <Section
        className="philosophy-showcase reference-panel overflow-hidden border-b border-gold/15 lg:flex lg:h-screen lg:items-center"
        spacing="py-12 lg:py-8"
      >
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_18rem]">
          <div>
            <Stagger className="max-w-3xl">
              <StaggerItem><Eyebrow>{CORE_PHILOSOPHY.eyebrow}</Eyebrow></StaggerItem>
              <StaggerItem><h2 className="mt-5 text-display text-4xl text-ghost lg:text-6xl">The Architecture of Alpha</h2></StaggerItem>
              <StaggerItem><p className="mt-4 max-w-2xl text-sm leading-relaxed text-silver/60">{CORE_PHILOSOPHY.intro}</p></StaggerItem>
            </Stagger>
            <Stagger className="philosophy-card-grid mt-6 grid gap-4 sm:mt-8 sm:gap-6 md:grid-cols-3" gap={0.14}>
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

      <Section className="kev-engine reference-engine border-b border-gold/15 lg:overflow-hidden">
        <div className="kev-engine-layout grid items-center gap-10 sm:gap-12 lg:grid-cols-[310px_1fr] lg:gap-14">
          <Stagger>
            <StaggerItem><Eyebrow>The Quant Engine</Eyebrow></StaggerItem>
            <StaggerItem><h2 className="mt-5 text-display text-4xl text-ghost lg:text-6xl">Turning Complexity<br />Into Conviction</h2></StaggerItem>
            <StaggerItem><p className="mt-5 max-w-sm text-sm leading-relaxed text-silver/65">{STRATEGY.hero.body}</p></StaggerItem>
            <StaggerItem><div className="mt-8"><Button to="/strategy" variant="outline">See Our Strategies</Button></div></StaggerItem>
          </Stagger>
          <Reveal>
            <div className="kev-flow" aria-label="Systematic quantitative process">
              {quantFlow.map(([, label], index) => (
                <Fragment key={label}>
                  <div className="kev-stage">
                    <div className="kev-hex">
                      <span className="kev-hex-icon" aria-hidden><QuantIcon index={index} /></span>
                    </div>
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
                  <div className={i ? "kev-mini kev-goldline" : "kev-mini kev-redline"} aria-hidden />
                </article>
              </Fragment>
            ))}
          </Stagger>
        </div>
      </Section>

      <Section className="facts-section overflow-hidden border-b border-gold/15" spacing="py-14 lg:py-16">
        <div className="facts-heading relative z-10 mb-6 flex flex-col gap-2 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <Eyebrow>By the Structure</Eyebrow>
          <span className="max-w-sm text-[10px] uppercase leading-relaxed tracking-[.16em] text-silver/55 sm:max-w-md sm:text-right sm:text-xs sm:tracking-[.2em]">
            Counts derived from this site’s published structure
          </span>
        </div>
        <Stagger className="facts-grid" gap={.1}>
          {siteFacts.map(([value, label], index) => (
            <StaggerItem key={label}>
              <article>
                <i aria-hidden><FactIcon index={index} /></i>
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

      <section className="reference-quote relative grid min-h-[min(600px,85svh)] place-items-center overflow-hidden border-b border-gold/15 px-5 py-20 text-center sm:min-h-[600px] sm:px-6 sm:py-28">
        <div className="scene-behind quote-stars absolute inset-0" aria-hidden />
        <Reveal className="scene-content relative z-10 mx-auto w-full max-w-5xl">
          <Eyebrow centered>Precision, Systematized</Eyebrow>
          <blockquote className="quote-statement mt-6 font-serif text-[1.85rem] font-semibold leading-[1.08] text-ghost sm:mt-8 sm:text-6xl sm:leading-[1.05] lg:text-8xl">
            <span className="quote-line">Markets misprice human</span>
            <span className="quote-line">emotion. We express it</span>
            <span className="quote-line text-gold-gradient">mathematically.</span>
          </blockquote>
          <div className="mt-8 sm:mt-10"><Button to="/contact" variant="primary">Contact Obsidian Quant</Button></div>
        </Reveal>
      </section>

      <section className="reference-closing relative overflow-hidden px-5 py-20 sm:px-6 sm:py-28 lg:px-16 lg:py-40">
        <div className="scene-content mx-auto grid max-w-7xl items-center lg:grid-cols-[1fr_.8fr]">
          <Stagger className="relative z-10 max-w-2xl">
            <StaggerItem><Eyebrow>Built Different</Eyebrow></StaggerItem>
            <StaggerItem><h2 className="mt-5 text-display text-4xl text-ghost sm:mt-6 sm:text-5xl lg:text-7xl">{ARCHITECTURE.title}</h2></StaggerItem>
            <StaggerItem><p className="mt-5 max-w-lg text-sm leading-relaxed text-silver/70 sm:mt-6">{ARCHITECTURE.body}</p></StaggerItem>
            <StaggerItem><div className="mt-8 sm:mt-9"><Button to="/contact" variant="primary">Partner With Obsidian</Button></div></StaggerItem>
          </Stagger>
          <div className="hidden lg:block" aria-hidden />
        </div>
      </section>
    </>
  );
};

export default memo(Home);
