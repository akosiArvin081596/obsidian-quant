import { useRef } from "react";
import type { ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

type ParallaxProps = {
  children: ReactNode;
  className?: string;
  /** Drift as a fraction of the element's scroll progress; +ve drifts down. */
  speed?: number;
};

/**
 * Translates its children vertically as they scroll through the viewport, for
 * layered depth. No-ops (renders a plain div) under reduced motion.
 */
const Parallax = ({ children, className, speed = 0.2 }: ParallaxProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", `${speed * 100}%`]);

  if (reduce) return <div ref={ref} className={className}>{children}</div>;

  return (
    <motion.div ref={ref} className={className} style={{ y }}>
      {children}
    </motion.div>
  );
};

export default Parallax;
