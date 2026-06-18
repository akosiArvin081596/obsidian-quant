import { useRef } from "react";
import type { ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Accepted for compatibility; the scroll position drives the timing now. */
  delay?: number;
  y?: number;
};

/**
 * Scroll-LINKED reveal (GSAP ScrollTrigger, works in every browser): opacity,
 * lift and blur are scrubbed to the element's own scroll position, so it eases
 * in as it rises from the lower viewport toward the middle. It never autoplays.
 * Honours prefers-reduced-motion by simply showing the content.
 */
const Reveal = ({ children, className }: RevealProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      // Reduced motion: show immediately, no hide and no ScrollTrigger.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(el, { opacity: 1, y: 0, filter: "blur(0px)" });
        return;
      }

      gsap.fromTo(
        el,
        { opacity: 0, y: 44, filter: "blur(8px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            end: "top 55%",
            scrub: true,
          },
        }
      );
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={className} style={{ opacity: 0 }}>
      {children}
    </div>
  );
};

export default Reveal;
