import { cn } from "../lib/cn";

type EyebrowProps = {
  children: React.ReactNode;
  /** Optional section index, e.g. "01". */
  index?: string;
  /** Center-align (with rule on both sides). */
  centered?: boolean;
  className?: string;
};

/** Gold kicker label with a diamond marker — the brand "section label". */
const Eyebrow = ({ children, index, centered, className }: EyebrowProps) => (
  <div
    className={cn(
      "flex items-center gap-3 eyebrow",
      centered && "justify-center",
      className,
    )}
  >
    <span className="h-1.5 w-1.5 rotate-45 bg-gold" aria-hidden />
    {index && <span className="text-gold/70">{index}</span>}
    {index && <span className="text-gold/40" aria-hidden>/</span>}
    <span className="text-gold">{children}</span>
    {centered && (
      <span className="h-px w-8 bg-gradient-to-r from-gold/50 to-transparent" aria-hidden />
    )}
  </div>
);

export default Eyebrow;
