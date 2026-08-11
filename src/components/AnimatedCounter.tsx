"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { useIsClient } from "../hooks/useIsClient";

type Props = { value: number; suffix?: string };

/**
 * Count-up for display. Server markup always carries the final value so
 * crawlers never index "0 Process Stages"; the client swaps to the animated
 * figure at hydration — not when the section scrolls into view, which would
 * make a settled number visibly snap back to zero — and counts up from there.
 */
const AnimatedCounter = ({ value, suffix = "" }: Props) => {
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useInView(ref, { once: true, amount: 0.45 });
  const reduce = useReducedMotion();
  const isClient = useIsClient();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!visible || reduce) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / 1300, 1);
      setDisplay(Math.floor(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduce, value, visible]);

  return (
    <span ref={ref}>
      {isClient && !reduce ? display : value}
      {suffix}
    </span>
  );
};

export default AnimatedCounter;
