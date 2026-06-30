import { useRef } from "react";
import type { PointerEvent, ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "../lib/cn";

type SpotlightProps = {
  children: ReactNode;
  className?: string;
  /** Glow radius in px. */
  size?: number;
  /** Glow strength, 0–1. */
  strength?: number;
};

/**
 * Wraps content with a soft gold glow that follows the pointer — lights up
 * card surfaces and the gaps between them. Inert on touch / reduced motion.
 */
const Spotlight = ({
  children,
  className,
  size = 420,
  strength = 0.14,
}: SpotlightProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
    el.style.setProperty("--glow", "1");
  };
  const onLeave = () => ref.current?.style.setProperty("--glow", "0");

  return (
    <div
      ref={ref}
      className={cn("relative isolate", className)}
      onPointerMove={reduce ? undefined : onMove}
      onPointerLeave={reduce ? undefined : onLeave}
    >
      {!reduce && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 transition-opacity duration-500"
          style={{
            opacity: "var(--glow, 0)",
            background: `radial-gradient(${size}px circle at var(--mx, 50%) var(--my, 50%), rgba(184,138,74,${strength}), transparent 65%)`,
          }}
        />
      )}
      {children}
    </div>
  );
};

export default Spotlight;
