import type { Variants } from "framer-motion";

/** Brand easing — a long, confident settle. */
export const EASE_LUX: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Single element entrance — a slow, smooth rise out of a soft blur. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 26, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 1.1, ease: EASE_LUX },
  },
};

/** Parent that reveals its children strictly in order (DOM = reading order). */
export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.3, delayChildren: 0.05 } },
};
