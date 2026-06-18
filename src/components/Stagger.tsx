import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { stagger, fadeUp } from "../lib/motion";

type StaggerProps = {
  children: ReactNode;
  className?: string;
  /** Override the gap (seconds) between each child's entrance. */
  gap?: number;
};

/**
 * Container that reveals its <StaggerItem> children sequentially when scrolled
 * into view — a clean one-by-one cascade rather than a single group fade.
 */
export const Stagger = ({ children, className, gap }: StaggerProps) => (
  <motion.div
    className={className}
    variants={
      gap
        ? { hidden: {}, show: { transition: { staggerChildren: gap, delayChildren: 0.06 } } }
        : stagger
    }
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, margin: "-80px" }}
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
