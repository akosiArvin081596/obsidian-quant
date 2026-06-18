import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { EASE_LUX } from "../lib/motion";

type RevealProps = {
  children: ReactNode;
  /** Seconds to delay the entrance — useful for sequencing. */
  delay?: number;
  /** Vertical travel distance in px. */
  y?: number;
  className?: string;
};

/** Fades + lifts its children into view once, on scroll. */
const Reveal = ({ children, delay = 0, y = 26, className }: RevealProps) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-90px" }}
    transition={{ duration: 0.75, delay, ease: EASE_LUX }}
  >
    {children}
  </motion.div>
);

export default Reveal;
