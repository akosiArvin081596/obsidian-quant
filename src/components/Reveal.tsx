import type { ReactNode } from "react";
import { cn } from "../lib/cn";

type RevealProps = {
  children: ReactNode;
  /** Accepted for compatibility — the reveal is now scroll-driven. */
  delay?: number;
  y?: number;
  className?: string;
};

/**
 * Scroll-driven reveal: the element rises out of a blur tied to its position
 * as it travels up through the viewport (see `.sd-reveal` in index.css).
 * The scroll IS the animation — it never plays on its own.
 */
const Reveal = ({ children, className }: RevealProps) => (
  <div className={cn("sd-reveal", className)}>{children}</div>
);

export default Reveal;
