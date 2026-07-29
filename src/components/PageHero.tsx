"use client";

import Eyebrow from "./Eyebrow";
import Reveal from "./Reveal";
import AuroraRibbon from "./AuroraRibbon";
import Parallax from "./Parallax";
import { cn } from "../lib/cn";

type PageHeroProps = {
  eyebrow: string;
  index?: string;
  title: string;
  body?: string;
  standardHeight?: boolean;
};

/** Standard sub-page header — clears the fixed nav, sets the tone. */
const PageHero = ({ eyebrow, index, title, body, standardHeight = false }: PageHeroProps) => (
  <section
    className={cn(
      "reference-hero relative overflow-hidden border-b border-gold/20 px-5 pb-14 pt-32 sm:px-6 sm:pb-20 sm:pt-40 lg:px-16 lg:pb-24 lg:pt-48",
      standardHeight && "lg:h-[36rem]",
    )}
  >
    <Parallax className="scene-behind absolute inset-0" speed={0.25}>
      <AuroraRibbon intensity={0.4} className="opacity-50" />
    </Parallax>
    {/* ambient gold bloom behind the heading */}
    <div
      aria-hidden
      className="scene-behind gold-bloom pointer-events-none absolute left-[10%] top-1/2 h-[18rem] w-[18rem] -translate-y-1/2 sm:h-[26rem] sm:w-[26rem]"
    />
    <div className="scene-behind pointer-events-none absolute inset-0 bg-gradient-to-b from-obsidian/30 to-obsidian" />
    <div className="scene-content relative z-10 mx-auto max-w-7xl">
      <Reveal>
        <Eyebrow index={index}>{eyebrow}</Eyebrow>
        <h1 className="mt-5 max-w-4xl text-display text-[2.15rem] leading-[1.08] text-ghost sm:mt-6 sm:text-5xl sm:leading-none lg:text-7xl">
          {title}
        </h1>
        {body && (
          <p className="mt-5 max-w-2xl text-sm font-light leading-relaxed text-silver/65 sm:mt-6 sm:text-base">
            {body}
          </p>
        )}
      </Reveal>
    </div>
  </section>
);

export default PageHero;
