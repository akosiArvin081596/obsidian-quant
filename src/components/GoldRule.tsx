import { cn } from "../lib/cn";

type GoldRuleProps = {
  className?: string;
  /** Place a diamond marker in the centre. */
  diamond?: boolean;
};

/** Hairline gold divider with an optional diamond connector. */
const GoldRule = ({ className, diamond = true }: GoldRuleProps) => (
  <div className={cn("flex items-center", className)} aria-hidden>
    <span className="gold-rule flex-1" />
    {diamond && <span className="mx-3 h-1.5 w-1.5 rotate-45 bg-gold/70" />}
    <span className="gold-rule flex-1" />
  </div>
);

export default GoldRule;
