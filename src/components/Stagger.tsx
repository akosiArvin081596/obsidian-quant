import { useRef } from "react";
import type { ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type StaggerItemProps = {
  children: ReactNode;
  className?: string;
};

/**
 * A single revealable cell. It owns no animation — the parent <Stagger>
 * scrubs all of its direct children — so this stays a plain div that lands in
 * `ref.current.children`. Starts hidden to avoid a flash before GSAP inits.
 */
export const StaggerItem = ({ children, className }: StaggerItemProps) => (
  <div className={className} style={{ opacity: 0 }}>
    {children}
  </div>
);

type StaggerProps = {
  children: ReactNode;
  className?: string;
  /** Accepted for compatibility; the scroll position drives the timing now. */
  gap?: number;
  delay?: number;
};

/**
 * Layout container for a group of scroll-linked items. Keeps its grid/flex
 * classes and scrubs its direct children in DOM order (left-to-right /
 * top-to-bottom) as the group rises through the viewport. Never autoplays.
 * Honours prefers-reduced-motion by simply showing the content.
 */
export const Stagger = ({ children, className }: StaggerProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const items = el.children;

      // Reduced motion: show immediately, no hide and no ScrollTrigger.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(items, { opacity: 1, y: 0, filter: "blur(0px)" });
        return;
      }

      gsap.fromTo(
        items,
        { opacity: 0, y: 44, filter: "blur(8px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          ease: "none",
          stagger: 0.12,
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            end: "top 40%",
            scrub: true,
          },
        }
      );
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};
