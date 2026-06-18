import type { Variants } from "framer-motion";

/** Brand easing — a long, confident settle. */
export const EASE_LUX: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Single element entrance — rises and resolves out of a soft blur. Deliberate. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 44, filter: "blur(10px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 1.2, ease: EASE_LUX },
  },
};

/** Parent that cascades its children in — one by one, with weight. */
export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.22, delayChildren: 0.1 } },
};
