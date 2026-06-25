import type { ReactNode } from "react";
import Eyebrow from "../../components/Eyebrow";
import GoldRule from "../../components/GoldRule";
import HexField from "../../components/HexField";

type ComingSoonProps = {
  eyebrow: string;
  index?: string;
  title: string;
  body: string;
  /** Illustrative, clearly-placeholder rows for the screen being previewed. */
  preview: ReactNode;
};

/**
 * Shared frame for a not-yet-built member screen. Names the destination, sets
 * expectations, and previews its eventual shape with obviously-placeholder
 * content (no fabricated figures).
 */
const ComingSoon = ({ eyebrow, index, title, body, preview }: ComingSoonProps) => (
  <div>
    <header className="max-w-2xl">
      <Eyebrow index={index}>{eyebrow}</Eyebrow>
      <h1 className="mt-5 text-display text-4xl text-ghost lg:text-5xl">{title}</h1>
      <p className="mt-4 text-sm font-light leading-relaxed text-silver/60">{body}</p>
      <div className="mt-6 inline-flex items-center gap-2.5 border border-gold/25 bg-gold/5 px-4 py-2">
        <span className="h-1.5 w-1.5 rotate-45 bg-gold" aria-hidden />
        <span className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-gold">
          Coming Soon
        </span>
      </div>
    </header>

    <GoldRule className="my-10 max-w-4xl" />

    {/* Previewed shape of the screen — deliberately inert + unlabelled data. */}
    <div className="relative overflow-hidden border border-gold/10 bg-midnight/40 p-6 gold-grid lg:p-8">
      <HexField className="pointer-events-none absolute -right-6 -top-6 w-40 opacity-30" />
      <div className="relative z-10">
        <div className="mb-5 flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-silver/40">
          <span className="h-1.5 w-1.5 rounded-full bg-slate" aria-hidden />
          Preview · placeholder layout
        </div>
        {preview}
      </div>
    </div>
  </div>
);

export default ComingSoon;
