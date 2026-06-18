import type { Variants } from "framer-motion";

/** Brand easing — a long, confident settle. */
export const EASE_LUX: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Single element entrance — rises and resolves out of a soft blur. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: EASE_LUX },
  },
};

/** Parent that cascades its children in — one by one, not as a block. */
export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13, delayChildren: 0.06 } },
};
