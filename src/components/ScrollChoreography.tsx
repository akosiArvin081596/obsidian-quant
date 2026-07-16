import { useEffect, useMemo, useRef, useState } from "react";
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
  { left: "50vw", top: "48vh", width: 150, rotate: 0, opacity: .8 },
  { left: "72vw", top: "48vh", width: 300, rotate: 0, opacity: .95 },
];

const MOBILE_POSES: GemPose[] = [
  { left: "50vw", top: "190px", width: 168, rotate: 0, opacity: 0.72 },
];

const STANDARD_PAGE_HERO_POSE: GemPose = {
  left: "71vw",
  top: "16rem",
  width: 320,
  rotate: 0,
  opacity: .92,
};

/** Contact — stay in the hero seat (no travel on scroll). */
const CONTACT_HERO_MOBILE_POSE: GemPose = {
  left: "78vw",
  top: "11rem",
  width: 140,
  rotate: 0,
  opacity: 0.55,
};

const STANDARD_PAGE_HERO_PATHS = new Set([
  "/firm",
  "/strategy",
  "/architecture",
  "/contact",
]);

/** Firm “Operating Principles” — park the stone in the vacant right rail. */
const FIRM_PRINCIPLES_POSE: GemPose = {
  left: "84vw",
  top: "44vh",
  width: 230,
  rotate: 14,
  opacity: 0.9,
};

const FIRM_PRINCIPLES_MOBILE_POSE: GemPose = {
  left: "88vw",
  top: "36%",
  width: 130,
  rotate: 10,
  opacity: 0.42,
};

/** Last scene before footer — aesthetic resting pose; footer clamp still applies. */
const CLOSING_SECTION_POSE: GemPose = {
  left: "10vw",
  top: "42vh",
  width: 190,
  rotate: -14,
  opacity: 0.88,
};

/** Home closing — vertically centered with the “Built Different” copy. */
const HOME_CLOSING_POSE: GemPose = {
  left: "74vw",
  top: "50vh",
  width: 280,
  rotate: 0,
  opacity: 0.92,
};

const HOME_CLOSING_MOBILE_POSE: GemPose = {
  left: "82vw",
  top: "52%",
  width: 140,
  rotate: 0,
  opacity: 0.5,
};

/** Gem asset is taller than wide; used until the DOM can be measured. */
const GEM_HEIGHT_RATIO = 1.62;
const FOOTER_GAP_DESKTOP = 24;
const FOOTER_GAP_MOBILE = 14;
/** Extra pad for the idle float animation amplitude. */
const FLOAT_PAD = 12;

/** Center of the scroll focus band (matches IntersectionObserver rootMargin). */
const FOCUS_RATIO = 0.45;

const resolveLengthPx = (value: string, viewportSize: number): number => {
  const trimmed = value.trim();
  const amount = parseFloat(trimmed);
  if (!Number.isFinite(amount)) return 0;
  if (trimmed.endsWith("vh") || trimmed.endsWith("%")) return (amount / 100) * viewportSize;
  if (trimmed.endsWith("vw")) return (amount / 100) * window.innerWidth;
  if (trimmed.endsWith("rem")) {
    const root = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return amount * root;
  }
  return amount;
};

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
 * If the stone's bottom tip would cross the footer, push the center up
 * so the tip stays just above the footer edge.
 */
const clampCenterAboveFooter = (
  centerY: number,
  gemHeight: number,
  footerTop: number,
  gap: number,
): number => {
  if (!Number.isFinite(footerTop)) return centerY;
  const maxCenter = footerTop - gap - gemHeight / 2 - FLOAT_PAD;
  return Math.min(centerY, maxCenter);
};

/**
 * Recreates the reference site's scroll choreography: sections reveal as a
 * scene, while one persistent gem travels between section-specific poses.
 */
