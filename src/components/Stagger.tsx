import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { fadeUp } from "../lib/motion";

type StaggerProps = {
  children: ReactNode;
  className?: string;
  /** Seconds between each child's entrance. */
  gap?: number;
  /** Seconds to wait before the first child (e.g. to start after another column). */
  delay?: number;
};

/**
 * Container that reveals its <StaggerItem> children strictly in order when
 * scrolled into view — a clean one-by-one cascade in DOM (reading) order.
 */
export const Stagger = ({ children, className, gap = 0.32, delay = 0 }: StaggerProps) => (
  <motion.div
    className={className}
    variants={{
      hidden: {},
      show: { transition: { staggerChildren: gap, delayChildren: 0.05 + delay } },
    }}
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, margin: "-70px" }}
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <motion.div className={className} variants={fadeUp}>
    {children}
  </motion.div>
);
