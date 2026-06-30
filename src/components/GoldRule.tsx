import { motion, useReducedMotion } from "framer-motion";
import { cn } from "../lib/cn";
import { EASE_LUX } from "../lib/motion";

type GoldRuleProps = {
  className?: string;
  /** Place a diamond marker in the centre. */
  diamond?: boolean;
};

/**
 * Hairline gold divider with an optional diamond connector. Draws in from the
 * centre when scrolled into view (renders static under reduced motion).
 */
const GoldRule = ({ className, diamond = true }: GoldRuleProps) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={cn("flex items-center", className)}
      aria-hidden
      style={{ transformOrigin: "center" }}
      initial={reduce ? false : { scaleX: 0, opacity: 0 }}
      whileInView={reduce ? undefined : { scaleX: 1, opacity: 1 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 1.1, ease: EASE_LUX }}
    >
      <span className="gold-rule flex-1" />
      {diamond && <span className="mx-3 h-1.5 w-1.5 rotate-45 bg-gold/70" />}
      <span className="gold-rule flex-1" />
    </motion.div>
  );
};

export default GoldRule;
