import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLocation } from "react-router-dom";
import ObsidianGemImage from "./ObsidianGemImage";

type GemPose = {
  left: string;
  top: string;
  width: number;
  rotate: number;
  opacity: number;
};

const POSES: GemPose[] = [
  { left: "72vw", top: "54vh", width: 480, rotate: 0, opacity: 1 },
  { left: "88vw", top: "54vh", width: 300, rotate: -22, opacity: .92 },
  { left: "8vw", top: "46vh", width: 155, rotate: 0, opacity: .7 },
  { left: "88vw", top: "52vh", width: 270, rotate: 20, opacity: .9 },
  { left: "8vw", top: "48vh", width: 220, rotate: -18, opacity: .82 },
  { left: "84vw", top: "48vh", width: 225, rotate: 18, opacity: .82 },
  { left: "50vw", top: "35vh", width: 150, rotate: 0, opacity: .8 },
  { left: "72vw", top: "31vh", width: 300, rotate: 0, opacity: .95 },
];

const MOBILE_POSES: GemPose[] = [
  { left: "50vw", top: "220px", width: 220, rotate: 0, opacity: 0.78 },
];

const STANDARD_PAGE_HERO_POSE: GemPose = {
  left: "71vw",
  top: "16rem",
  width: 320,
  rotate: 0,
  opacity: .92,
};

const STANDARD_PAGE_HERO_PATHS = new Set([
  "/firm",
  "/strategy",
  "/architecture",
  "/insights",
]);

/** Last scene before footer — gem lifted so the base clears the footer edge. */
const CLOSING_SECTION_POSE: GemPose = {
  left: "10vw",
  top: "26vh",
  width: 190,
  rotate: -14,
  opacity: 0.88,
};

const HOME_CLOSING_POSE: GemPose = {
  left: "71vw",
  top: "32vh",
  width: 280,
  rotate: 0,
  opacity: 0.92,
};

/** Pull pose center upward on the last section (footer follows immediately after). */
const liftPoseAboveFooter = (pose: GemPose): GemPose => {
  if (pose.top.endsWith("vh")) {
    const vh = parseFloat(pose.top);
    return {
      ...pose,
      top: `${Math.min(vh, 30)}vh`,
      width: Math.round(pose.width * 0.92),
    };
  }

  if (pose.top.endsWith("rem")) {
    return { ...pose, top: "11rem", width: Math.round(pose.width * 0.9) };
  }

  return pose;
};

/** Center of the scroll focus band (matches IntersectionObserver rootMargin). */
const FOCUS_RATIO = 0.45;

const pickActiveSection = (sections: HTMLElement[]) => {
  const focusY = window.innerHeight * FOCUS_RATIO;
  let bestIndex = 0;
  let bestDistance = Infinity;

  sections.forEach((section, index) => {
    const rect = section.getBoundingClientRect();
    const distance = Math.abs(rect.top + rect.height / 2 - focusY);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });

  return bestIndex;
};

/**
 * Recreates the reference site's scroll choreography: sections reveal as a
 * scene, while one persistent gem travels between section-specific poses.
 */
const ScrollChoreography = () => {
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [sectionCount, setSectionCount] = useState(0);
  const [mobile, setMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 1023px)").matches : false,
  );

  useEffect(() => {
    const query = window.matchMedia("(max-width: 1023px)");
    const onChange = () => setMobile(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    let observer: IntersectionObserver | undefined;
    let mutationObserver: MutationObserver | undefined;
    let setupFrame = 0;
    let scrollFrame = 0;
    let sections: HTMLElement[] = [];

    const syncActive = () => {
      if (reduce || sections.length === 0) return;
      setActive(pickActiveSection(sections));
    };

    const onScrollOrResize = () => {
      cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(syncActive);
    };

    const bindSections = () => {
      const next = Array.from(document.querySelectorAll<HTMLElement>("main section"));
      const changed =
        next.length !== sections.length || next.some((section, index) => section !== sections[index]);
      if (!changed && sections.length > 0) return;

      observer?.disconnect();
      sections = next;
      setSectionCount(sections.length);
      sections.forEach((section, index) => {
        section.classList.add("scroll-scene");
        section.style.setProperty("--scene-index", String(index));
      });

      if (reduce) {
        sections.forEach((section) => section.classList.add("scene-visible"));
        return;
      }

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) entry.target.classList.add("scene-visible");
          });
        },
        { rootMargin: "-12% 0px -18%", threshold: 0 },
      );
      sections.forEach((section) => observer?.observe(section));
      sections[0]?.classList.add("scene-visible");
      syncActive();
    };

    setupFrame = requestAnimationFrame(() => {
      setActive(0);
      bindSections();

      if (!reduce) {
        window.addEventListener("scroll", onScrollOrResize, { passive: true });
        window.addEventListener("resize", onScrollOrResize, { passive: true });
      }

      // Lazy routes / late DOM: rebind when main children change so the gem keeps tracking.
      const main = document.querySelector("main");
      if (main && typeof MutationObserver !== "undefined") {
        mutationObserver = new MutationObserver(() => {
          cancelAnimationFrame(setupFrame);
          setupFrame = requestAnimationFrame(bindSections);
        });
        mutationObserver.observe(main, { childList: true, subtree: true });
      }
    });

    return () => {
      cancelAnimationFrame(setupFrame);
      cancelAnimationFrame(scrollFrame);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      observer?.disconnect();
      mutationObserver?.disconnect();
    };
  }, [pathname, reduce]);

  const pose = useMemo(() => {
    if (!mobile && active === 0 && STANDARD_PAGE_HERO_PATHS.has(pathname)) {
      return STANDARD_PAGE_HERO_POSE;
    }

    const poses = mobile ? MOBILE_POSES : POSES;
    const base = poses[active % poses.length];
    const isLastSection = sectionCount > 0 && active === sectionCount - 1;

    if (isLastSection) {
      if (!mobile) {
        if (pathname === "/") return HOME_CLOSING_POSE;
        if (STANDARD_PAGE_HERO_PATHS.has(pathname)) return CLOSING_SECTION_POSE;
        return liftPoseAboveFooter(base);
      }

      return { ...base, top: "160px", width: Math.round(base.width * 0.88) };
    }

    return base;
  }, [active, mobile, pathname, sectionCount]);

  // Keep the stone visible under prefers-reduced-motion — only skip motion, not the asset.
  const visibleOpacity = Math.max(pose.opacity, 0.72);

  return (
    <motion.div
      aria-hidden
      className="scroll-gem pointer-events-none fixed -translate-x-1/2 -translate-y-1/2"
      initial={false}
      animate={{
        left: pose.left,
        top: pose.top,
        width: pose.width,
        rotate: reduce ? 0 : pose.rotate,
        opacity: reduce ? visibleOpacity : pose.opacity,
      }}
      transition={
        reduce
          ? { duration: 0 }
          : {
              type: "spring",
              stiffness: 38,
              damping: 19,
              mass: 1.18,
              restDelta: 0.01,
              restSpeed: 0.01,
            }
      }
    >
      {!reduce && (
        <motion.div
          className="absolute inset-[8%] rounded-full border border-gold/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 34, repeat: Infinity, ease: "linear" }}
        />
      )}
      <motion.div
        className="relative w-full"
        animate={reduce ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <ObsidianGemImage
          priority
          className="relative w-full object-contain drop-shadow-[0_0_34px_rgba(184,138,74,.36)]"
        />
      </motion.div>
    </motion.div>
  );
};

export default ScrollChoreography;
