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

/** Fades + lifts children into view once, resolving out of a soft blur. Deliberate pace. */
const Reveal = ({ children, delay = 0, y = 44, className }: RevealProps) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y, filter: "blur(10px)" }}
    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
    viewport={{ once: true, margin: "-110px" }}
    transition={{ duration: 1.2, delay, ease: EASE_LUX }}
  >
    {children}
  </motion.div>
);

export default Reveal;
