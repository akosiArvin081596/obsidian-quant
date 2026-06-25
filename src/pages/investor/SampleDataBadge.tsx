import { cn } from "../../lib/cn";

/**
 * Visible "illustrative / sample data" cue for member-area screens that show
 * figures or charts. The private area demonstrates the experience with sample
 * numbers — this badge keeps that unmistakable so nothing reads as a claim.
 */
const SampleDataBadge = ({ className }: { className?: string }) => (
  <span
    className={cn(
      "inline-flex items-center gap-2 border border-gold/25 bg-gold/5 px-3 py-1.5 text-[0.56rem] font-semibold uppercase tracking-[0.2em] text-gold",
      className,
    )}
  >
    <span className="h-1.5 w-1.5 rotate-45 bg-gold" aria-hidden />
    Illustrative · sample data
  </span>
);

export default SampleDataBadge;
