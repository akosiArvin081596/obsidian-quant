import Eyebrow from "./Eyebrow";
import Reveal from "./Reveal";
import AuroraRibbon from "./AuroraRibbon";
import Parallax from "./Parallax";

type PageHeroProps = {
  eyebrow: string;
  index?: string;
  title: string;
  body?: string;
};

/** Standard sub-page header — clears the fixed nav, sets the tone. */
const PageHero = ({ eyebrow, index, title, body }: PageHeroProps) => (
  <section className="reference-hero relative overflow-hidden border-b border-gold/20 px-6 pb-20 pt-40 lg:px-16 lg:pb-24 lg:pt-48">
    <Parallax className="absolute inset-0" speed={0.25}>
      <AuroraRibbon intensity={0.4} className="opacity-50" />
    </Parallax>
    {/* ambient gold bloom behind the heading */}
    <div
      aria-hidden
      className="gold-bloom pointer-events-none absolute left-[10%] top-1/2 h-[26rem] w-[26rem] -translate-y-1/2"
    />
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-obsidian/30 to-obsidian" />
    <div className="relative z-10 mx-auto max-w-7xl">
      <Reveal>
        <Eyebrow index={index}>{eyebrow}</Eyebrow>
        <h1 className="mt-6 max-w-4xl text-display text-5xl text-ghost lg:text-7xl">
          {title}
        </h1>
        {body && (
          <p className="mt-6 max-w-2xl text-base font-light leading-relaxed text-silver/65">
            {body}
          </p>
        )}
      </Reveal>
    </div>
  </section>
);

export default PageHero;
