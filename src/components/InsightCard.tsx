import { cn } from "../lib/cn";

type Article = {
  tag: string;
  date: string;
  title: string;
  read: string;
  body: string;
};

type InsightCardProps = {
  article: Article;
  /** Larger editorial treatment — spans two columns on the grid. */
  featured?: boolean;
};

/**
 * Editorial research card — hairline border, gold tag chip, serif title,
 * and a "Read" affordance that activates on hover. The featured variant
 * scales the type and reflows to a row on wide viewports.
 */
const InsightCard = ({ article, featured = false }: InsightCardProps) => (
  <article
    className={cn(
      "group relative z-10 flex h-full flex-col justify-between border border-gold/10 bg-obsidian/80 p-8 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:border-gold/30 hover:bg-ink active:bg-ink lg:bg-obsidian/40 lg:hover:bg-obsidian/70",
      featured && "lg:p-10",
    )}
  >
    <div className={cn(featured && "lg:max-w-3xl")}>
      {/* Tag chip + date */}
      <div className="flex items-center gap-4">
        <span className="inline-flex items-center gap-2 border border-gold/25 bg-midnight/50 px-3 py-1 text-[0.6rem] uppercase tracking-[0.22em] text-gold">
          <span className="h-1 w-1 rotate-45 bg-gold" aria-hidden />
          {article.tag}
        </span>
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-silver/40">
          {article.date}
        </span>
      </div>

      <h3
        className={cn(
          "mt-6 text-display text-ghost transition-colors duration-500 group-hover:text-gold-gradient",
          featured ? "text-3xl lg:text-5xl" : "text-2xl",
        )}
      >
        {article.title}
      </h3>
      <p
        className={cn(
          "mt-4 font-light leading-relaxed text-silver/75 lg:text-silver/65",
          featured ? "max-w-xl text-sm lg:text-base" : "text-xs",
        )}
      >
        {article.body}
      </p>
    </div>

    {/* Footer: read time + affordance */}
    <div className="mt-8 flex items-center justify-between border-t border-silver/10 pt-5">
      <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-silver/40">
        {article.read} read
      </span>
      <span className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-silver/50 transition-colors duration-500 group-hover:text-gold">
        Read
        <span
          className="transition-transform duration-500 group-hover:translate-x-1"
          aria-hidden
        >
          &rarr;
        </span>
      </span>
    </div>
  </article>
);

export default InsightCard;