const ScrollChoreography = () => {
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  const gemRef = useRef<HTMLDivElement>(null);
  const poseRef = useRef<GemPose>(POSES[0]);
  const mobileRef = useRef(false);
  const [active, setActive] = useState(0);
  const [sectionCount, setSectionCount] = useState(0);
  const [mobile, setMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 1023px)").matches : false,
  );
  /** Pixel center Y after footer collision clamp (null = use pose.top as-is). */
  const [safeTopPx, setSafeTopPx] = useState<number | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 1023px)");
    const onChange = () => setMobile(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const pose = useMemo(() => {
    // Contact: keep the stone seated in the hero for the whole page.
    if (pathname === "/contact") {
      return mobile ? CONTACT_HERO_MOBILE_POSE : STANDARD_PAGE_HERO_POSE;
    }

    if (!mobile && active === 0 && STANDARD_PAGE_HERO_PATHS.has(pathname)) {
      return STANDARD_PAGE_HERO_POSE;
    }

    // Firm principles section: vacant right rail (not the left pose shared by other pages).
    if (pathname === "/firm" && active === 2) {
      return mobile ? FIRM_PRINCIPLES_MOBILE_POSE : FIRM_PRINCIPLES_POSE;
    }

    const poses = mobile ? MOBILE_POSES : POSES;
    const base = poses[active % poses.length];
    const isLastSection = sectionCount > 0 && active === sectionCount - 1;

    if (isLastSection) {
      if (!mobile) {
        if (pathname === "/") return HOME_CLOSING_POSE;
        if (STANDARD_PAGE_HERO_PATHS.has(pathname)) return CLOSING_SECTION_POSE;
        return { ...base, top: "46vh", width: Math.round(base.width * 0.94) };
      }

      if (pathname === "/") return HOME_CLOSING_MOBILE_POSE;
      return {
        ...base,
        left: "78vw",
        top: "46%",
        width: Math.round(base.width * 0.72),
        opacity: Math.min(base.opacity, 0.58),
      };
    }

    if (mobile) {
      return {
        ...base,
        width: Math.min(base.width, 180),
      };
    }

    return base;
  }, [active, mobile, pathname, sectionCount]);

  poseRef.current = pose;
  mobileRef.current = mobile;

  useEffect(() => {
    let observer: IntersectionObserver | undefined;
    let mutationObserver: MutationObserver | undefined;
    let setupFrame = 0;
    let scrollFrame = 0;
    let rebindFrame = 0;
    let rebindTimer = 0;
    let sections: HTMLElement[] = [];

    const syncActive = () => {
      if (reduce || sections.length === 0) return;
      setActive(pickActiveSection(sections));
    };

    const syncFooterClearance = () => {
      const current = poseRef.current;
      const isMobile = mobileRef.current;
      const footer = document.querySelector<HTMLElement>("footer.site-footer");
      const viewportH = window.innerHeight;
      const desiredCenter = resolveLengthPx(current.top, viewportH);
      const measuredH = gemRef.current?.offsetHeight;
      const gemHeight = measuredH && measuredH > 0 ? measuredH : current.width * GEM_HEIGHT_RATIO;
      const footerTop = footer ? footer.getBoundingClientRect().top : Number.POSITIVE_INFINITY;
      const gap = isMobile ? FOOTER_GAP_MOBILE : FOOTER_GAP_DESKTOP;

      // Footer still well below the viewport — keep authored units (vh/rem/%).
      if (footerTop > viewportH + gemHeight * 0.35) {
        setSafeTopPx((prev) => (prev === null ? prev : null));
        return;
      }

      const clamped = clampCenterAboveFooter(desiredCenter, gemHeight, footerTop, gap);
      setSafeTopPx((prev) => (prev !== null && Math.abs(prev - clamped) < 0.5 ? prev : clamped));
    };

    const onScrollOrResize = () => {
      cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(() => {
        syncActive();
        syncFooterClearance();
      });
    };

    const bindSections = () => {
      const next = Array.from(document.querySelectorAll<HTMLElement>("main section"));
      const changed =
        next.length !== sections.length || next.some((section, index) => section !== sections[index]);
      if (!changed && sections.length > 0) {
        syncFooterClearance();
        return;
      }

      observer?.disconnect();
      sections = next;
      setSectionCount(sections.length);
      sections.forEach((section, index) => {
        section.classList.add("scroll-scene");
        section.style.setProperty("--scene-index", String(index));
      });

      if (reduce) {
        sections.forEach((section) => section.classList.add("scene-visible"));
        syncFooterClearance();
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
      syncFooterClearance();
    };

    setupFrame = requestAnimationFrame(() => {
      setActive(0);
      bindSections();

      window.addEventListener("scroll", onScrollOrResize, { passive: true });
      window.addEventListener("resize", onScrollOrResize, { passive: true });

      // Lazy routes / late DOM: rebind when main children change so the gem keeps tracking.
      const main = document.querySelector("main");
      if (main && typeof MutationObserver !== "undefined") {
        // Framer-motion / AnimatePresence mount-unmounts fire bursts of childList
        // mutations under <main>; coalesce a burst into a single trailing rebind
        // instead of scheduling a bindSections rAF per mutation batch.
        const scheduleRebind = () => {
          window.clearTimeout(rebindTimer);
          rebindTimer = window.setTimeout(() => {
            cancelAnimationFrame(rebindFrame);
            rebindFrame = requestAnimationFrame(bindSections);
          }, 120);
        };
        mutationObserver = new MutationObserver(scheduleRebind);
        mutationObserver.observe(main, { childList: true, subtree: true });
      }
    });

    return () => {
      cancelAnimationFrame(setupFrame);
      cancelAnimationFrame(scrollFrame);
      cancelAnimationFrame(rebindFrame);
      window.clearTimeout(rebindTimer);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      observer?.disconnect();
      mutationObserver?.disconnect();
    };
  }, [pathname, reduce]);

  // Re-clamp when the authored pose changes (section / breakpoint), even without scroll.
  useEffect(() => {
    const footer = document.querySelector<HTMLElement>("footer.site-footer");
    const viewportH = window.innerHeight;
    const desiredCenter = resolveLengthPx(pose.top, viewportH);
    const measuredH = gemRef.current?.offsetHeight;
    const gemHeight = measuredH && measuredH > 0 ? measuredH : pose.width * GEM_HEIGHT_RATIO;
    const footerTop = footer ? footer.getBoundingClientRect().top : Number.POSITIVE_INFINITY;
    const gap = mobile ? FOOTER_GAP_MOBILE : FOOTER_GAP_DESKTOP;

    if (footerTop > viewportH + gemHeight * 0.35) {
      setSafeTopPx(null);
      return;
    }

    setSafeTopPx(clampCenterAboveFooter(desiredCenter, gemHeight, footerTop, gap));
  }, [pose.top, pose.width, mobile, active, pathname]);

  // Keep the stone visible under prefers-reduced-motion — only skip motion, not the asset.
  const visibleOpacity = Math.max(pose.opacity, 0.72);
  const animatedTop = safeTopPx !== null ? `${safeTopPx}px` : pose.top;

  return (
    <motion.div
      ref={gemRef}
      aria-hidden
      className="scroll-gem pointer-events-none fixed -translate-x-1/2 -translate-y-1/2"
      initial={false}
      animate={{
        left: pose.left,
        top: animatedTop,
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
